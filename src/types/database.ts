export interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  created_at: string;
  pdf_count?: number;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  created_at: string;
  pdf_count?: number;
  category_name?: string;
  category_color?: string;
}

export interface PdfDocument {
  id: number;
  category_id?: number | null;
  subcategory_id?: number | null;
  title: string;
  original_filename: string;
  local_path: string;
  file_size: number;
  page_count: number;
  is_favorite: number; // 0 or 1
  last_read_page: number;
  last_opened_at?: string | null;
  created_at: string;
  is_deleted: number; // 0 or 1 for recycle bin
  deleted_at?: string | null;
  // Joined fields
  category_name?: string | null;
  category_color?: string | null;
  subcategory_name?: string | null;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange' | 'purple';
export type AnnotationType = 'highlight' | 'underline' | 'strikethrough';

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationData {
  type: AnnotationType;
  rects: HighlightRect[];
  note?: string;
  normalized?: boolean;
}

export interface Highlight {
  id: number;
  pdf_id: number;
  page_number: number;
  selected_text: string;
  color: HighlightColor | string;
  annotation_data: string; // JSON encoded AnnotationData
  created_at: string;
}

export interface Bookmark {
  id: number;
  pdf_id: number;
  page_number: number;
  title?: string | null;
  created_at: string;
  pdf_title?: string;
}

export interface PersonalNote {
  id: number;
  pdf_id: number;
  page_number: number;
  note: string;
  created_at: string;
  updated_at: string;
  pdf_title?: string;
}

export interface ReadingHistoryItem {
  id: number;
  pdf_id: number;
  last_read_page: number;
  progress_percentage: number;
  last_opened_at: string;
  pdf_title?: string;
  original_filename?: string;
  page_count?: number;
  category_name?: string;
  category_color?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PdfTag {
  pdf_id: number;
  tag_id: number;
}

export interface StorageBreakdown {
  totalPdfBytes: number;
  pdfCount: number;
  recycledPdfCount: number;
  recycledPdfBytes: number;
  totalNotesCount: number;
  totalHighlightsCount: number;
  totalBookmarksCount: number;
  categoriesCount: number;
  subcategoriesCount: number;
}

export interface Flashcard {
  id: number;
  pdf_id?: number | null;
  highlight_id?: number | null;
  question: string;
  answer: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date?: string | null;
  created_at: string;
  pdf_title?: string;
}

export interface StudySession {
  id: number;
  pdf_id?: number | null;
  category_id?: number | null;
  duration_seconds: number;
  session_type: string;
  completed_at: string;
  pdf_title?: string;
  category_name?: string;
}

export interface Scratchpad {
  id: number;
  pdf_id: number;
  content: string;
  updated_at: string;
}
