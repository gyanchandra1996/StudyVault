import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Category } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TYPOGRAPHY } from '@/theme/typography';

interface CategoryCardProps {
  category: Category;
  layout?: 'grid' | 'list';
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export function CategoryCard({
  category,
  layout = 'grid',
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const { colors, isDark } = useTheme();
  const showDeleteActions = useSettingsStore((s) => s.showDeleteActions);

  const handlePress = () => {
    router.push({
      pathname: '/category/[id]',
      params: { id: String(category.id), name: category.name, color: category.color },
    });
  };

  const isGrid = layout === 'grid';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        isGrid ? styles.gridCard : styles.listCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.3 : 0.06,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${category.color}20`,
            },
          ]}
        >
          <Ionicons
            name={(category.icon as any) || 'folder-outline'}
            size={24}
            color={category.color}
          />
        </View>

        <View style={styles.headerActions}>
          {onEdit && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}
          {onDelete && showDeleteActions && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete(category);
              }}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text
          style={[TYPOGRAPHY.h3, { color: colors.text, marginTop: 10 }]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
        {category.description ? (
          <Text
            style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 4 }]}
            numberOfLines={2}
          >
            {category.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginLeft: 4 }]}>
            {category.pdf_count || 0} {category.pdf_count === 1 ? 'doc' : 'docs'}
          </Text>
        </View>

        {category.exam_name ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: `${category.exam_color || colors.primary}18`, marginLeft: 6 },
            ]}
          >
            <Text
              style={[
                TYPOGRAPHY.tiny,
                { color: category.exam_color || colors.primary, fontWeight: '800' },
              ]}
              numberOfLines={1}
            >
              {category.exam_name}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    minWidth: 155,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    margin: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  listCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 4,
  },
  cardBody: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
