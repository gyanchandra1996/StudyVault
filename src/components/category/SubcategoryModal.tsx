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
import { Subcategory } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

interface SubcategoryModalProps {
  visible: boolean;
  categoryId: number;
  categoryName?: string;
  subcategory?: Subcategory | null;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function SubcategoryModal({
  visible,
  categoryName,
  subcategory,
  onSave,
  onClose,
}: SubcategoryModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (subcategory) {
      setName(subcategory.name);
    } else {
      setName('');
    }
    setError('');
  }, [subcategory, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Subcategory name is required');
      return;
    }
    onSave(name.trim());
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
            <View>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                {subcategory ? 'Edit Subcategory' : 'New Subcategory'}
              </Text>
              {categoryName ? (
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  in {categoryName}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
              SUBCATEGORY NAME *
            </Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              placeholder="e.g. Data Structures"
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
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>
                {subcategory ? 'Save Changes' : 'Add Subcategory'}
              </Text>
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
    alignItems: 'flex-start',
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
