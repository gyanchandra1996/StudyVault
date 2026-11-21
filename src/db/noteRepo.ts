import { getDatabase } from './database';
import { PersonalNote } from '@/types/database';

export function getNotesByPdf(pdfId: number): PersonalNote[] {
  const db = getDatabase();
  return db.getAllSync<PersonalNote>(
    'SELECT * FROM personal_notes WHERE pdf_id = ? ORDER BY page_number ASC, updated_at DESC',
    [pdfId]
  );
}

export function getAllNotes(search?: string): PersonalNote[] {
  const db = getDatabase();
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db.getAllSync<PersonalNote>(
      `
      SELECT n.*, p.title as pdf_title
      FROM personal_notes n
      JOIN pdf_documents p ON p.id = n.pdf_id
      WHERE p.is_deleted = 0 AND (n.note LIKE ? OR p.title LIKE ?)
      ORDER BY n.updated_at DESC
    `,
      [term, term]
    );
  }

  return db.getAllSync<PersonalNote>(`
    SELECT n.*, p.title as pdf_title
    FROM personal_notes n
    JOIN pdf_documents p ON p.id = n.pdf_id
    WHERE p.is_deleted = 0
    ORDER BY n.updated_at DESC
  `);
}

export function addNote(pdfId: number, pageNumber: number, note: string): PersonalNote {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.runSync(
    'INSERT INTO personal_notes (pdf_id, page_number, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [pdfId, pageNumber, note.trim(), now, now]
  );

  return {
    id: result.lastInsertRowId,
    pdf_id: pdfId,
    page_number: pageNumber,
    note: note.trim(),
    created_at: now,
    updated_at: now,
  };
}

export function updateNote(id: number, note: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync('UPDATE personal_notes SET note = ?, updated_at = ? WHERE id = ?', [
    note.trim(),
    now,
    id,
  ]);
}

export function deleteNote(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM personal_notes WHERE id = ?', [id]);
}
