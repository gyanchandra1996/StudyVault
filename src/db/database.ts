import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import {
  SCHEMA_TABLES_SQL,
  SCHEMA_INDEXES_SQL,
  SEED_CATEGORIES,
  SEED_EXAMS,
  SEED_QUESTIONS,
} from './schema';

const DB_NAME = 'studyvault.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (dbInstance) {
    try {
      // Validate that the underlying native SQLite connection is still open and healthy
      dbInstance.getFirstSync('SELECT 1');
      return dbInstance;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (
        msg.includes('closed resource') ||
        msg.includes('NullPointerException') ||
        msg.includes('is closed') ||
        msg.includes('already closed')
      ) {
        console.warn('SQLite connection was invalidated or closed. Reopening database...', msg);
        try {
          dbInstance.closeSync();
        } catch {}
        dbInstance = null;
      } else {
        throw err;
      }
    }
  }

  dbInstance = SQLite.openDatabaseSync(DB_NAME);
  initDatabase(dbInstance);
  return dbInstance;
}

export function resetDatabaseConnection(): void {
  try {
    if (dbInstance) {
      dbInstance.closeSync();
    }
  } catch {}
  dbInstance = null;
}

export function initDatabase(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync('PRAGMA foreign_keys = ON;');

    // 1. Create base tables
    db.execSync(SCHEMA_TABLES_SQL);

    // 2. Run column migrations immediately so columns exist before indexes or queries
    try {
      const tableInfo = db.getAllSync<{ name: string }>('PRAGMA table_info(categories)');
      const hasExamId = tableInfo.some((col) => col.name === 'exam_id');
      if (!hasExamId) {
        db.execSync('ALTER TABLE categories ADD COLUMN exam_id INTEGER;');
      }
    } catch (migErr) {
      console.warn('Category exam_id migration notice:', migErr);
    }

    // Run migration: Ensure is_completed and completed_at exist on pdf_documents
    try {
      const pdfCols = db.getAllSync<{ name: string }>('PRAGMA table_info(pdf_documents)');
      const hasCompleted = pdfCols.some((col) => col.name === 'is_completed');
      if (!hasCompleted) {
        db.execSync('ALTER TABLE pdf_documents ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0;');
      }
      const hasCompletedAt = pdfCols.some((col) => col.name === 'completed_at');
      if (!hasCompletedAt) {
        db.execSync('ALTER TABLE pdf_documents ADD COLUMN completed_at TEXT;');
      }
    } catch (migErr) {
      console.warn('PDF is_completed migration check notice:', migErr);
    }

    // 3. Create indexes safely now that tables and columns exist
    try {
      db.execSync(SCHEMA_INDEXES_SQL);
    } catch (idxErr) {
      console.warn('Index creation notice:', idxErr);
    }

    // 4. Normalize any stale Expo Go ExperienceData paths in pdf_documents
    try {
      const currentDocDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (currentDocDir) {
        const match = currentDocDir.match(/ExperienceData\/([^/]+)/);
        if (match && match[1]) {
          const currentExpId = match[1];
          const stalePdfs = db.getAllSync<{ id: number; local_path: string }>(
            "SELECT id, local_path FROM pdf_documents WHERE local_path LIKE '%ExperienceData/%'"
          );
          for (const doc of stalePdfs) {
            if (!doc.local_path.includes(currentExpId)) {
              const updatedPath = doc.local_path.replace(
                /ExperienceData\/[^/]+/,
                `ExperienceData/${currentExpId}`
              );
              db.runSync('UPDATE pdf_documents SET local_path = ? WHERE id = ?', [
                updatedPath,
                doc.id,
              ]);
            }
          }
        }
      }
    } catch (pathMigErr) {
      console.warn('PDF path normalization notice:', pathMigErr);
    }

    // Check if initial categories need seeding
    const catResult = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    if (!catResult || catResult.count === 0) {
      seedInitialData(db);
    }

    // Check if exams need seeding
    const examResult = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM exams');
    if (!examResult || examResult.count === 0) {
      seedExamsAndQuestions(db);
    }
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
  }
}

function seedExamsAndQuestions(db: SQLite.SQLiteDatabase): void {
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    const examIdMap: Record<string, number> = {};

    for (const exam of SEED_EXAMS) {
      const res = db.runSync(
        'INSERT INTO exams (name, code, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [exam.name, exam.code, exam.description, exam.icon, exam.color, now]
      );
      examIdMap[exam.name] = Number(res.lastInsertRowId);
    }

    // Seed sample quiz questions
    for (const q of SEED_QUESTIONS) {
      const examId = examIdMap[q.exam_name] || null;
      db.runSync(
        `INSERT INTO quiz_questions 
          (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          examId,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_option,
          q.explanation,
          q.difficulty,
          now,
        ]
      );
    }

    // Associate existing categories to General Study or DSSSB if unassigned (safe subquery across all SQLite versions)
    const defaultExamId = examIdMap['DSSSB'] || Object.values(examIdMap)[0];
    if (defaultExamId) {
      db.runSync(
        'UPDATE categories SET exam_id = ? WHERE id IN (SELECT id FROM categories WHERE exam_id IS NULL LIMIT 2)',
        [defaultExamId]
      );
    }
  });
}

function seedInitialData(db: SQLite.SQLiteDatabase): void {
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    for (const cat of SEED_CATEGORIES) {
      const catResult = db.runSync(
        'INSERT INTO categories (name, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?)',
        [cat.name, cat.description, cat.icon, cat.color, now]
      );

      const categoryId = catResult.lastInsertRowId;
      for (const sub of cat.subcategories) {
        db.runSync(
          'INSERT INTO subcategories (category_id, name, created_at) VALUES (?, ?, ?)',
          [categoryId, sub, now]
        );
      }
    }
  });
}
