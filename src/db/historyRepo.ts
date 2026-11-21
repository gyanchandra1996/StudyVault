import { getDatabase } from './database';
import { ReadingHistoryItem } from '@/types/database';

export function getReadingHistory(limit: number = 20): ReadingHistoryItem[] {
  const db = getDatabase();
  return db.getAllSync<ReadingHistoryItem>(
    `
    SELECT 
      h.*,
      p.title as pdf_title,
      p.original_filename,
      p.page_count,
      c.name as category_name,
      c.color as category_color
    FROM reading_history h
    JOIN pdf_documents p ON p.id = h.pdf_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_deleted = 0
    ORDER BY h.last_opened_at DESC
    LIMIT ?
  `,
    [limit]
  );
}

export function clearReadingHistory(): void {
  const db = getDatabase();
  db.runSync('DELETE FROM reading_history');
}
