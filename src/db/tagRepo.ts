import { getDatabase } from './database';
import { Tag } from '@/types/database';

export function getAllTags(): Tag[] {
  const db = getDatabase();
  return db.getAllSync<Tag>('SELECT * FROM tags ORDER BY name ASC');
}

export function createTag(name: string): Tag {
  const db = getDatabase();
  const cleanName = name.trim();
  const existing = db.getFirstSync<Tag>('SELECT * FROM tags WHERE name = ?', [cleanName]);
  if (existing) return existing;

  const res = db.runSync('INSERT INTO tags (name) VALUES (?)', [cleanName]);
  return { id: res.lastInsertRowId, name: cleanName };
}

export function deleteTag(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM tags WHERE id = ?', [id]);
}

export function attachTagToPdf(pdfId: number, tagId: number): void {
  const db = getDatabase();
  db.runSync('INSERT OR IGNORE INTO pdf_tags (pdf_id, tag_id) VALUES (?, ?)', [pdfId, tagId]);
}

export function detachTagFromPdf(pdfId: number, tagId: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM pdf_tags WHERE pdf_id = ? AND tag_id = ?', [pdfId, tagId]);
}

export function getTagsForPdf(pdfId: number): Tag[] {
  const db = getDatabase();
  return db.getAllSync<Tag>(
    `
    SELECT t.* 
    FROM tags t
    JOIN pdf_tags pt ON pt.tag_id = t.id
    WHERE pt.pdf_id = ?
    ORDER BY t.name ASC
  `,
    [pdfId]
  );
}
