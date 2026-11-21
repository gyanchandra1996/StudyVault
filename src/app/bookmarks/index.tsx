import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import * as bookmarkRepo from '@/db/bookmarkRepo';
import { Bookmark } from '@/types/database';

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState('');
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  const loadData = () => {
    const list = bookmarkRepo.getAllBookmarks();
    setBookmarks(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = bookmarks.filter(
    (b) =>
      (b.title && b.title.toLowerCase().includes(search.toLowerCase())) ||
      (b.pdf_title && b.pdf_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="All Bookmarks"
        subtitle={`${bookmarks.length} bookmarked pages`}
        showBack
      />

      <View style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search bookmarks or document titles..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/reader/[id]',
                params: { id: String(item.pdf_id), page: String(item.page_number) },
              })
            }
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.pageBadge, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
              <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary, marginTop: 2 }]}>
                P. {item.page_number}
              </Text>
            </View>

            <View style={styles.details}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]} numberOfLines={1}>
                {item.title || `Bookmark on Page ${item.page_number}`}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                {item.pdf_title || 'Document'}
              </Text>
            </View>

            <Pressable
              onPress={() => setDeletingBookmark(item)}
              style={styles.deleteBtn}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title={search ? 'No bookmarks match search' : 'No bookmarks yet'}
            description={
              search
                ? `No bookmarks match "${search}"`
                : 'Bookmark pages while reading any PDF document to jump back to them quickly.'
            }
          />
        }
      />

      <ConfirmationModal
        visible={!!deletingBookmark}
        title="Remove Bookmark?"
        message={`Remove bookmark on Page ${deletingBookmark?.page_number}?`}
        confirmText="Remove"
        isDestructive
        onConfirm={() => {
          if (deletingBookmark) {
            bookmarkRepo.deleteBookmarkById(deletingBookmark.id);
            setDeletingBookmark(null);
            loadData();
          }
        }}
        onCancel={() => setDeletingBookmark(null)}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  pageBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  deleteBtn: {
    padding: 8,
  },
});
