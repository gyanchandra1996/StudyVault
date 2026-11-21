import { getDatabase } from './database';
import { Bookmark } from '@/types/database';

export function getBookmarksByPdf(pdfId: number): Bookmark[] {
  const db = getDatabase();
  return db.getAllSync<Bookmark>(
    'SELECT * FROM bookmarks WHERE pdf_id = ? ORDER BY page_number ASC',
    [pdfId]
  );
}

export function getAllBookmarks(): Bookmark[] {
  const db = getDatabase();
  return db.getAllSync<Bookmark>(`
    SELECT b.*, p.title as pdf_title
    FROM bookmarks b
    JOIN pdf_documents p ON p.id = b.pdf_id
    WHERE p.is_deleted = 0
    ORDER BY b.created_at DESC
  `);
}

export function isPageBookmarked(pdfId: number, pageNumber: number): boolean {
  const db = getDatabase();
  const res = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM bookmarks WHERE pdf_id = ? AND page_number = ?',
    [pdfId, pageNumber]
  );
  return (res?.count ?? 0) > 0;
}

export function addBookmark(pdfId: number, pageNumber: number, title?: string): Bookmark {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Remove existing if any on same page
  db.runSync('DELETE FROM bookmarks WHERE pdf_id = ? AND page_number = ?', [pdfId, pageNumber]);

  const result = db.runSync(
    'INSERT INTO bookmarks (pdf_id, page_number, title, created_at) VALUES (?, ?, ?, ?)',
    [pdfId, pageNumber, title?.trim() || null, now]
  );

  return {
    id: result.lastInsertRowId,
    pdf_id: pdfId,
    page_number: pageNumber,
    title: title?.trim() || null,
    created_at: now,
  };
}

export function removeBookmark(pdfId: number, pageNumber: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM bookmarks WHERE pdf_id = ? AND page_number = ?', [pdfId, pageNumber]);
}

export function deleteBookmarkById(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM bookmarks WHERE id = ?', [id]);
}
