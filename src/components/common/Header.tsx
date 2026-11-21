import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
  };
  rightComponent?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  rightComponent,
}: HeaderProps) {
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: pressed ? colors.surfaceVariant : 'transparent' },
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <Text style={[TYPOGRAPHY.h2, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {rightComponent}
        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: pressed ? colors.surfaceVariant : 'transparent' },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={rightAction.icon}
              size={22}
              color={rightAction.color || colors.text}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 6,
    borderRadius: 20,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 20,
  },
});
