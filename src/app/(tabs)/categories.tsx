import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryCard } from '@/components/category/CategoryCard';
import { CategoryModal } from '@/components/category/CategoryModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Category } from '@/types/database';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { categories, addCategory, editCategory, removeCategory } = useAppStore();

  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Categories"
        subtitle={`${categories.length} study topics`}
        rightComponent={
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setLayout((prev) => (prev === 'grid' ? 'list' : 'grid'))}
              style={[
                styles.iconToggle,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              hitSlop={8}
            >
              <Ionicons
                name={layout === 'grid' ? 'list' : 'grid'}
                size={18}
                color={colors.text}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                setEditingCategory(null);
                setModalVisible(true);
              }}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF', marginLeft: 4 }]}>
                New
              </Text>
            </Pressable>
          </View>
        }
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search categories..."
        />
      </View>

      <FlatList
        key={layout} // re-renders flatlist cleanly when switching columns
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        numColumns={layout === 'grid' ? 2 : 1}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            layout={layout}
            onEdit={(cat) => {
              setEditingCategory(cat);
              setModalVisible(true);
            }}
            onDelete={setDeletingCategory}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title={search ? 'No matching categories' : 'No categories yet'}
            description={
              search
                ? `No categories match "${search}"`
                : 'Create categories to organize your textbooks, lecture notes and documents.'
            }
            actionLabel={search ? undefined : 'Create First Category'}
            onAction={() => {
              setEditingCategory(null);
              setModalVisible(true);
            }}
          />
        }
      />

      {/* Category Create/Edit Modal */}
      <CategoryModal
        visible={modalVisible}
        category={editingCategory}
        onSave={(name, desc, icon, col) => {
          if (editingCategory) {
            editCategory(editingCategory.id, name, desc, icon, col);
          } else {
            addCategory(name, desc, icon, col);
          }
        }}
        onClose={() => {
          setModalVisible(false);
          setEditingCategory(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!deletingCategory}
        title="Delete Category?"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? All subcategories will also be deleted, and contained PDFs will become unfiled.`}
        confirmText="Delete Category"
        isDestructive
        onConfirm={() => {
          if (deletingCategory) {
            removeCategory(deletingCategory.id);
            setDeletingCategory(null);
          }
        }}
        onCancel={() => setDeletingCategory(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconToggle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    padding: 10,
    paddingBottom: 40,
    flexGrow: 1,
  },
});
