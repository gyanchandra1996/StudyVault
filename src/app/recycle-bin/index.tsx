import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { formatFileSize } from '@/services/fileStorage';
import { PdfDocument } from '@/types/database';

export default function RecycleBinScreen() {
  const { colors } = useTheme();
  const { recycledPdfs, restorePdfFromBin, deletePdfPermanently } = useAppStore();

  const [restoringPdf, setRestoringPdf] = useState<PdfDocument | null>(null);
  const [permanentPdf, setPermanentPdf] = useState<PdfDocument | null>(null);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Recycle Bin"
        subtitle={`${recycledPdfs.length} deleted items`}
        showBack
      />

      <FlatList
        data={recycledPdfs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: `${colors.error}18` }]}>
              <Ionicons name="trash" size={22} color={colors.error} />
            </View>

            <View style={styles.cardDetails}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.original_filename}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                  {formatFileSize(item.file_size)}
                </Text>
                {item.deleted_at && (
                  <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                    Deleted {formatDate(item.deleted_at)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              {/* Restore button */}
              <Pressable
                onPress={() => setRestoringPdf(item)}
                style={[styles.actionBtn, { backgroundColor: `${colors.primary}18` }]}
                hitSlop={8}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </Pressable>

              {/* Permanent delete button */}
              <Pressable
                onPress={() => setPermanentPdf(item)}
                style={[styles.actionBtn, { backgroundColor: `${colors.error}18` }]}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="trash-bin-outline"
            title="Recycle bin is empty"
            description="Documents you delete will be held here until permanently removed, so you never lose study notes by accident."
          />
        }
      />

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        visible={!!restoringPdf}
        title="Restore Document?"
        message={`Restore "${restoringPdf?.title}" back to your study library?`}
        confirmText="Restore"
        onConfirm={async () => {
          if (restoringPdf) {
            await restorePdfFromBin(restoringPdf.id);
            setRestoringPdf(null);
          }
        }}
        onCancel={() => setRestoringPdf(null)}
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!permanentPdf}
        title="Permanently Delete PDF?"
        message={`Permanently delete "${permanentPdf?.title}" and remove its file from device storage? This CANNOT be undone.`}
        confirmText="Delete Permanently"
        isDestructive
        onConfirm={async () => {
          if (permanentPdf) {
            await deletePdfPermanently(permanentPdf.id);
            setPermanentPdf(null);
          }
        }}
        onCancel={() => setPermanentPdf(null)}
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
