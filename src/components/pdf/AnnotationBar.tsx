import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { HighlightColor, AnnotationType } from '@/types/database';

interface AnnotationBarProps {
  selectedText: string;
  onApply: (color: HighlightColor, type: AnnotationType, note?: string) => void;
  onCancel: () => void;
  onAddNote: () => void;
  onSpeak?: () => void;
  onCreateFlashcard?: () => void;
}

const COLORS: { key: HighlightColor; hex: string; name: string }[] = [
  { key: 'yellow', hex: '#FACC15', name: 'Yellow' },
  { key: 'green', hex: '#22C55E', name: 'Green' },
  { key: 'blue', hex: '#3B82F6', name: 'Blue' },
  { key: 'pink', hex: '#EC4899', name: 'Pink' },
  { key: 'orange', hex: '#F97316', name: 'Orange' },
  { key: 'purple', hex: '#A855F7', name: 'Purple' },
];

export function AnnotationBar({
  selectedText,
  onApply,
  onCancel,
  onAddNote,
  onSpeak,
  onCreateFlashcard,
}: AnnotationBarProps) {
  const { colors, isDark } = useTheme();
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const [selectedType, setSelectedType] = useState<AnnotationType>('highlight');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.4 : 0.15,
        },
      ]}
    >
      <View style={styles.snippetRow}>
        <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]} numberOfLines={1}>
          "{selectedText.length > 50 ? selectedText.slice(0, 50) + '...' : selectedText}"
        </Text>
        <Pressable onPress={onCancel} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Colors Row */}
      <View style={styles.colorsRow}>
        {COLORS.map((c) => {
          const isSelected = selectedColor === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => setSelectedColor(c.key)}
              style={[
                styles.colorDot,
                { backgroundColor: c.hex },
                isSelected && [styles.colorDotSelected, { borderColor: colors.text }],
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={12} color="#000000" />}
            </Pressable>
          );
        })}
      </View>

      {/* Tool Type & Apply */}
      <View style={[styles.typesRow, { borderTopColor: colors.border }]}>
        <View style={styles.typeButtonGroup}>
          <Pressable
            onPress={() => setSelectedType('highlight')}
            style={[
              styles.typeBtn,
              selectedType === 'highlight' && { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name="color-wand"
              size={18}
              color={selectedType === 'highlight' ? colors.primary : colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => setSelectedType('underline')}
            style={[
              styles.typeBtn,
              selectedType === 'underline' && { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name="remove"
              size={18}
              color={selectedType === 'underline' ? colors.primary : colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => setSelectedType('strikethrough')}
            style={[
              styles.typeBtn,
              selectedType === 'strikethrough' && { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name="reorder-two-outline"
              size={18}
              color={selectedType === 'strikethrough' ? colors.primary : colors.textSecondary}
            />
          </Pressable>

          <Pressable onPress={onAddNote} style={styles.typeBtn} hitSlop={4}>
            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
          </Pressable>

          {onCreateFlashcard && (
            <Pressable onPress={onCreateFlashcard} style={styles.typeBtn} hitSlop={4}>
              <Ionicons name="albums-outline" size={18} color={colors.primary} />
            </Pressable>
          )}

          {onSpeak && (
            <Pressable onPress={onSpeak} style={styles.typeBtn} hitSlop={4}>
              <Ionicons name="volume-medium-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => onApply(selectedColor, selectedType)}
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF' }]}>Annotate</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    elevation: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    zIndex: 999,
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeBtn: {
    padding: 2,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDotSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  typesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 8,
  },
  typeButtonGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  typeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
