import { getDatabase } from './database';
import { StudySession } from '@/types/database';

export function recordStudySession(
  pdfId: number | null,
  categoryId: number | null,
  durationSeconds: number,
  sessionType: string = 'pomodoro'
): StudySession {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.runSync(
    `
    INSERT INTO study_sessions (pdf_id, category_id, duration_seconds, session_type, completed_at)
    VALUES (?, ?, ?, ?, ?)
  `,
    [pdfId ?? null, categoryId ?? null, durationSeconds, sessionType, now]
  );

  return {
    id: result.lastInsertRowId,
    pdf_id: pdfId,
    category_id: categoryId,
    duration_seconds: durationSeconds,
    session_type: sessionType,
    completed_at: now,
  };
}

export function getTodayStudySeconds(): number {
  const db = getDatabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const res = db.getFirstSync<{ total: number }>(
    `
    SELECT COALESCE(SUM(duration_seconds), 0) as total
    FROM study_sessions
    WHERE completed_at >= ?
  `,
    [todayStart.toISOString()]
  );

  return res?.total ?? 0;
}

export function getTotalStudySeconds(): number {
  const db = getDatabase();
  const res = db.getFirstSync<{ total: number }>(`
    SELECT COALESCE(SUM(duration_seconds), 0) as total
    FROM study_sessions
  `);
  return res?.total ?? 0;
}

export function getRecentStudySessions(limit: number = 10): StudySession[] {
  const db = getDatabase();
  return db.getAllSync<StudySession>(
    `
    SELECT s.*, p.title as pdf_title, c.name as category_name
    FROM study_sessions s
    LEFT JOIN pdf_documents p ON p.id = s.pdf_id
    LEFT JOIN categories c ON c.id = s.category_id
    ORDER BY s.id DESC
    LIMIT ?
  `,
    [limit]
  );
}
