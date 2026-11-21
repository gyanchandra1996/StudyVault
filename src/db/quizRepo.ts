import { getDatabase } from './database';
import { QuizQuestion, QuizAttempt, QuizAttemptAnswer, QuizOptionKey } from '@/types/database';

export function getAllQuestions(
  examId?: number | null,
  categoryId?: number | null
): QuizQuestion[] {
  const db = getDatabase();
  let query = `
    SELECT q.*,
      e.name as exam_name,
      c.name as category_name
    FROM quiz_questions q
    LEFT JOIN exams e ON e.id = q.exam_id
    LEFT JOIN categories c ON c.id = q.category_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (examId !== undefined && examId !== null) {
    query += ' AND q.exam_id = ?';
    params.push(examId);
  }

  if (categoryId !== undefined && categoryId !== null) {
    query += ' AND q.category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY q.id DESC';
  return db.getAllSync<QuizQuestion>(query, params);
}

export function createQuestion(data: {
  examId?: number | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: QuizOptionKey;
  explanation?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
}): QuizQuestion {
  const db = getDatabase();
  const now = new Date().toISOString();
  const diff = data.difficulty || 'medium';

  const res = db.runSync(
    `INSERT INTO quiz_questions 
      (exam_id, category_id, subcategory_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.examId ?? null,
      data.categoryId ?? null,
      data.subcategoryId ?? null,
      data.questionText.trim(),
      data.optionA.trim(),
      data.optionB.trim(),
      data.optionC.trim(),
      data.optionD.trim(),
      data.correctOption,
      data.explanation?.trim() || null,
      diff,
      now,
    ]
  );

  return {
    id: Number(res.lastInsertRowId),
    exam_id: data.examId ?? null,
    category_id: data.categoryId ?? null,
    subcategory_id: data.subcategoryId ?? null,
    question_text: data.questionText.trim(),
    option_a: data.optionA.trim(),
    option_b: data.optionB.trim(),
    option_c: data.optionC.trim(),
    option_d: data.optionD.trim(),
    correct_option: data.correctOption,
    explanation: data.explanation?.trim() || null,
    difficulty: diff,
    created_at: now,
  };
}

export function createQuestionsBulk(
  questions: {
    examId?: number | null;
    categoryId?: number | null;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: QuizOptionKey;
    explanation?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard';
  }[]
): number {
  const db = getDatabase();
  const now = new Date().toISOString();
  let count = 0;

  db.withTransactionSync(() => {
    for (const q of questions) {
      if (!q.questionText || !q.optionA || !q.optionB) continue;
      db.runSync(
        `INSERT INTO quiz_questions 
          (exam_id, category_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.examId ?? null,
          q.categoryId ?? null,
          q.questionText.trim(),
          q.optionA.trim(),
          q.optionB.trim(),
          q.optionC?.trim() || '',
          q.optionD?.trim() || '',
          q.correctOption || 'A',
          q.explanation?.trim() || null,
          q.difficulty || 'medium',
          now,
        ]
      );
      count++;
    }
  });

  return count;
}

export function deleteQuestion(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM quiz_questions WHERE id = ?', [id]);
}

export function recordQuizAttempt(data: {
  examId?: number | null;
  categoryId?: number | null;
  title: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  answers: {
    questionId: number;
    selectedOption?: QuizOptionKey | null;
    isCorrect: boolean;
  }[];
}): number {
  const db = getDatabase();
  const now = new Date().toISOString();
  let attemptId = 0;

  db.withTransactionSync(() => {
    const res = db.runSync(
      `INSERT INTO quiz_attempts
        (exam_id, category_id, title, total_questions, correct_count, wrong_count, skipped_count, score_percentage, time_spent_seconds, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.examId ?? null,
        data.categoryId ?? null,
        data.title,
        data.totalQuestions,
        data.correctCount,
        data.wrongCount,
        data.skippedCount,
        data.scorePercentage,
        data.timeSpentSeconds,
        now,
      ]
    );

    attemptId = Number(res.lastInsertRowId);

    for (const ans of data.answers) {
      db.runSync(
        `INSERT INTO quiz_attempt_answers
          (attempt_id, question_id, selected_option, is_correct)
         VALUES (?, ?, ?, ?)`,
        [attemptId, ans.questionId, ans.selectedOption ?? null, ans.isCorrect ? 1 : 0]
      );
    }
  });

  return attemptId;
}

export function getAllQuizAttempts(examId?: number | null): QuizAttempt[] {
  const db = getDatabase();
  let query = `
    SELECT a.*,
      e.name as exam_name,
      c.name as category_name
    FROM quiz_attempts a
    LEFT JOIN exams e ON e.id = a.exam_id
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (examId !== undefined && examId !== null) {
    query += ' AND a.exam_id = ?';
    params.push(examId);
  }
  query += ' ORDER BY a.id DESC LIMIT 50';
  return db.getAllSync<QuizAttempt>(query, params);
}

export function getQuizAttemptDetails(attemptId: number): {
  attempt: QuizAttempt | null;
  answers: QuizAttemptAnswer[];
} {
  const db = getDatabase();
  const attempt = db.getFirstSync<QuizAttempt>(
    `
    SELECT a.*,
      e.name as exam_name,
      c.name as category_name
    FROM quiz_attempts a
    LEFT JOIN exams e ON e.id = a.exam_id
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.id = ?
  `,
    [attemptId]
  );

  const answers = db.getAllSync<QuizAttemptAnswer>(
    `
    SELECT ans.*,
      q.question_text,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_option,
      q.explanation
    FROM quiz_attempt_answers ans
    JOIN quiz_questions q ON q.id = ans.question_id
    WHERE ans.attempt_id = ?
    ORDER BY ans.id ASC
  `,
    [attemptId]
  );

  return { attempt, answers };
}

export function getQuizAnalytics(): {
  totalAttempts: number;
  averageScore: number;
  totalQuestionsAnswered: number;
} {
  const db = getDatabase();
  const res = db.getFirstSync<{
    total_attempts: number;
    avg_score: number;
    total_answered: number;
  }>(`
    SELECT 
      COUNT(*) as total_attempts,
      COALESCE(AVG(score_percentage), 0) as avg_score,
      COALESCE(SUM(total_questions), 0) as total_answered
    FROM quiz_attempts
  `);

  return {
    totalAttempts: res?.total_attempts ?? 0,
    averageScore: Math.round(res?.avg_score ?? 0),
    totalQuestionsAnswered: res?.total_answered ?? 0,
  };
}
