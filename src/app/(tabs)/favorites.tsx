import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { Header } from '@/components/common/Header';
import { SearchBar } from '@/components/common/SearchBar';
import { PdfCard } from '@/components/pdf/PdfCard';
import { EmptyState } from '@/components/common/EmptyState';
import { PdfEditModal } from '@/components/pdf/PdfEditModal';
import { PdfMoveModal } from '@/components/pdf/PdfMoveModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { PdfDocument } from '@/types/database';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { favoritePdfs, toggleFavorite, renamePdf, movePdf, deletePdfToBin } = useAppStore();

  const [search, setSearch] = useState('');
  const [editingPdf, setEditingPdf] = useState<PdfDocument | null>(null);
  const [movingPdf, setMovingPdf] = useState<PdfDocument | null>(null);
  const [deletingPdf, setDeletingPdf] = useState<PdfDocument | null>(null);

  const filtered = favoritePdfs.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.original_filename.toLowerCase().includes(search.toLowerCase()) ||
      (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Favorites"
        subtitle={`${favoritePdfs.length} starred study documents`}
      />

      <View style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search favorite documents..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PdfCard
            pdf={item}
            onToggleFavorite={toggleFavorite}
            onRename={setEditingPdf}
            onMove={setMovingPdf}
            onDelete={setDeletingPdf}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title={search ? 'No favorites match search' : 'No favorite documents yet'}
            description={
              search
                ? `No documents match "${search}"`
                : 'Tap the heart icon on any document to keep it easily accessible here.'
            }
          />
        }
      />

      <PdfEditModal
        visible={!!editingPdf}
        pdf={editingPdf}
        onSave={(id, title) => renamePdf(id, title)}
        onClose={() => setEditingPdf(null)}
      />

      <PdfMoveModal
        visible={!!movingPdf}
        pdf={movingPdf}
        onSave={(id, catId, subId) => movePdf(id, catId, subId)}
        onClose={() => setMovingPdf(null)}
      />

      <ConfirmationModal
        visible={!!deletingPdf}
        title="Move to Recycle Bin?"
        message={`"${deletingPdf?.title}" will be moved to the recycle bin.`}
        confirmText="Move to Bin"
        isDestructive
        onConfirm={() => {
          if (deletingPdf) {
            deletePdfToBin(deletingPdf.id);
            setDeletingPdf(null);
          }
        }}
        onCancel={() => setDeletingPdf(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
