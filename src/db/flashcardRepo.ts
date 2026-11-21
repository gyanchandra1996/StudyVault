import { getDatabase } from './database';
import { Flashcard } from '@/types/database';

export function createFlashcard(
  pdfId: number | null,
  question: string,
  answer: string,
  highlightId?: number | null
): Flashcard {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.runSync(
    `
    INSERT INTO flashcards (pdf_id, highlight_id, question, answer, ease_factor, interval_days, repetitions, next_review_date, created_at)
    VALUES (?, ?, ?, ?, 2.5, 0, 0, ?, ?)
  `,
    [pdfId, highlightId ?? null, question.trim(), answer.trim(), now, now]
  );

  return {
    id: result.lastInsertRowId,
    pdf_id: pdfId,
    highlight_id: highlightId ?? null,
    question: question.trim(),
    answer: answer.trim(),
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_date: now,
    created_at: now,
  };
}

export function getAllFlashcards(pdfId?: number): Flashcard[] {
  const db = getDatabase();
  if (pdfId) {
    return db.getAllSync<Flashcard>(
      `
      SELECT f.*, p.title as pdf_title
      FROM flashcards f
      LEFT JOIN pdf_documents p ON p.id = f.pdf_id
      WHERE f.pdf_id = ?
      ORDER BY f.id DESC
    `,
      [pdfId]
    );
  }

  return db.getAllSync<Flashcard>(`
    SELECT f.*, p.title as pdf_title
    FROM flashcards f
    LEFT JOIN pdf_documents p ON p.id = f.pdf_id
    ORDER BY f.id DESC
  `);
}

export function getDueFlashcards(): Flashcard[] {
  const db = getDatabase();
  const now = new Date().toISOString();
  return db.getAllSync<Flashcard>(
    `
    SELECT f.*, p.title as pdf_title
    FROM flashcards f
    LEFT JOIN pdf_documents p ON p.id = f.pdf_id
    WHERE f.next_review_date IS NULL OR f.next_review_date <= ?
    ORDER BY f.next_review_date ASC
  `,
    [now]
  );
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * quality: 0 (Again/Forgot), 1 (Hard), 2 (Good), 3 (Easy)
 */
export function reviewFlashcard(id: number, quality: number): void {
  const db = getDatabase();
  const card = db.getFirstSync<Flashcard>('SELECT * FROM flashcards WHERE id = ?', [id]);
  if (!card) return;

  let { ease_factor, interval_days, repetitions } = card;

  if (quality >= 2) {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval_days = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
  ease_factor = ease_factor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval_days);
  const nextReviewDate = nextDate.toISOString();

  db.runSync(
    `
    UPDATE flashcards 
    SET ease_factor = ?, interval_days = ?, repetitions = ?, next_review_date = ?
    WHERE id = ?
  `,
    [ease_factor, interval_days, repetitions, nextReviewDate, id]
  );
}

export function deleteFlashcard(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM flashcards WHERE id = ?', [id]);
}
