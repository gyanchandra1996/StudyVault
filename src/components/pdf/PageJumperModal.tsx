import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

interface PageJumperModalProps {
  visible: boolean;
  currentPage: number;
  totalPages: number;
  onJump: (page: number) => void;
  onClose: () => void;
}

export function PageJumperModal({
  visible,
  currentPage,
  totalPages,
  onJump,
  onClose,
}: PageJumperModalProps) {
  const { colors } = useTheme();
  const [inputVal, setInputVal] = useState(String(currentPage));
  const [error, setError] = useState('');

  const handleJump = () => {
    const pageNum = parseInt(inputVal, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      setError(`Enter a page between 1 and ${totalPages}`);
      return;
    }
    onJump(pageNum);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.header}>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Go to Page</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 4 }]}>
            Total pages: {totalPages}
          </Text>

          <TextInput
            value={inputVal}
            onChangeText={(t) => {
              setInputVal(t);
              setError('');
            }}
            keyboardType="number-pad"
            style={[
              styles.input,
              TYPOGRAPHY.h2,
              {
                color: colors.text,
                backgroundColor: colors.surfaceVariant,
                borderColor: error ? colors.error : colors.border,
              },
            ]}
            autoFocus
            selectTextOnFocus
          />

          {error ? (
            <Text style={[TYPOGRAPHY.caption, { color: colors.error, marginTop: 4 }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleJump}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Go</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
