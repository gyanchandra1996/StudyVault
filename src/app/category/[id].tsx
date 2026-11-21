import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { SearchBar } from '@/components/common/SearchBar';
import { PdfCard } from '@/components/pdf/PdfCard';
import { SubcategoryModal } from '@/components/category/SubcategoryModal';
import { PdfEditModal } from '@/components/pdf/PdfEditModal';
import { PdfMoveModal } from '@/components/pdf/PdfMoveModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { EmptyState } from '@/components/common/EmptyState';
import { pickPdfDocuments } from '@/services/pdfPicker';
import * as categoryRepo from '@/db/categoryRepo';
import * as pdfRepo from '@/db/pdfRepo';
import { Category, Subcategory, PdfDocument } from '@/types/database';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = parseInt(id, 10);
  const { colors } = useTheme();

  const {
    importPdfFiles,
    addSampleStudyGuide,
    toggleFavorite,
    deletePdfToBin,
    renamePdf,
    movePdf,
    addSubcategory,
    editSubcategory,
    removeSubcategory,
  } = useAppStore();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [search, setSearch] = useState('');

  // Modals
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState<Subcategory | null>(null);

  const [editingPdf, setEditingPdf] = useState<PdfDocument | null>(null);
  const [movingPdf, setMovingPdf] = useState<PdfDocument | null>(null);
  const [deletingPdf, setDeletingPdf] = useState<PdfDocument | null>(null);

  const loadData = () => {
    if (!categoryId) return;
    const cat = categoryRepo.getCategoryById(categoryId);
    setCategory(cat);
    const subs = categoryRepo.getSubcategories(categoryId);
    setSubcategories(subs);

    const docList = pdfRepo.getAllPdfs({
      categoryId,
      subcategoryId: selectedSubcategoryId ?? undefined,
      search: search.trim() || undefined,
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setPdfs(docList);
  };

  useEffect(() => {
    loadData();
  }, [categoryId, selectedSubcategoryId, search]);

  const handleUpload = () => {
    Alert.alert(
      'Add PDF to Category',
      `Add study document to "${category?.name || 'this category'}":`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Sample Study Guide',
          onPress: async () => {
            try {
              const doc = await addSampleStudyGuide(categoryId, selectedSubcategoryId);
              loadData();
              Alert.alert('Document Added', `"${doc.title}" added to ${category?.name || 'category'}!`);
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to add sample study guide.');
            }
          },
        },
        {
          text: 'Select PDF from Device',
          onPress: async () => {
            try {
              const files = await pickPdfDocuments();
              if (files && files.length > 0) {
                const { importedCount, duplicateCount, errors } = await importPdfFiles(
                  files,
                  categoryId,
                  selectedSubcategoryId
                );
                loadData();
                if (importedCount > 0) {
                  Alert.alert(
                    'Success',
                    `Added ${importedCount} document(s) to ${category?.name || 'category'}.` +
                      (duplicateCount > 0 ? ` (${duplicateCount} duplicate notice)` : '')
                  );
                } else if (errors.length > 0) {
                  Alert.alert('Import Failed', errors.join('\n'));
                }
              }
            } catch (err: any) {
              Alert.alert('Upload Error', err?.message || 'Failed to import PDF.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title={category?.name || 'Category'}
        subtitle={`${pdfs.length} documents`}
        showBack
        rightComponent={
          <Pressable
            onPress={handleUpload}
            style={[styles.uploadBtn, { backgroundColor: category?.color || colors.primary }]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF', marginLeft: 4 }]}>
              Add PDF
            </Text>
          </Pressable>
        }
      />

      {/* Subcategories Horizontal Scroll Filter */}
      <View style={[styles.subcategoriesContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subScrollContent}
        >
          {/* All Subcategories Chip */}
          <Pressable
            onPress={() => setSelectedSubcategoryId(null)}
            style={[
              styles.subChip,
              {
                backgroundColor:
                  selectedSubcategoryId === null
                    ? category?.color || colors.primary
                    : colors.surfaceVariant,
              },
            ]}
          >
            <Text
              style={[
                TYPOGRAPHY.captionBold,
                {
                  color: selectedSubcategoryId === null ? '#FFFFFF' : colors.text,
                },
              ]}
            >
              All Topics
            </Text>
          </Pressable>

          {subcategories.map((sub) => {
            const isSelected = selectedSubcategoryId === sub.id;
            return (
              <Pressable
                key={sub.id}
                onPress={() => setSelectedSubcategoryId(sub.id)}
                onLongPress={() => {
                  setEditingSubcategory(sub);
                  setSubModalVisible(true);
                }}
                style={[
                  styles.subChip,
                  {
                    backgroundColor: isSelected
                      ? category?.color || colors.primary
                      : colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    TYPOGRAPHY.captionBold,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {sub.name} ({sub.pdf_count ?? 0})
                </Text>

                {isSelected && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setDeletingSubcategory(sub);
                    }}
                    hitSlop={6}
                    style={{ marginLeft: 6 }}
                  >
                    <Ionicons name="close-circle" size={14} color="#FFFFFF" />
                  </Pressable>
                )}
              </Pressable>
            );
          })}

          {/* Add Subcategory Chip */}
          <Pressable
            onPress={() => {
              setEditingSubcategory(null);
              setSubModalVisible(true);
            }}
            style={[
              styles.subChip,
              styles.addSubChip,
              { borderColor: category?.color || colors.primary },
            ]}
          >
            <Ionicons name="add" size={14} color={category?.color || colors.primary} />
            <Text
              style={[
                TYPOGRAPHY.captionBold,
                { color: category?.color || colors.primary, marginLeft: 4 },
              ]}
            >
              Add Topic
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={`Search within ${category?.name || 'category'}...`}
        />
      </View>

      {/* PDF Documents List */}
      <FlatList
        data={pdfs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PdfCard
            pdf={item}
            onToggleFavorite={async (pdfId) => {
              await toggleFavorite(pdfId);
              loadData();
            }}
            onRename={setEditingPdf}
            onMove={setMovingPdf}
            onDelete={setDeletingPdf}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No documents here"
            description={
              search
                ? `No files match "${search}"`
                : 'Upload PDFs from your device storage to study this topic offline.'
            }
            actionLabel="Upload PDF"
            onAction={handleUpload}
          />
        }
      />

      {/* Subcategory Create / Edit Modal */}
      <SubcategoryModal
        visible={subModalVisible}
        categoryId={categoryId}
        categoryName={category?.name}
        subcategory={editingSubcategory}
        onSave={async (name) => {
          if (editingSubcategory) {
            await editSubcategory(editingSubcategory.id, name, categoryId);
          } else {
            await addSubcategory(categoryId, name);
          }
          loadData();
        }}
        onClose={() => {
          setSubModalVisible(false);
          setEditingSubcategory(null);
        }}
      />

      {/* PDF Rename Modal */}
      <PdfEditModal
        visible={!!editingPdf}
        pdf={editingPdf}
        onSave={async (pdfId, title) => {
          await renamePdf(pdfId, title);
          loadData();
        }}
        onClose={() => setEditingPdf(null)}
      />

      {/* PDF Move Modal */}
      <PdfMoveModal
        visible={!!movingPdf}
        pdf={movingPdf}
        onSave={async (pdfId, catId, subId) => {
          await movePdf(pdfId, catId, subId);
          loadData();
        }}
        onClose={() => setMovingPdf(null)}
      />

      {/* PDF Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!deletingPdf}
        title="Move to Recycle Bin?"
        message={`"${deletingPdf?.title}" will be moved to the recycle bin.`}
        confirmText="Move to Bin"
        isDestructive
        onConfirm={async () => {
          if (deletingPdf) {
            await deletePdfToBin(deletingPdf.id);
            setDeletingPdf(null);
            loadData();
          }
        }}
        onCancel={() => setDeletingPdf(null)}
      />

      {/* Subcategory Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!deletingSubcategory}
        title="Delete Topic?"
        message={`Delete "${deletingSubcategory?.name}"? PDFs in this topic will remain in the parent category.`}
        confirmText="Delete Topic"
        isDestructive
        onConfirm={async () => {
          if (deletingSubcategory) {
            await removeSubcategory(deletingSubcategory.id, categoryId);
            setDeletingSubcategory(null);
            if (selectedSubcategoryId === deletingSubcategory.id) {
              setSelectedSubcategoryId(null);
            }
            loadData();
          }
        }}
        onCancel={() => setDeletingSubcategory(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
  },
  subcategoriesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  subScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addSubChip: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
});
