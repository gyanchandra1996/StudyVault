import { getDatabase } from './database';
import { PdfDocument, StorageBreakdown } from '@/types/database';
import { deletePdfFromAppStorage } from '@/services/fileStorage';

export interface GetPdfOptions {
  categoryId?: number;
  subcategoryId?: number;
  isFavorite?: boolean;
  search?: string;
  sortBy?: 'name' | 'date' | 'size' | 'recent';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export function getAllPdfs(options: GetPdfOptions = {}): PdfDocument[] {
  const db = getDatabase();
  const params: any[] = [];
  let query = `
    SELECT 
      p.*,
      c.name as category_name,
      c.color as category_color,
      s.name as subcategory_name
    FROM pdf_documents p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN subcategories s ON s.id = p.subcategory_id
    WHERE p.is_deleted = 0
  `;

  if (options.categoryId !== undefined) {
    query += ' AND p.category_id = ?';
    params.push(options.categoryId);
  }

  if (options.subcategoryId !== undefined) {
    query += ' AND p.subcategory_id = ?';
    params.push(options.subcategoryId);
  }

  if (options.isFavorite !== undefined) {
    query += ' AND p.is_favorite = ?';
    params.push(options.isFavorite ? 1 : 0);
  }

  if (options.search && options.search.trim()) {
    query += ' AND (p.title LIKE ? OR p.original_filename LIKE ?)';
    const term = `%${options.search.trim()}%`;
    params.push(term, term);
  }

  const order = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
  switch (options.sortBy) {
    case 'name':
      query += ` ORDER BY p.title ${order}`;
      break;
    case 'size':
      query += ` ORDER BY p.file_size ${order}`;
      break;
    case 'recent':
      query += ` ORDER BY COALESCE(p.last_opened_at, p.created_at) ${order}`;
      break;
    case 'date':
    default:
      query += ` ORDER BY p.created_at ${order}`;
      break;
  }

  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.getAllSync<PdfDocument>(query, params);
}

export function getPdfById(id: number): PdfDocument | null {
  const db = getDatabase();
  try {
    return db.getFirstSync<PdfDocument>(
      `
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color,
        s.name as subcategory_name
      FROM pdf_documents p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN subcategories s ON s.id = p.subcategory_id
      WHERE p.id = ?
    `,
      [id]
    );
  } catch (err: any) {
    if (String(err?.message || '').includes('closed resource')) {
      const freshDb = getDatabase();
      return freshDb.getFirstSync<PdfDocument>(
        `
        SELECT 
          p.*,
          c.name as category_name,
          c.color as category_color,
          s.name as subcategory_name
        FROM pdf_documents p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN subcategories s ON s.id = p.subcategory_id
        WHERE p.id = ?
      `,
        [id]
      );
    }
    throw err;
  }
}

export function findPdfByFilenameAndSize(
  originalFilename: string,
  fileSize: number
): PdfDocument | null {
  const db = getDatabase();
  return db.getFirstSync<PdfDocument>(
    `SELECT * FROM pdf_documents WHERE original_filename = ? AND file_size = ? AND is_deleted = 0`,
    [originalFilename, fileSize]
  );
}

export function createPdf(params: {
  categoryId?: number | null;
  subcategoryId?: number | null;
  title: string;
  originalFilename: string;
  localPath: string;
  fileSize: number;
  pageCount?: number;
}): PdfDocument {
  const db = getDatabase();
  const now = new Date().toISOString();
  const result = db.runSync(
    `
    INSERT INTO pdf_documents (
      category_id, subcategory_id, title, original_filename, 
      local_path, file_size, page_count, is_favorite, 
      last_read_page, created_at, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?, 0)
  `,
    [
      params.categoryId ?? null,
      params.subcategoryId ?? null,
      params.title.trim(),
      params.originalFilename,
      params.localPath,
      params.fileSize,
      params.pageCount ?? 0,
      now,
    ]
  );

  return getPdfById(result.lastInsertRowId)!;
}

export function updatePdf(
  id: number,
  params: {
    title?: string;
    categoryId?: number | null;
    subcategoryId?: number | null;
    pageCount?: number;
  }
): void {
  const db = getDatabase();
  const updates: string[] = [];
  const values: any[] = [];

  if (params.title !== undefined) {
    updates.push('title = ?');
    values.push(params.title.trim());
  }
  if (params.categoryId !== undefined) {
    updates.push('category_id = ?');
    values.push(params.categoryId);
  }
  if (params.subcategoryId !== undefined) {
    updates.push('subcategory_id = ?');
    values.push(params.subcategoryId);
  }
  if (params.pageCount !== undefined) {
    updates.push('page_count = ?');
    values.push(params.pageCount);
  }

  if (updates.length > 0) {
    values.push(id);
    db.runSync(`UPDATE pdf_documents SET ${updates.join(', ')} WHERE id = ?`, values);
  }
}

export function toggleFavorite(id: number): boolean {
  const db = getDatabase();
  const current = db.getFirstSync<{ is_favorite: number }>(
    'SELECT is_favorite FROM pdf_documents WHERE id = ?',
    [id]
  );
  if (!current) return false;
  const next = current.is_favorite === 1 ? 0 : 1;
  db.runSync('UPDATE pdf_documents SET is_favorite = ? WHERE id = ?', [next, id]);
  return next === 1;
}

export function updateReadingProgress(id: number, lastReadPage: number, pageCount?: number): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  if (pageCount && pageCount > 0) {
    db.runSync(
      `
      UPDATE pdf_documents 
      SET last_read_page = ?, page_count = ?, last_opened_at = ? 
      WHERE id = ?
    `,
      [lastReadPage, pageCount, now, id]
    );
  } else {
    db.runSync(
      `
      UPDATE pdf_documents 
      SET last_read_page = ?, last_opened_at = ? 
      WHERE id = ?
    `,
      [lastReadPage, now, id]
    );
  }

  // Also log into reading_history
  const totalPages = pageCount ?? 1;
  const progressPercentage = Math.min(100, (lastReadPage / (totalPages > 0 ? totalPages : 1)) * 100);
  db.runSync(
    `
    INSERT INTO reading_history (pdf_id, last_read_page, progress_percentage, last_opened_at)
    VALUES (?, ?, ?, ?)
  `,
    [id, lastReadPage, progressPercentage, now]
  );
}

export function softDeletePdf(id: number): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE pdf_documents SET is_deleted = 1, deleted_at = ? WHERE id = ?', [now, id]);
}

export function restorePdf(id: number): void {
  const db = getDatabase();
  db.runSync('UPDATE pdf_documents SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [id]);
}

export async function permanentlyDeletePdf(id: number): Promise<void> {
  const db = getDatabase();
  const pdf = db.getFirstSync<{ local_path: string }>(
    'SELECT local_path FROM pdf_documents WHERE id = ?',
    [id]
  );
  if (pdf && pdf.local_path) {
    await deletePdfFromAppStorage(pdf.local_path);
  }
  db.runSync('DELETE FROM pdf_documents WHERE id = ?', [id]);
}

export function getRecycledPdfs(): PdfDocument[] {
  const db = getDatabase();
  return db.getAllSync<PdfDocument>(`
    SELECT 
      p.*,
      c.name as category_name,
      c.color as category_color,
      s.name as subcategory_name
    FROM pdf_documents p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN subcategories s ON s.id = p.subcategory_id
    WHERE p.is_deleted = 1
    ORDER BY p.deleted_at DESC
  `);
}

export function getRecentPdfs(limit: number = 10): PdfDocument[] {
  return getAllPdfs({ sortBy: 'recent', sortOrder: 'desc', limit });
}

export function getFavoritePdfs(): PdfDocument[] {
  return getAllPdfs({ isFavorite: true, sortBy: 'name', sortOrder: 'asc' });
}

export function getTotalPdfsCount(): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM pdf_documents WHERE is_deleted = 0'
  );
  return result?.count ?? 0;
}

export function getStorageBreakdown(): StorageBreakdown {
  const db = getDatabase();
  const activePdfs = db.getFirstSync<{ totalBytes: number; count: number }>(`
    SELECT COALESCE(SUM(file_size), 0) as totalBytes, COUNT(*) as count 
    FROM pdf_documents 
    WHERE is_deleted = 0
  `);

  const recycledPdfs = db.getFirstSync<{ totalBytes: number; count: number }>(`
    SELECT COALESCE(SUM(file_size), 0) as totalBytes, COUNT(*) as count 
    FROM pdf_documents 
    WHERE is_deleted = 1
  `);

  const notesCount =
    db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM personal_notes')?.count ?? 0;
  const highlightsCount =
    db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM highlights')?.count ?? 0;
  const bookmarksCount =
    db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM bookmarks')?.count ?? 0;
  const catCount =
    db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories')?.count ?? 0;
  const subCount =
    db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM subcategories')?.count ?? 0;

  return {
    totalPdfBytes: activePdfs?.totalBytes ?? 0,
    pdfCount: activePdfs?.count ?? 0,
    recycledPdfBytes: recycledPdfs?.totalBytes ?? 0,
    recycledPdfCount: recycledPdfs?.count ?? 0,
    totalNotesCount: notesCount,
    totalHighlightsCount: highlightsCount,
    totalBookmarksCount: bookmarksCount,
    categoriesCount: catCount,
    subcategoriesCount: subCount,
  };
}
