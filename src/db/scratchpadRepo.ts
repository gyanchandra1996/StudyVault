import { getDatabase } from './database';
import { Scratchpad } from '@/types/database';

export function getScratchpad(pdfId: number): Scratchpad | null {
  const db = getDatabase();
  return db.getFirstSync<Scratchpad>(
    'SELECT * FROM scratchpads WHERE pdf_id = ?',
    [pdfId]
  );
}

export function saveScratchpad(pdfId: number, content: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.runSync(
    `
    INSERT INTO scratchpads (pdf_id, content, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(pdf_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
  `,
    [pdfId, content, now]
  );
}
