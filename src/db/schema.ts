export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'folder',
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pdf_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  subcategory_id INTEGER,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  local_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  last_read_page INTEGER NOT NULL DEFAULT 1,
  last_opened_at TEXT,
  created_at TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS highlights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  annotation_data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS personal_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reading_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_id INTEGER NOT NULL,
  last_read_page INTEGER NOT NULL,
  progress_percentage REAL NOT NULL DEFAULT 0,
  last_opened_at TEXT NOT NULL,
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pdf_tags (
  pdf_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (pdf_id, tag_id),
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_id INTEGER,
  highlight_id INTEGER,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_date TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_id INTEGER,
  category_id INTEGER,
  duration_seconds INTEGER NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'pomodoro',
  completed_at TEXT NOT NULL,
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS scratchpads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_id INTEGER UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_category_id ON pdf_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_subcategory_id ON pdf_documents(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_is_favorite ON pdf_documents(is_favorite);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_is_deleted ON pdf_documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_highlights_pdf_id ON highlights(pdf_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_pdf_id ON bookmarks(pdf_id);
CREATE INDEX IF NOT EXISTS idx_personal_notes_pdf_id ON personal_notes(pdf_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_pdf_id ON reading_history(pdf_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_pdf_id ON flashcards(pdf_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_pdf_id ON study_sessions(pdf_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed_at ON study_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_scratchpads_pdf_id ON scratchpads(pdf_id);
`;

export const SEED_CATEGORIES = [
  {
    name: 'Computer Science',
    description: 'Algorithms, Architecture & Systems',
    icon: 'desktop-outline',
    color: '#6366F1',
    subcategories: [
      'Data Structures',
      'Operating System',
      'Computer Networks',
      'Database Management System',
      'Programming Languages',
      'Software Engineering',
    ],
  },
  {
    name: 'Mathematics',
    description: 'Calculus, Linear Algebra & Discrete Math',
    icon: 'calculator-outline',
    color: '#0D9488',
    subcategories: [
      'Calculus I & II',
      'Linear Algebra',
      'Discrete Mathematics',
      'Probability & Statistics',
    ],
  },
  {
    name: 'Mechanical Engineering',
    description: 'Thermodynamics, Mechanics & Robotics',
    icon: 'construct-outline',
    color: '#D97706',
    subcategories: [
      'Thermodynamics',
      'Fluid Mechanics',
      'Theory of Machines',
      'Strength of Materials',
    ],
  },
  {
    name: 'General Knowledge',
    description: 'Current Affairs, Science & World History',
    icon: 'globe-outline',
    color: '#2563EB',
    subcategories: ['Current Affairs', 'World History', 'General Science'],
  },
  {
    name: 'Programming',
    description: 'Fullstack, Mobile & Systems Programming',
    icon: 'code-slash-outline',
    color: '#059669',
    subcategories: ['React & React Native', 'TypeScript & JS', 'Python & AI', 'Rust & Go'],
  },
];
