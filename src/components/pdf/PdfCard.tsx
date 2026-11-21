import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { PdfDocument } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { formatFileSize } from '@/services/fileStorage';

interface PdfCardProps {
  pdf: PdfDocument;
  onToggleFavorite?: (id: number) => void;
  onRename?: (pdf: PdfDocument) => void;
  onMove?: (pdf: PdfDocument) => void;
  onDelete?: (pdf: PdfDocument) => void;
}

export function PdfCard({
  pdf,
  onToggleFavorite,
  onRename,
  onMove,
  onDelete,
}: PdfCardProps) {
  const { colors, isDark } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const handleOpen = () => {
    router.push({
      pathname: '/reader/[id]',
      params: { id: String(pdf.id) },
    });
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
        return;
      }
      await Sharing.shareAsync(pdf.local_path, {
        dialogTitle: `Share ${pdf.title}`,
        mimeType: 'application/pdf',
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const progress =
    pdf.page_count > 0
      ? Math.min(100, Math.round((pdf.last_read_page / pdf.page_count) * 100))
      : 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.3 : 0.06,
        },
      ]}
    >
      <Pressable onPress={handleOpen} style={styles.cardContent}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.pdfIconBox,
              { backgroundColor: `${pdf.category_color || colors.primary}18` },
            ]}
          >
            <Ionicons
              name="document-text"
              size={24}
              color={pdf.category_color || colors.primary}
            />
          </View>

          <View style={styles.titleArea}>
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]} numberOfLines={1}>
              {pdf.title}
            </Text>
            <Text
              style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}
              numberOfLines={1}
            >
              {pdf.original_filename}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            {onToggleFavorite && (
              <Pressable
                onPress={() => onToggleFavorite(pdf.id)}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={pdf.is_favorite === 1 ? 'heart' : 'heart-outline'}
                  size={20}
                  color={pdf.is_favorite === 1 ? '#EF4444' : colors.textMuted}
                />
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowMenu((prev) => !prev)}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Category & Tags Pill */}
        <View style={styles.metaRow}>
          {pdf.category_name && (
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: `${pdf.category_color || colors.primary}20` },
              ]}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: pdf.category_color || colors.primary },
                ]}
              />
              <Text
                style={[
                  TYPOGRAPHY.tiny,
                  { color: pdf.category_color || colors.primary, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {pdf.category_name}
                {pdf.subcategory_name ? ` › ${pdf.subcategory_name}` : ''}
              </Text>
            </View>
          )}

          <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted }]}>
            {formatFileSize(pdf.file_size)}
          </Text>

          {pdf.page_count > 0 && (
            <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted }]}>
              {pdf.page_count} {pdf.page_count === 1 ? 'page' : 'pages'}
            </Text>
          )}
        </View>

        {/* Reading Progress Indicator */}
        {pdf.page_count > 0 && pdf.last_read_page > 1 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: pdf.category_color || colors.primary,
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary, marginTop: 4 }]}>
              Page {pdf.last_read_page} of {pdf.page_count} ({progress}%)
            </Text>
          </View>
        )}
      </Pressable>

      {/* Dropdown Menu */}
      {showMenu && (
        <View
          style={[
            styles.menuDropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              setShowMenu(false);
              onRename?.(pdf);
            }}
            style={styles.menuItem}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.text} />
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginLeft: 8 }]}>
              Rename
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowMenu(false);
              onMove?.(pdf);
            }}
            style={styles.menuItem}
          >
            <Ionicons name="folder-open-outline" size={16} color={colors.text} />
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginLeft: 8 }]}>
              Move to Category
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowMenu(false);
              handleShare();
            }}
            style={styles.menuItem}
          >
            <Ionicons name="share-social-outline" size={16} color={colors.text} />
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginLeft: 8 }]}>
              Share PDF
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowMenu(false);
              onDelete?.(pdf);
            }}
            style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.error, marginLeft: 8 }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    position: 'relative',
  },
  cardContent: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleArea: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 180,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  menuDropdown: {
    position: 'absolute',
    top: 52,
    right: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    width: 170,
    zIndex: 100,
    elevation: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
