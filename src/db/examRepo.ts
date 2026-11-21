import { getDatabase } from './database';
import { Exam } from '@/types/database';

export function getAllExams(): Exam[] {
  const db = getDatabase();
  try {
    return db.getAllSync<Exam>(`
      SELECT e.*,
        COUNT(DISTINCT c.id) as category_count,
        COUNT(DISTINCT q.id) as question_count
      FROM exams e
      LEFT JOIN categories c ON c.exam_id = e.id
      LEFT JOIN quiz_questions q ON q.exam_id = e.id
      GROUP BY e.id
      ORDER BY e.name ASC
    `);
  } catch (err) {
    console.warn('Notice in getAllExams with category join, trying direct fallback:', err);
    try {
      return db.getAllSync<Exam>('SELECT * FROM exams ORDER BY name ASC');
    } catch {
      return [];
    }
  }
}

export function getExamById(id: number): Exam | null {
  const db = getDatabase();
  try {
    return db.getFirstSync<Exam>(
      `
      SELECT e.*,
        COUNT(DISTINCT c.id) as category_count,
        COUNT(DISTINCT q.id) as question_count
      FROM exams e
      LEFT JOIN categories c ON c.exam_id = e.id
      LEFT JOIN quiz_questions q ON q.exam_id = e.id
      WHERE e.id = ?
      GROUP BY e.id
    `,
      [id]
    );
  } catch (err) {
    console.warn('Notice in getExamById fallback:', err);
    try {
      return db.getFirstSync<Exam>('SELECT * FROM exams WHERE id = ?', [id]);
    } catch {
      return null;
    }
  }
}

export function createExam(
  name: string,
  code?: string,
  description?: string,
  icon: string = 'school-outline',
  color: string = '#2563EB'
): Exam {
  const db = getDatabase();
  const now = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO exams (name, code, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [name.trim(), code?.trim() || null, description?.trim() || null, icon, color, now]
  );
  return {
    id: Number(result.lastInsertRowId),
    name: name.trim(),
    code: code?.trim() || null,
    description: description?.trim() || null,
    icon,
    color,
    created_at: now,
    category_count: 0,
    question_count: 0,
  };
}

export function updateExam(
  id: number,
  name: string,
  code?: string,
  description?: string,
  icon?: string,
  color?: string
): void {
  const db = getDatabase();
  db.runSync(
    `
    UPDATE exams 
    SET name = ?, code = ?, description = ?, icon = COALESCE(?, icon), color = COALESCE(?, color)
    WHERE id = ?
  `,
    [name.trim(), code?.trim() || null, description?.trim() || null, icon ?? null, color ?? null, id]
  );
}

export function deleteExam(id: number): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    // Unlink categories from this exam
    db.runSync('UPDATE categories SET exam_id = NULL WHERE exam_id = ?', [id]);
    // Unlink questions
    db.runSync('UPDATE quiz_questions SET exam_id = NULL WHERE exam_id = ?', [id]);
    // Delete the exam
    db.runSync('DELETE FROM exams WHERE id = ?', [id]);
  });
}
