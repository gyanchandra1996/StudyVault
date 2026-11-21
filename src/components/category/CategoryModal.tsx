import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

const AVAILABLE_ICONS = [
  'folder-outline',
  'desktop-outline',
  'calculator-outline',
  'construct-outline',
  'globe-outline',
  'code-slash-outline',
  'book-outline',
  'school-outline',
  'flask-outline',
  'library-outline',
  'analytics-outline',
  'medkit-outline',
  'brush-outline',
  'bulb-outline',
  'newspaper-outline',
  'hardware-chip-outline',
];

const AVAILABLE_COLORS = [
  '#6366F1', // Indigo
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#475569', // Slate
  '#0284C7', // Sky
];

interface CategoryModalProps {
  visible: boolean;
  category?: Category | null;
  onSave: (name: string, description?: string, icon?: string, color?: string) => void;
  onClose: () => void;
}

export function CategoryModal({
  visible,
  category,
  onSave,
  onClose,
}: CategoryModalProps) {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder-outline');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setSelectedIcon(category.icon || 'folder-outline');
      setSelectedColor(category.color || '#6366F1');
    } else {
      setName('');
      setDescription('');
      setSelectedIcon('folder-outline');
      setSelectedColor('#6366F1');
    }
    setError('');
  }, [category, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    onSave(name.trim(), description.trim() || undefined, selectedIcon, selectedColor);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.header}>
            <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>
              {category ? 'Edit Category' : 'New Category'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
              CATEGORY NAME *
            </Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              placeholder="e.g. Computer Science"
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
            />
            {error ? (
              <Text style={[TYPOGRAPHY.caption, { color: colors.error, marginTop: 4 }]}>
                {error}
              </Text>
            ) : null}

            <Text
              style={[
                TYPOGRAPHY.captionBold,
                { color: colors.textSecondary, marginTop: 16, marginBottom: 6 },
              ]}
            >
              DESCRIPTION (OPTIONAL)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Short description of this subject..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              style={[
                styles.textArea,
                TYPOGRAPHY.body,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.cardBorder,
                },
              ]}
            />

            <Text
              style={[
                TYPOGRAPHY.captionBold,
                { color: colors.textSecondary, marginTop: 16, marginBottom: 8 },
              ]}
            >
              SELECT COLOR
            </Text>
            <View style={styles.colorRow}>
              {AVAILABLE_COLORS.map((col) => {
                const isSelected = selectedColor === col;
                return (
                  <Pressable
                    key={col}
                    onPress={() => setSelectedColor(col)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: col },
                      isSelected && styles.colorCircleSelected,
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </Pressable>
                );
              })}
            </View>

            <Text
              style={[
                TYPOGRAPHY.captionBold,
                { color: colors.textSecondary, marginTop: 16, marginBottom: 8 },
              ]}
            >
              SELECT ICON
            </Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => setSelectedIcon(iconName)}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: isSelected
                          ? `${selectedColor}25`
                          : colors.surfaceVariant,
                        borderColor: isSelected ? selectedColor : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={22}
                      color={isSelected ? selectedColor : colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
                {category ? 'Save Changes' : 'Create Category'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    paddingTop: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  textArea: {
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
