import { getDatabase } from './database';
import { Highlight, HighlightColor, AnnotationData } from '@/types/database';

export function getHighlightsByPdf(pdfId: number): Highlight[] {
  const db = getDatabase();
  return db.getAllSync<Highlight>(
    'SELECT * FROM highlights WHERE pdf_id = ? ORDER BY page_number ASC, created_at ASC',
    [pdfId]
  );
}

export function getHighlightsByPage(pdfId: number, pageNumber: number): Highlight[] {
  const db = getDatabase();
  return db.getAllSync<Highlight>(
    'SELECT * FROM highlights WHERE pdf_id = ? AND page_number = ? ORDER BY created_at ASC',
    [pdfId, pageNumber]
  );
}

export function addHighlight(
  pdfId: number,
  pageNumber: number,
  selectedText: string,
  color: HighlightColor | string,
  annotationData: AnnotationData
): Highlight {
  const db = getDatabase();
  const now = new Date().toISOString();
  const serialized = JSON.stringify(annotationData);

  const result = db.runSync(
    `
    INSERT INTO highlights (pdf_id, page_number, selected_text, color, annotation_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [pdfId, pageNumber, selectedText, color, serialized, now]
  );

  return {
    id: result.lastInsertRowId,
    pdf_id: pdfId,
    page_number: pageNumber,
    selected_text: selectedText,
    color,
    annotation_data: serialized,
    created_at: now,
  };
}

export function updateHighlightNote(
  id: number,
  note: string,
  color?: HighlightColor | string
): void {
  const db = getDatabase();
  const current = db.getFirstSync<Highlight>('SELECT * FROM highlights WHERE id = ?', [id]);
  if (!current) return;

  try {
    const data: AnnotationData = JSON.parse(current.annotation_data);
    data.note = note;
    const serialized = JSON.stringify(data);

    if (color) {
      db.runSync('UPDATE highlights SET annotation_data = ?, color = ? WHERE id = ?', [
        serialized,
        color,
        id,
      ]);
    } else {
      db.runSync('UPDATE highlights SET annotation_data = ? WHERE id = ?', [serialized, id]);
    }
  } catch (e) {
    console.warn('Failed to parse annotation data during update:', e);
  }
}

export function deleteHighlight(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM highlights WHERE id = ?', [id]);
}

export function deleteHighlightsByPdf(pdfId: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM highlights WHERE pdf_id = ?', [pdfId]);
}
