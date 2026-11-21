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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import * as flashcardRepo from '@/db/flashcardRepo';

interface FlashcardModalProps {
  visible: boolean;
  pdfId?: number | null;
  defaultAnswer?: string;
  highlightId?: number | null;
  onClose: () => void;
  onCreated?: () => void;
}

export function FlashcardModal({
  visible,
  pdfId,
  defaultAnswer = '',
  highlightId,
  onClose,
  onCreated,
}: FlashcardModalProps) {
  const { colors } = useTheme();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (visible) {
      setAnswer(defaultAnswer);
      setQuestion('');
    }
  }, [visible, defaultAnswer]);

  const handleSave = () => {
    if (!question.trim()) {
      Alert.alert('Question Required', 'Please enter a question or prompt for this card.');
      return;
    }
    if (!answer.trim()) {
      Alert.alert('Answer Required', 'Please enter the answer or explanation.');
      return;
    }

    flashcardRepo.createFlashcard(pdfId ?? null, question, answer, highlightId);
    Alert.alert('Flashcard Saved', 'Card added to your revision deck.');
    onCreated?.();
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
            <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="albums-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>New Flashcard</Text>
              <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>
                Add to your offline revision deck
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Question / Prompt Input */}
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginTop: 14, marginBottom: 6 }]}>
            Question / Front Side:
          </Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="e.g. What is the time complexity of QuickSort?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
            style={[
              styles.input,
              TYPOGRAPHY.body,
              {
                color: colors.text,
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.cardBorder,
              },
            ]}
            autoFocus
          />

          {/* Answer / Back Side */}
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginTop: 12, marginBottom: 6 }]}>
            Answer / Back Side:
          </Text>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="e.g. Average O(n log n), Worst O(n^2)"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              TYPOGRAPHY.body,
              {
                color: colors.text,
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.cardBorder,
              },
            ]}
          />

          <View style={styles.actions}>
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
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Create Card</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 50,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
});
