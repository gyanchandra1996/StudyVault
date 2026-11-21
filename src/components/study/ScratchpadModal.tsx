import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import * as scratchpadRepo from '@/db/scratchpadRepo';

interface ScratchpadModalProps {
  visible: boolean;
  pdfId?: number | null;
  pdfTitle?: string;
  onClose: () => void;
}

export function ScratchpadModal({
  visible,
  pdfId,
  pdfTitle,
  onClose,
}: ScratchpadModalProps) {
  const { colors } = useTheme();
  const [content, setContent] = useState('');

  const targetPdfId = pdfId ?? 0;

  useEffect(() => {
    if (visible) {
      const pad = scratchpadRepo.getScratchpad(targetPdfId);
      setContent(pad?.content || '');
    }
  }, [visible, targetPdfId]);

  const handleChangeText = (text: string) => {
    setContent(text);
    scratchpadRepo.saveScratchpad(targetPdfId, text);
  };

  const handleClear = () => {
    setContent('');
    scratchpadRepo.saveScratchpad(targetPdfId, '');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.titleArea}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                  Rough Scratchpad
                </Text>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]} numberOfLines={1}>
                  {pdfTitle || 'Document Working Space'} (Autosaved)
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {content.length > 0 && (
                <Pressable onPress={handleClear} style={styles.actionBtn} hitSlop={6}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.actionBtn} hitSlop={6}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Text Area */}
          <TextInput
            value={content}
            onChangeText={handleChangeText}
            placeholder="Type rough calculations, formulas, summaries, thoughts..."
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.input,
              TYPOGRAPHY.body,
              { color: colors.text, backgroundColor: colors.surfaceVariant },
            ]}
            textAlignVertical="top"
            autoFocus
          />

          <View style={styles.footer}>
            <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
              {content.trim().split(/\s+/).filter(Boolean).length} words | {content.length} chars
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF' }]}>Done</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 16,
    height: '65%',
    elevation: 16,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  doneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
