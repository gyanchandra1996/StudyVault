import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Highlight, Bookmark, PersonalNote } from '@/types/database';

interface ReaderDrawerProps {
  visible: boolean;
  highlights: Highlight[];
  bookmarks: Bookmark[];
  notes: PersonalNote[];
  onSelectPage: (pageNum: number) => void;
  onDeleteHighlight: (id: number) => void;
  onDeleteBookmark: (id: number) => void;
  onDeleteNote: (id: number) => void;
  onClose: () => void;
  onExportSummary?: () => void;
  onCreateFlashcard?: (highlight: Highlight) => void;
}

type DrawerTab = 'highlights' | 'bookmarks' | 'notes';

export function ReaderDrawer({
  visible,
  highlights,
  bookmarks,
  notes,
  onSelectPage,
  onDeleteHighlight,
  onDeleteBookmark,
  onDeleteNote,
  onClose,
  onExportSummary,
  onCreateFlashcard,
}: ReaderDrawerProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<DrawerTab>('highlights');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Study Vault Annotations</Text>
              <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                Highlights, Bookmarks & Notes
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {onExportSummary && (
                <Pressable
                  onPress={onExportSummary}
                  style={[styles.exportBtn, { backgroundColor: `${colors.primary}18` }]}
                  hitSlop={8}
                >
                  <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                  <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, marginLeft: 4, fontWeight: '700' }]}>
                    Export
                  </Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Segment Tabs */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceVariant }]}>
            <Pressable
              onPress={() => setActiveTab('highlights')}
              style={[
                styles.tabBtn,
                activeTab === 'highlights' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Ionicons
                name="color-wand-outline"
                size={16}
                color={activeTab === 'highlights' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  {
                    color: activeTab === 'highlights' ? colors.primary : colors.textSecondary,
                    marginLeft: 6,
                  },
                ]}
              >
                Highlights ({highlights.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('bookmarks')}
              style={[
                styles.tabBtn,
                activeTab === 'bookmarks' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={activeTab === 'bookmarks' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  {
                    color: activeTab === 'bookmarks' ? colors.primary : colors.textSecondary,
                    marginLeft: 6,
                  },
                ]}
              >
                Bookmarks ({bookmarks.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('notes')}
              style={[
                styles.tabBtn,
                activeTab === 'notes' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={activeTab === 'notes' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  {
                    color: activeTab === 'notes' ? colors.primary : colors.textSecondary,
                    marginLeft: 6,
                  },
                ]}
              >
                Notes ({notes.length})
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <View style={styles.contentArea}>
            {activeTab === 'highlights' && (
              <FlatList
                data={highlights}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onSelectPage(item.page_number);
                      onClose();
                    }}
                    style={[styles.itemCard, { backgroundColor: colors.surfaceVariant }]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.colorDot, { backgroundColor: item.color || '#FACC15' }]} />
                        <Text style={[TYPOGRAPHY.captionBold, { color: colors.text }]}>
                          Page {item.page_number}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {onCreateFlashcard && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              onCreateFlashcard(item);
                            }}
                            hitSlop={8}
                          >
                            <Ionicons name="albums-outline" size={16} color={colors.primary} />
                          </Pressable>
                        )}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            onDeleteHighlight(item.id);
                          }}
                          hitSlop={8}
                          style={styles.deleteIcon}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                    <Text
                      style={[TYPOGRAPHY.body, { color: colors.text, marginTop: 4 }]}
                      numberOfLines={3}
                    >
                      "{item.selected_text}"
                    </Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={[TYPOGRAPHY.body, { color: colors.textMuted, textAlign: 'center', marginTop: 32 }]}>
                    No highlights in this document yet. Select text to highlight.
                  </Text>
                }
              />
            )}

            {activeTab === 'bookmarks' && (
              <FlatList
                data={bookmarks}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onSelectPage(item.page_number);
                      onClose();
                    }}
                    style={[styles.itemCard, { backgroundColor: colors.surfaceVariant }]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.badgeRow}>
                        <Ionicons name="bookmark" size={16} color={colors.primary} />
                        <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginLeft: 6 }]}>
                          Page {item.page_number}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => onDeleteBookmark(item.id)}
                        hitSlop={8}
                        style={styles.deleteIcon}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                      </Pressable>
                    </View>
                    {item.title ? (
                      <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, marginTop: 4 }]}>
                        {item.title}
                      </Text>
                    ) : null}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={[TYPOGRAPHY.body, { color: colors.textMuted, textAlign: 'center', marginTop: 32 }]}>
                    No bookmarks saved yet. Tap the bookmark icon to mark a page.
                  </Text>
                }
              />
            )}

            {activeTab === 'notes' && (
              <FlatList
                data={notes}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onSelectPage(item.page_number);
                      onClose();
                    }}
                    style={[styles.itemCard, { backgroundColor: colors.surfaceVariant }]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.badgeRow}>
                        <Ionicons name="create" size={16} color="#0D9488" />
                        <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginLeft: 6 }]}>
                          Page {item.page_number}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => onDeleteNote(item.id)}
                        hitSlop={8}
                        style={styles.deleteIcon}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                      </Pressable>
                    </View>
                    <Text style={[TYPOGRAPHY.body, { color: colors.text, marginTop: 6, lineHeight: 20 }]}>
                      {item.note}
                    </Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={[TYPOGRAPHY.body, { color: colors.textMuted, textAlign: 'center', marginTop: 32 }]}>
                    No notes for this document. Tap the note icon in the toolbar to add one.
                  </Text>
                }
              />
            )}
          </View>
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
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    height: '75%',
    paddingTop: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    elevation: 2,
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  deleteIcon: {
    padding: 2,
  },
});
