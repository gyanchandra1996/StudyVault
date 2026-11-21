import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, SEED_CATEGORIES } from './schema';

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
    db.execSync(SCHEMA_SQL);

    // Check if initial categories need seeding
    const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    if (!result || result.count === 0) {
      seedInitialData(db);
    }
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
  }
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
