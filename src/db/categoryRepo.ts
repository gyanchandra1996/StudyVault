import { getDatabase } from './database';
import { Category, Subcategory } from '@/types/database';

export function getAllCategories(): Category[] {
  const db = getDatabase();
  return db.getAllSync<Category>(`
    SELECT c.*, 
      COUNT(DISTINCT p.id) as pdf_count
    FROM categories c
    LEFT JOIN pdf_documents p ON p.category_id = c.id AND p.is_deleted = 0
    GROUP BY c.id
    ORDER BY c.name ASC
  `);
}

export function getCategoryById(id: number): Category | null {
  const db = getDatabase();
  return db.getFirstSync<Category>(
    `
    SELECT c.*, 
      COUNT(DISTINCT p.id) as pdf_count
    FROM categories c
    LEFT JOIN pdf_documents p ON p.category_id = c.id AND p.is_deleted = 0
    WHERE c.id = ?
    GROUP BY c.id
  `,
    [id]
  );
}

export function createCategory(
  name: string,
  description?: string,
  icon: string = 'folder',
  color: string = '#6366F1'
): Category {
  const db = getDatabase();
  const now = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO categories (name, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), description?.trim() || null, icon, color, now]
  );
  return {
    id: result.lastInsertRowId,
    name: name.trim(),
    description: description?.trim() || null,
    icon,
    color,
    created_at: now,
    pdf_count: 0,
  };
}

export function updateCategory(
  id: number,
  name: string,
  description?: string,
  icon?: string,
  color?: string
): void {
  const db = getDatabase();
  db.runSync(
    `
    UPDATE categories 
    SET name = ?, description = ?, icon = COALESCE(?, icon), color = COALESCE(?, color)
    WHERE id = ?
  `,
    [name.trim(), description?.trim() || null, icon ?? null, color ?? null, id]
  );
}

export function deleteCategory(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}

export function getSubcategories(categoryId: number): Subcategory[] {
  const db = getDatabase();
  return db.getAllSync<Subcategory>(
    `
    SELECT s.*, 
      COUNT(DISTINCT p.id) as pdf_count,
      c.name as category_name,
      c.color as category_color
    FROM subcategories s
    JOIN categories c ON c.id = s.category_id
    LEFT JOIN pdf_documents p ON p.subcategory_id = s.id AND p.is_deleted = 0
    WHERE s.category_id = ?
    GROUP BY s.id
    ORDER BY s.name ASC
  `,
    [categoryId]
  );
}

export function getSubcategoryById(id: number): Subcategory | null {
  const db = getDatabase();
  return db.getFirstSync<Subcategory>(
    `
    SELECT s.*, 
      COUNT(DISTINCT p.id) as pdf_count,
      c.name as category_name,
      c.color as category_color
    FROM subcategories s
    JOIN categories c ON c.id = s.category_id
    LEFT JOIN pdf_documents p ON p.subcategory_id = s.id AND p.is_deleted = 0
    WHERE s.id = ?
    GROUP BY s.id
  `,
    [id]
  );
}

export function createSubcategory(categoryId: number, name: string): Subcategory {
  const db = getDatabase();
  const now = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO subcategories (category_id, name, created_at) VALUES (?, ?, ?)',
    [categoryId, name.trim(), now]
  );
  return {
    id: result.lastInsertRowId,
    category_id: categoryId,
    name: name.trim(),
    created_at: now,
    pdf_count: 0,
  };
}

export function updateSubcategory(id: number, name: string): void {
  const db = getDatabase();
  db.runSync('UPDATE subcategories SET name = ? WHERE id = ?', [name.trim(), id]);
}

export function deleteSubcategory(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM subcategories WHERE id = ?', [id]);
}

export function getAllSubcategoriesCount(): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM subcategories');
  return result?.count ?? 0;
}
