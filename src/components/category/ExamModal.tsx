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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Exam } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TYPOGRAPHY } from '@/theme/typography';

const EXAM_ICONS = [
  'school-outline',
  'business-outline',
  'book-outline',
  'ribbon-outline',
  'trophy-outline',
  'briefcase-outline',
  'library-outline',
  'fitness-outline',
];

const EXAM_COLORS = [
  '#2563EB', // Blue (DSSSB)
  '#059669', // Emerald (EMRS)
  '#6366F1', // Indigo
  '#D97706', // Amber
  '#DC2626', // Crimson Red
  '#8B5CF6', // Purple
  '#0891B2', // Cyan
  '#EA580C', // Orange
];

interface ExamModalProps {
  visible: boolean;
  exam?: Exam | null;
  onSave: (name: string, code?: string, description?: string, icon?: string, color?: string) => void;
  onDelete?: (id: number) => void;
  onClose: () => void;
}

export function ExamModal({
  visible,
  exam,
  onSave,
  onDelete,
  onClose,
}: ExamModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const showDeleteActions = useSettingsStore((s) => s.showDeleteActions);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('school-outline');
  const [selectedColor, setSelectedColor] = useState('#2563EB');
  const [error, setError] = useState('');

  useEffect(() => {
    if (exam) {
      setName(exam.name);
      setCode(exam.code || '');
      setDescription(exam.description || '');
      setSelectedIcon(exam.icon || 'school-outline');
      setSelectedColor(exam.color || '#2563EB');
    } else {
      setName('');
      setCode('');
      setDescription('');
      setSelectedIcon('school-outline');
      setSelectedColor('#2563EB');
    }
    setError('');
  }, [exam, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Exam name is required');
      return;
    }
    onSave(
      name.trim(),
      code.trim() || undefined,
      description.trim() || undefined,
      selectedIcon,
      selectedColor
    );
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
              {exam ? 'Edit Target Exam' : 'New Target Exam'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
              EXAM NAME *
            </Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              placeholder="e.g. DSSSB, EMRS, SSC CGL"
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
                { color: colors.textSecondary, marginTop: 14, marginBottom: 6 },
              ]}
            >
              EXAM CODE / TARGET (OPTIONAL)
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="e.g. TGT/PRT 2026"
              placeholderTextColor={colors.textMuted}
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

            <Text
              style={[
                TYPOGRAPHY.captionBold,
                { color: colors.textSecondary, marginTop: 14, marginBottom: 6 },
              ]}
            >
              DESCRIPTION (OPTIONAL)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief target goals or syllabus note..."
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
                { color: colors.textSecondary, marginTop: 14, marginBottom: 8 },
              ]}
            >
              THEME COLOR
            </Text>
            <View style={styles.colorRow}>
              {EXAM_COLORS.map((col) => {
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
                { color: colors.textSecondary, marginTop: 14, marginBottom: 8 },
              ]}
            >
              ICON
            </Text>
            <View style={styles.iconGrid}>
              {EXAM_ICONS.map((iconName) => {
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

          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === 'android' ? 14 : 8),
              },
            ]}
          >
            {exam && onDelete && showDeleteActions && (
              <Pressable
                onPress={() => {
                  onDelete(exam.id);
                  onClose();
                }}
                style={[styles.btn, { borderColor: colors.error, borderWidth: 1, marginRight: 'auto' }]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            )}
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
                {exam ? 'Save Changes' : 'Create Exam'}
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
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
