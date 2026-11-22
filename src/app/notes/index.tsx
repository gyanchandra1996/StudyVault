import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import * as noteRepo from '@/db/noteRepo';
import { PersonalNote } from '@/types/database';

export default function NotesScreen() {
  const { colors } = useTheme();
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingNote, setDeletingNote] = useState<PersonalNote | null>(null);

  const loadData = useCallback(() => {
    const list = noteRepo.getAllNotes(search);
    setNotes(list);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveEdit = () => {
    if (editingNote && editText.trim()) {
      noteRepo.updateNote(editingNote.id, editText.trim());
      setEditingNote(null);
      loadData();
    }
  };

  const formatDate = (iso: string) => {
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
        title="Study Notes"
        subtitle={`${notes.length} personal notes recorded`}
        showBack
      />

      <View style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search study notes & keywords..."
        />
      </View>

      <FlatList
        data={notes}
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
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="document-text" size={14} color={colors.primary} />
                <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary, marginLeft: 4 }]}>
                  {item.pdf_title || 'Document'} • P. {item.page_number}
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setEditingNote(item);
                    setEditText(item.note);
                  }}
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setDeletingNote(item);
                  }}
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            <Text style={[TYPOGRAPHY.body, { color: colors.text, marginTop: 10, lineHeight: 22 }]}>
              {item.note}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                Updated {formatDate(item.updated_at)}
              </Text>
              <View style={styles.jumpAction}>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '700' }]}>
                  Open Page ›
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="create-outline"
            title={search ? 'No notes match search' : 'No personal study notes'}
            description={
              search
                ? `No notes match "${search}"`
                : 'Write notes and insights on any PDF page while reading to build your personal knowledge base.'
            }
          />
        }
      />

      {/* Edit Note Modal */}
      <Modal visible={!!editingNote} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Edit Note</Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Page {editingNote?.page_number} • {editingNote?.pdf_title}
            </Text>

            <TextInput
              value={editText}
              onChangeText={setEditText}
              placeholder="Your note..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[
                styles.textArea,
                TYPOGRAPHY.body,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.cardBorder,
                },
              ]}
              autoFocus
            />

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setEditingNote(null)}
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!deletingNote}
        title="Delete Note?"
        message="Are you sure you want to delete this study note?"
        confirmText="Delete"
        isDestructive
        onConfirm={() => {
          if (deletingNote) {
            noteRepo.deleteNote(deletingNote.id);
            setDeletingNote(null);
            loadData();
          }
        }}
        onCancel={() => setDeletingNote(null)}
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 240,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
  },
  jumpAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  textArea: {
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
