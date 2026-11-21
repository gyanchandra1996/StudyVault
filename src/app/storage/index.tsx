import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { formatFileSize } from '@/services/fileStorage';

export default function StorageScreen() {
  const { colors } = useTheme();
  const { storageStats, refreshStorageBreakdown } = useAppStore();

  useEffect(() => {
    refreshStorageBreakdown();
  }, []);

  const totalBytes =
    (storageStats?.totalPdfBytes ?? 0) + (storageStats?.recycledPdfBytes ?? 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Storage Usage" subtitle="Local Device Storage Breakdown" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total App Storage Banner */}
        <View
          style={[
            styles.banner,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.bannerIconBox, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="server" size={28} color={colors.primary} />
          </View>
          <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginTop: 12 }]}>
            {formatFileSize(totalBytes)}
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            Total storage utilized by offline PDFs
          </Text>
        </View>

        {/* Detailed Breakdown Items */}
        <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginTop: 24, marginBottom: 8 }]}>
          STORAGE BREAKDOWN
        </Text>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.breakdownRow}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
            </View>
            <View style={styles.rowDetails}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Active Study PDFs</Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {storageStats?.pdfCount || 0} documents in library
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
              {formatFileSize(storageStats?.totalPdfBytes ?? 0)}
            </Text>
          </View>

          <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.error}18` }]}>
              <Ionicons name="trash" size={20} color={colors.error} />
            </View>
            <View style={styles.rowDetails}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Recycled PDFs</Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {storageStats?.recycledPdfCount || 0} items in recycle bin
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.error }]}>
              {formatFileSize(storageStats?.recycledPdfBytes ?? 0)}
            </Text>
          </View>
        </View>

        {/* Database Content Stats */}
        <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginTop: 24, marginBottom: 8 }]}>
          DATABASE STATISTICS
        </Text>

        <View style={styles.metricsGrid}>
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="folder" size={24} color={colors.primary} />
            <Text style={[TYPOGRAPHY.h2, { color: colors.text, marginTop: 8 }]}>
              {storageStats?.categoriesCount || 0}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>Categories</Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="git-branch" size={24} color="#0D9488" />
            <Text style={[TYPOGRAPHY.h2, { color: colors.text, marginTop: 8 }]}>
              {storageStats?.subcategoriesCount || 0}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>Subcategories</Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="color-wand" size={24} color="#D97706" />
            <Text style={[TYPOGRAPHY.h2, { color: colors.text, marginTop: 8 }]}>
              {storageStats?.totalHighlightsCount || 0}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>Highlights</Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="bookmark" size={24} color="#2563EB" />
            <Text style={[TYPOGRAPHY.h2, { color: colors.text, marginTop: 8 }]}>
              {storageStats?.totalBookmarksCount || 0}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>Bookmarks</Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="create" size={24} color="#059669" />
            <Text style={[TYPOGRAPHY.h2, { color: colors.text, marginTop: 8 }]}>
              {storageStats?.totalNotesCount || 0}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>Personal Notes</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  bannerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowDetails: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
});
