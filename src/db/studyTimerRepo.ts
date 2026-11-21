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

export function getStudyStreakDays(): number {
  const db = getDatabase();
  try {
    const rows = db.getAllSync<{ day: string }>(`
      SELECT DISTINCT substr(completed_at, 1, 10) as day
      FROM study_sessions
      ORDER BY day DESC
      LIMIT 30
    `);

    if (rows.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    let checkDate = rows[0].day === today ? today : rows[0].day === yesterday ? yesterday : null;
    if (!checkDate) return 0;

    const daySet = new Set(rows.map((r) => r.day));
    const curr = new Date(checkDate);

    while (true) {
      const dStr = curr.toISOString().slice(0, 10);
      if (daySet.has(dStr)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(1, streak);
  } catch {
    return 1;
  }
}

export function getStudyTrackingSummary(): {
  todayMinutes: number;
  totalHours: number;
  streakDays: number;
  totalPagesRead: number;
} {
  const db = getDatabase();
  const todaySecs = getTodayStudySeconds();
  const totalSecs = getTotalStudySeconds();
  const streak = getStudyStreakDays();

  const pagesRes = db.getFirstSync<{ total_pages: number }>(`
    SELECT COALESCE(SUM(last_read_page), 0) as total_pages
    FROM pdf_documents
    WHERE is_deleted = 0
  `);

  return {
    todayMinutes: Math.round(todaySecs / 60),
    totalHours: Math.round((totalSecs / 3600) * 10) / 10,
    streakDays: streak,
    totalPagesRead: pagesRes?.total_pages ?? 0,
  };
}
