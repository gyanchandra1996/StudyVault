import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import * as historyRepo from '@/db/historyRepo';
import { ReadingHistoryItem } from '@/types/database';

export default function RecentScreen() {
  const { colors } = useTheme();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);

  const loadHistory = () => {
    const list = historyRepo.getReadingHistory(30);
    setHistory(list);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = () => {
    historyRepo.clearReadingHistory();
    setHistory([]);
    setClearConfirmVisible(false);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Reading History"
        subtitle={`${history.length} reading sessions recorded`}
        rightAction={
          history.length > 0
            ? {
                icon: 'trash-outline',
                onPress: () => setClearConfirmVisible(true),
                color: colors.error,
              }
            : undefined
        }
      />

      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/reader/[id]',
                params: { id: String(item.pdf_id) },
              })
            }
            style={({ pressed }) => [
              styles.historyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: `${item.category_color || colors.primary}20` },
              ]}
            >
              <Ionicons
                name="time"
                size={22}
                color={item.category_color || colors.primary}
              />
            </View>

            <View style={styles.cardDetails}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]} numberOfLines={1}>
                {item.pdf_title || 'Document'}
              </Text>
              <View style={styles.subMeta}>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Read up to Page {item.last_read_page}
                  {item.page_count ? ` of ${item.page_count}` : ''}
                </Text>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                  {formatDate(item.last_opened_at)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.track, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: item.category_color || colors.primary,
                      width: `${Math.min(100, Math.round(item.progress_percentage))}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No reading history"
            description="When you open and read PDF documents, your progress and reading sessions will appear here."
          />
        }
      />

      <ConfirmationModal
        visible={clearConfirmVisible}
        title="Clear Reading History?"
        message="Are you sure you want to clear your reading history? Your documents and highlights will NOT be deleted."
        confirmText="Clear History"
        isDestructive
        onConfirm={handleClearHistory}
        onCancel={() => setClearConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  historyCard: {
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
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
    marginRight: 8,
  },
  subMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
