import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { getDatabase } from '@/db/database';
import { ensurePdfDirectoryExists } from './fileStorage';

export async function exportFullAppBackup(): Promise<string> {
  const db = getDatabase();
  const zip = new JSZip();

  // 1. Gather all database records
  const categories = db.getAllSync('SELECT * FROM categories');
  const subcategories = db.getAllSync('SELECT * FROM subcategories');
  const pdfDocuments = db.getAllSync('SELECT * FROM pdf_documents');
  const highlights = db.getAllSync('SELECT * FROM highlights');
  const bookmarks = db.getAllSync('SELECT * FROM bookmarks');
  const notes = db.getAllSync('SELECT * FROM personal_notes');
  const history = db.getAllSync('SELECT * FROM reading_history');
  const tags = db.getAllSync('SELECT * FROM tags');
  const pdfTags = db.getAllSync('SELECT * FROM pdf_tags');

  const metadata = {
    version: 1,
    exported_at: new Date().toISOString(),
    categories,
    subcategories,
    pdfDocuments,
    highlights,
    bookmarks,
    notes,
    history,
    tags,
    pdfTags,
  };

  zip.file('studyvault_metadata.json', JSON.stringify(metadata, null, 2));

  // 2. Add all local PDF files to the zip
  const pdfsFolder = zip.folder('pdfs');
  const pdfDir = await ensurePdfDirectoryExists();
  const files = await FileSystem.readDirectoryAsync(pdfDir);

  for (const fileName of files) {
    const filePath = `${pdfDir}${fileName}`;
    try {
      const fileBase64 = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      pdfsFolder?.file(fileName, fileBase64, { base64: true });
    } catch (e) {
      console.warn(`Could not add ${fileName} to backup:`, e);
    }
  }

  // 3. Generate ZIP binary as base64
  const zipBase64 = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 4. Save ZIP in cache
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupZipPath = `${FileSystem.cacheDirectory}studyvault_backup_${timestamp}.zip`;

  await FileSystem.writeAsStringAsync(backupZipPath, zipBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 5. Offer to share/save
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(backupZipPath, {
      mimeType: 'application/zip',
      dialogTitle: 'Save StudyVault Backup',
      UTI: 'public.zip-archive',
    });
  }

  return backupZipPath;
}

export async function restoreAppFromBackup(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/octet-stream', 'application/x-zip-compressed'],
      copyToCacheDirectory: true,
    });

    if (picked.canceled || !picked.assets || picked.assets.length === 0) {
      return { success: false, message: 'Restore cancelled.' };
    }

    const zipUri = picked.assets[0].uri;
    const base64 = await FileSystem.readAsStringAsync(zipUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const zip = await JSZip.loadAsync(base64, { base64: true });
    const metadataFile = zip.file('studyvault_metadata.json');

    if (!metadataFile) {
      return {
        success: false,
        message: 'Invalid backup file: studyvault_metadata.json not found inside the ZIP.',
      };
    }

    const metadataText = await metadataFile.async('text');
    const metadata = JSON.parse(metadataText);

    // Ensure PDF storage directory exists
    const pdfDir = await ensurePdfDirectoryExists();

    // Extract all PDF files from the zip
    const pdfFolder = zip.folder('pdfs');
    if (pdfFolder) {
      const entries: { name: string; file: JSZip.JSZipObject }[] = [];
      pdfFolder.forEach((relativePath, file) => {
        if (!file.dir) {
          entries.push({ name: relativePath, file });
        }
      });

      for (const entry of entries) {
        const fileData = await entry.file.async('base64');
        const destPath = `${pdfDir}${entry.name}`;
        await FileSystem.writeAsStringAsync(destPath, fileData, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    }

    // Restore database records in transaction
    const db = getDatabase();
    db.withTransactionSync(() => {
      // Clear existing records
      db.runSync('DELETE FROM pdf_tags');
      db.runSync('DELETE FROM tags');
      db.runSync('DELETE FROM reading_history');
      db.runSync('DELETE FROM personal_notes');
      db.runSync('DELETE FROM bookmarks');
      db.runSync('DELETE FROM highlights');
      db.runSync('DELETE FROM pdf_documents');
      db.runSync('DELETE FROM subcategories');
      db.runSync('DELETE FROM categories');

      // Insert categories
      for (const cat of metadata.categories || []) {
        db.runSync(
          'INSERT INTO categories (id, name, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [cat.id, cat.name, cat.description, cat.icon, cat.color, cat.created_at]
        );
      }

      // Insert subcategories
      for (const sub of metadata.subcategories || []) {
        db.runSync(
          'INSERT INTO subcategories (id, category_id, name, created_at) VALUES (?, ?, ?, ?)',
          [sub.id, sub.category_id, sub.name, sub.created_at]
        );
      }

      // Insert pdfs
      for (const p of metadata.pdfDocuments || []) {
        // Re-anchor path to current device's document directory if needed
        const filename = p.local_path.split('/').pop();
        const freshPath = `${pdfDir}${filename}`;
        db.runSync(
          `
          INSERT INTO pdf_documents (
            id, category_id, subcategory_id, title, original_filename,
            local_path, file_size, page_count, is_favorite, last_read_page,
            last_opened_at, created_at, is_deleted, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            p.id,
            p.category_id,
            p.subcategory_id,
            p.title,
            p.original_filename,
            freshPath,
            p.file_size,
            p.page_count,
            p.is_favorite,
            p.last_read_page,
            p.last_opened_at,
            p.created_at,
            p.is_deleted,
            p.deleted_at,
          ]
        );
      }

      // Insert highlights
      for (const h of metadata.highlights || []) {
        db.runSync(
          `
          INSERT INTO highlights (id, pdf_id, page_number, selected_text, color, annotation_data, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [h.id, h.pdf_id, h.page_number, h.selected_text, h.color, h.annotation_data, h.created_at]
        );
      }

      // Insert bookmarks
      for (const b of metadata.bookmarks || []) {
        db.runSync(
          'INSERT INTO bookmarks (id, pdf_id, page_number, title, created_at) VALUES (?, ?, ?, ?, ?)',
          [b.id, b.pdf_id, b.page_number, b.title, b.created_at]
        );
      }

      // Insert notes
      for (const n of metadata.notes || []) {
        db.runSync(
          'INSERT INTO personal_notes (id, pdf_id, page_number, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [n.id, n.pdf_id, n.page_number, n.note, n.created_at, n.updated_at]
        );
      }
    });

    return {
      success: true,
      message: `Successfully restored ${metadata.pdfDocuments?.length || 0} documents and ${
        metadata.categories?.length || 0
      } categories.`,
    };
  } catch (error: any) {
    console.error('Restore error:', error);
    return {
      success: false,
      message: `Restore failed: ${error?.message || 'Unknown error'}`,
    };
  }
}
