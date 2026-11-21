import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PdfDocument } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TYPOGRAPHY } from '@/theme/typography';
import { formatFileSize } from '@/services/fileStorage';

interface PdfActionSheetModalProps {
  visible: boolean;
  pdf: PdfDocument | null;
  onClose: () => void;
  onOpenInNativeViewer?: (pdf: PdfDocument) => void;
  onRename: (pdf: PdfDocument) => void;
  onMove: (pdf: PdfDocument) => void;
  onShare: (pdf: PdfDocument) => void;
  onToggleFavorite?: (id: number) => void;
  onToggleCompleted?: (pdf: PdfDocument) => void;
  onDelete: (pdf: PdfDocument) => void;
}

export function PdfActionSheetModal({
  visible,
  pdf,
  onClose,
  onOpenInNativeViewer,
  onRename,
  onMove,
  onShare,
  onToggleFavorite,
  onToggleCompleted,
  onDelete,
}: PdfActionSheetModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const showDeleteActions = useSettingsStore((s) => s.showDeleteActions);

  if (!pdf) return null;

  const isFav = pdf.is_favorite === 1;

  const handleAction = (action: () => void) => {
    onClose();
    setTimeout(action, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === 'android' ? 14 : 8),
            },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header Info */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${pdf.category_color || colors.primary}18` },
              ]}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={pdf.category_color || colors.primary}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]} numberOfLines={1}>
                {pdf.title}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                {formatFileSize(pdf.file_size)} • {pdf.page_count} pages • {pdf.category_name || 'Uncategorized'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Action List */}
          <View style={styles.actionsList}>
            {/* Open in Device PDF App (Google Drive / Adobe / Native) */}
            <Pressable
              onPress={() =>
                handleAction(() => {
                  if (onOpenInNativeViewer) {
                    onOpenInNativeViewer(pdf);
                  } else {
                    onShare(pdf);
                  }
                })
              }
              style={({ pressed }) => [
                styles.actionItem,
                pressed && { backgroundColor: colors.surfaceVariant },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#3B82F618' }]}>
                <Ionicons name="open-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                  Open in Device PDF App
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  View with Google Drive, Adobe, or Mi PDF Viewer (100% original fonts)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Rename */}
            <Pressable
              onPress={() => handleAction(() => onRename(pdf))}
              style={({ pressed }) => [
                styles.actionItem,
                pressed && { backgroundColor: colors.surfaceVariant },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Rename</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Change note title or display name
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Move */}
            <Pressable
              onPress={() => handleAction(() => onMove(pdf))}
              style={({ pressed }) => [
                styles.actionItem,
                pressed && { backgroundColor: colors.surfaceVariant },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="folder-open-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Move to Category</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Reassign to subject or subcategory
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Mark as Completed / In Progress */}
            {onToggleCompleted && (
              <Pressable
                onPress={() => handleAction(() => onToggleCompleted(pdf))}
                style={({ pressed }) => [
                  styles.actionItem,
                  pressed && { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <View
                  style={[
                    styles.actionIconBox,
                    { backgroundColor: pdf.is_completed === 1 ? '#10B98118' : `${colors.primary}18` },
                  ]}
                >
                  <Ionicons
                    name={pdf.is_completed === 1 ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={20}
                    color={pdf.is_completed === 1 ? '#10B981' : colors.primary}
                  />
                </View>
                <View style={styles.actionTextBox}>
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                    {pdf.is_completed === 1 ? 'Mark as In Progress' : 'Mark as Completed'}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    {pdf.is_completed === 1
                      ? `Completed on ${pdf.completed_at ? new Date(pdf.completed_at).toLocaleDateString() : 'earlier'}`
                      : 'Track that you have fully studied this PDF'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )}

            {/* Favorite Toggle */}
            {onToggleFavorite && (
              <Pressable
                onPress={() => handleAction(() => onToggleFavorite(pdf.id))}
                style={({ pressed }) => [
                  styles.actionItem,
                  pressed && { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <View
                  style={[
                    styles.actionIconBox,
                    { backgroundColor: isFav ? '#EF444415' : `${colors.textMuted}15` },
                  ]}
                >
                  <Ionicons
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFav ? '#EF4444' : colors.textSecondary}
                  />
                </View>
                <View style={styles.actionTextBox}>
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                    {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    {isFav ? 'Saved in favorite notes' : 'Bookmark for quick access'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )}

            {/* Share */}
            <Pressable
              onPress={() => handleAction(() => onShare(pdf))}
              style={({ pressed }) => [
                styles.actionItem,
                pressed && { backgroundColor: colors.surfaceVariant },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="share-social-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Share PDF</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Send via WhatsApp, Drive, or AirDrop
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Delete (Hidden in Safe Study Mode) */}
            {showDeleteActions && (
              <Pressable
                onPress={() => handleAction(() => onDelete(pdf))}
                style={({ pressed }) => [
                  styles.actionItem,
                  styles.deleteActionItem,
                  pressed && { backgroundColor: '#EF444412' },
                ]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#EF444418' }]}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </View>
                <View style={styles.actionTextBox}>
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.error }]}>
                    Move to Recycle Bin
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: '#EF4444AA' }]}>
                    Can be restored later from settings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.error} />
              </Pressable>
            )}
          </View>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  actionsList: {
    gap: 4,
    marginVertical: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  deleteActionItem: {
    marginTop: 4,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextBox: {
    flex: 1,
  },
  closeButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
});
