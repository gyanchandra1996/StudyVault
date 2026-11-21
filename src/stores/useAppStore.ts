import { create } from 'zustand';
import { Category, Subcategory, PdfDocument, StorageBreakdown } from '@/types/database';
import * as categoryRepo from '@/db/categoryRepo';
import * as pdfRepo from '@/db/pdfRepo';
import { copyPdfToAppStorage } from '@/services/fileStorage';
import { createAndSaveSamplePdf } from '@/services/samplePdfService';

interface AppStoreState {
  categories: Category[];
  subcategoriesMap: Record<number, Subcategory[]>; // category_id -> Subcategory[]
  pdfs: PdfDocument[];
  recentPdfs: PdfDocument[];
  favoritePdfs: PdfDocument[];
  recycledPdfs: PdfDocument[];
  storageStats: StorageBreakdown | null;
  isLoading: boolean;
  searchQuery: string;
  selectedCategoryFilter: number | null;
  sortBy: 'name' | 'date' | 'size' | 'recent';
  sortOrder: 'asc' | 'desc';

  // Actions
  loadAll: () => Promise<void>;
  refreshCategories: () => void;
  loadSubcategoriesForCategory: (categoryId: number) => void;
  refreshPdfs: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryFilter: (categoryId: number | null) => void;
  setSort: (sortBy: 'name' | 'date' | 'size' | 'recent', sortOrder: 'asc' | 'desc') => void;

  // Category Actions
  addCategory: (
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ) => Promise<Category>;
  editCategory: (
    id: number,
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ) => Promise<void>;
  removeCategory: (id: number) => Promise<void>;

  // Subcategory Actions
  addSubcategory: (categoryId: number, name: string) => Promise<Subcategory>;
  editSubcategory: (id: number, name: string, categoryId: number) => Promise<void>;
  removeSubcategory: (id: number, categoryId: number) => Promise<void>;

  // PDF Actions
  importPdfFiles: (
    files: { uri: string; name: string; size?: number }[],
    categoryId?: number | null,
    subcategoryId?: number | null
  ) => Promise<{ importedCount: number; duplicateCount: number; errors: string[] }>;
  addSampleStudyGuide: (
    categoryId?: number | null,
    subcategoryId?: number | null
  ) => Promise<PdfDocument>;
  renamePdf: (id: number, newTitle: string) => Promise<void>;
  movePdf: (id: number, categoryId?: number | null, subcategoryId?: number | null) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  deletePdfToBin: (id: number) => Promise<void>;
  restorePdfFromBin: (id: number) => Promise<void>;
  deletePdfPermanently: (id: number) => Promise<void>;
  refreshStorageBreakdown: () => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  categories: [],
  subcategoriesMap: {},
  pdfs: [],
  recentPdfs: [],
  favoritePdfs: [],
  recycledPdfs: [],
  storageStats: null,
  isLoading: false,
  searchQuery: '',
  selectedCategoryFilter: null,
  sortBy: 'date',
  sortOrder: 'desc',

  loadAll: async () => {
    set({ isLoading: true });
    try {
      get().refreshCategories();
      get().refreshPdfs();
      get().refreshStorageBreakdown();
    } catch (e) {
      console.warn('Error loading initial app data:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshCategories: () => {
    const categories = categoryRepo.getAllCategories();
    set({ categories });
  },

  loadSubcategoriesForCategory: (categoryId: number) => {
    const subcategories = categoryRepo.getSubcategories(categoryId);
    set((state) => ({
      subcategoriesMap: {
        ...state.subcategoriesMap,
        [categoryId]: subcategories,
      },
    }));
  },

  refreshPdfs: () => {
    const { searchQuery, selectedCategoryFilter, sortBy, sortOrder } = get();
    const pdfs = pdfRepo.getAllPdfs({
      search: searchQuery,
      categoryId: selectedCategoryFilter ?? undefined,
      sortBy,
      sortOrder,
    });
    const recentPdfs = pdfRepo.getRecentPdfs(8);
    const favoritePdfs = pdfRepo.getFavoritePdfs();
    const recycledPdfs = pdfRepo.getRecycledPdfs();

    set({ pdfs, recentPdfs, favoritePdfs, recycledPdfs });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().refreshPdfs();
  },

  setSelectedCategoryFilter: (categoryId: number | null) => {
    set({ selectedCategoryFilter: categoryId });
    get().refreshPdfs();
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().refreshPdfs();
  },

  addCategory: async (name, description, icon, color) => {
    const created = categoryRepo.createCategory(name, description, icon, color);
    get().refreshCategories();
    get().refreshStorageBreakdown();
    return created;
  },

  editCategory: async (id, name, description, icon, color) => {
    categoryRepo.updateCategory(id, name, description, icon, color);
    get().refreshCategories();
    get().refreshPdfs();
  },

  removeCategory: async (id) => {
    categoryRepo.deleteCategory(id);
    get().refreshCategories();
    get().refreshPdfs();
    get().refreshStorageBreakdown();
  },

  addSubcategory: async (categoryId, name) => {
    const created = categoryRepo.createSubcategory(categoryId, name);
    get().loadSubcategoriesForCategory(categoryId);
    get().refreshStorageBreakdown();
    return created;
  },

  editSubcategory: async (id, name, categoryId) => {
    categoryRepo.updateSubcategory(id, name);
    get().loadSubcategoriesForCategory(categoryId);
  },

  removeSubcategory: async (id, categoryId) => {
    categoryRepo.deleteSubcategory(id);
    get().loadSubcategoriesForCategory(categoryId);
    get().refreshPdfs();
    get().refreshStorageBreakdown();
  },

  importPdfFiles: async (files, categoryId, subcategoryId) => {
    let importedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        const safeName = file.name || `Study_Doc_${Date.now()}.pdf`;
        const titleWithoutExt = safeName.replace(/\.pdf$/i, '').replace(/_/g, ' ');

        // Copy to permanent app local storage
        const { localPath, fileSize } = await copyPdfToAppStorage(file.uri, safeName);

        // Check for duplicates
        const existing = pdfRepo.findPdfByFilenameAndSize(safeName, fileSize);
        if (existing) {
          duplicateCount++;
        }

        pdfRepo.createPdf({
          categoryId: categoryId ?? null,
          subcategoryId: subcategoryId ?? null,
          title: titleWithoutExt,
          originalFilename: safeName,
          localPath,
          fileSize: fileSize || file.size || 0,
        });

        importedCount++;
      } catch (err: any) {
        console.error(`Failed to import PDF file ${file?.name}:`, err);
        errors.push(err?.message || 'Storage error');
      }
    }

    get().refreshPdfs();
    get().refreshCategories();
    if (categoryId) {
      get().loadSubcategoriesForCategory(categoryId);
    }
    get().refreshStorageBreakdown();

    return { importedCount, duplicateCount, errors };
  },

  addSampleStudyGuide: async (categoryId, subcategoryId) => {
    const { localPath, fileSize } = await createAndSaveSamplePdf();
    const defaultCat = categoryId || (get().categories[0]?.id ?? null);
    const created = pdfRepo.createPdf({
      categoryId: defaultCat,
      subcategoryId: subcategoryId ?? null,
      title: 'StudyVault Quickstart & Sample Guide',
      originalFilename: 'Sample_Study_Notes.pdf',
      localPath,
      fileSize,
      pageCount: 3,
    });

    get().refreshPdfs();
    get().refreshCategories();
    get().refreshStorageBreakdown();

    return created;
  },

  renamePdf: async (id, newTitle) => {
    pdfRepo.updatePdf(id, { title: newTitle });
    get().refreshPdfs();
  },

  movePdf: async (id, categoryId, subcategoryId) => {
    pdfRepo.updatePdf(id, { categoryId, subcategoryId });
    get().refreshPdfs();
    get().refreshCategories();
    if (categoryId) {
      get().loadSubcategoriesForCategory(categoryId);
    }
  },

  toggleFavorite: async (id) => {
    pdfRepo.toggleFavorite(id);
    get().refreshPdfs();
  },

  deletePdfToBin: async (id) => {
    pdfRepo.softDeletePdf(id);
    get().refreshPdfs();
    get().refreshCategories();
    get().refreshStorageBreakdown();
  },

  restorePdfFromBin: async (id) => {
    pdfRepo.restorePdf(id);
    get().refreshPdfs();
    get().refreshCategories();
    get().refreshStorageBreakdown();
  },

  deletePdfPermanently: async (id) => {
    await pdfRepo.permanentlyDeletePdf(id);
    get().refreshPdfs();
    get().refreshCategories();
    get().refreshStorageBreakdown();
  },

  refreshStorageBreakdown: () => {
    const storageStats = pdfRepo.getStorageBreakdown();
    set({ storageStats });
  },
}));
