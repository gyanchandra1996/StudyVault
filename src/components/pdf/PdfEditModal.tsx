import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PdfDocument } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

interface PdfEditModalProps {
  visible: boolean;
  pdf: PdfDocument | null;
  onSave: (id: number, newTitle: string) => void;
  onClose: () => void;
}

export function PdfEditModal({ visible, pdf, onSave, onClose }: PdfEditModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (pdf) {
      setTitle(pdf.title);
    } else {
      setTitle('');
    }
    setError('');
  }, [pdf, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    if (pdf) {
      onSave(pdf.id, title.trim());
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.header}>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Rename Document</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
              DOCUMENT TITLE *
            </Text>
            <TextInput
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                setError('');
              }}
              placeholder="Enter document title"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                TYPOGRAPHY.body,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceVariant,
                  borderColor: error ? colors.error : colors.cardBorder,
                },
              ]}
              autoFocus
            />
            {error ? (
              <Text style={[TYPOGRAPHY.caption, { color: colors.error, marginTop: 4 }]}>
                {error}
              </Text>
            ) : null}

            {pdf && (
              <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted, marginTop: 8 }]}>
                Original file: {pdf.original_filename}
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Save Title</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
