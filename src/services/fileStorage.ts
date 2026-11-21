import * as FileSystem from 'expo-file-system/legacy';

const PDF_SUBDIR = 'studyvault_pdfs/';

export function getPdfStorageDirectory(): string {
  const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!docDir) {
    throw new Error('Storage directory not available on this device');
  }
  const base = docDir.endsWith('/') ? docDir : `${docDir}/`;
  return `${base}${PDF_SUBDIR}`;
}

export async function ensurePdfDirectoryExists(): Promise<string> {
  const dir = getPdfStorageDirectory();
  try {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (e) {
    console.warn('Error creating PDF directory:', e);
  }
  return dir;
}

export function sanitizeFileName(name: string): string {
  if (!name) return `document_${Date.now()}.pdf`;
  const clean = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.endsWith('.pdf') ? clean : `${clean}.pdf`;
}

export async function copyPdfToAppStorage(
  sourceUri: string,
  originalFilename?: string
): Promise<{ localPath: string; fileSize: number }> {
  await ensurePdfDirectoryExists();
  const dir = getPdfStorageDirectory();

  const safeFilename = originalFilename || `document_${Date.now()}.pdf`;
  const sanitized = sanitizeFileName(safeFilename);
  const timestamp = Date.now();
  const targetFilename = `${timestamp}_${sanitized}`;
  const targetPath = `${dir}${targetFilename}`;

  let copied = false;

  // Attempt 1: Direct native copyAsync (handles content:// and internal file:// natively)
  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetPath,
    });
    copied = true;
  } catch (copyErr) {
    console.warn('Native copyAsync failed, attempting chunked fetch fallback:', copyErr);
  }

  // Attempt 2: React Native fetch() blob slicing (chunked copy to prevent OOM on large files)
  if (!copied) {
    try {
      const response = await fetch(sourceUri);
      const blob = await response.blob();
      const totalSize = blob.size;
      const CHUNK_SIZE = 512 * 1024; // 512 KB per slice

      // Remove partially existing target if any
      const existing = await FileSystem.getInfoAsync(targetPath);
      if (existing.exists) {
        await FileSystem.deleteAsync(targetPath, { idempotent: true });
      }

      for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
        const slice = blob.slice(offset, offset + CHUNK_SIZE);
        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            const commaIdx = res ? res.indexOf(',') : -1;
            resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res || '');
          };
          reader.onerror = () => reject(new Error('FileReader slice read failed'));
          reader.readAsDataURL(slice);
        });

        await FileSystem.writeAsStringAsync(targetPath, chunkBase64, {
          encoding: FileSystem.EncodingType.Base64,
          append: offset > 0,
        });
      }
      copied = true;
    } catch (fetchErr) {
      console.warn('Chunked fetch blob slice fallback failed, attempting chunked readAsStringAsync:', fetchErr);
    }
  }

  // Attempt 3: Direct base64 chunked reading via FileSystem
  if (!copied) {
    try {
      const CHUNK_SIZE = 512 * 1024;
      let offset = 0;
      let hasMore = true;

      const existing = await FileSystem.getInfoAsync(targetPath);
      if (existing.exists) {
        await FileSystem.deleteAsync(targetPath, { idempotent: true });
      }

      while (hasMore) {
        const chunk = await FileSystem.readAsStringAsync(sourceUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: offset,
          length: CHUNK_SIZE,
        });
        if (!chunk || chunk.length === 0) {
          hasMore = false;
          break;
        }
        await FileSystem.writeAsStringAsync(targetPath, chunk, {
          encoding: FileSystem.EncodingType.Base64,
          append: offset > 0,
        });
        offset += CHUNK_SIZE;
        if (chunk.length < 500000) {
          hasMore = false;
        }
      }
      copied = true;
    } catch (streamErr) {
      console.error('All copy strategies failed for PDF:', streamErr);
      throw new Error(`Could not access or copy the selected file: ${(streamErr as any)?.message || 'Unknown error'}`);
    }
  }

  let fileSize = 0;
  try {
    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    fileSize = fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number' ? fileInfo.size : 0;
  } catch {
    fileSize = 0;
  }

  return {
    localPath: targetPath,
    fileSize,
  };
}

export async function checkFileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

export async function deletePdfFromAppStorage(localPath: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to delete file from local storage:', error);
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}
