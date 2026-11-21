import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

interface StudyTrackerCardProps {
  todayMinutes: number;
  streakDays: number;
  totalPagesRead: number;
  completedPdfsCount?: number;
  onOpenTimer: () => void;
}

export function StudyTrackerCard({
  todayMinutes,
  streakDays,
  totalPagesRead,
  completedPdfsCount,
  onOpenTimer,
}: StudyTrackerCardProps) {
  const { colors, isDark } = useTheme();

  const dailyGoalMinutes = 60;
  const progressPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.35 : 0.06,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.badgeIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="flame" size={20} color="#F59E0B" />
          </View>
          <View>
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
              Daily Study Progress
            </Text>
            <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>
              {streakDays > 0 ? `${streakDays} Days Streak 🔥 Keep it up!` : 'Start today’s study session!'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onOpenTimer}
          style={[styles.timerButton, { backgroundColor: colors.primary }]}
          hitSlop={6}
        >
          <Ionicons name="play" size={14} color="#FFFFFF" />
          <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF', marginLeft: 4 }]}>
            Focus
          </Text>
        </Pressable>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.text }]}>
            {todayMinutes}m <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>/ {dailyGoalMinutes}m goal</Text>
          </Text>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>
            {progressPercent}%
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progressPercent}%` },
            ]}
          />
        </View>
      </View>

      {/* Metrics Row */}
      <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
        <View style={styles.metricItem}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
            Studied: <Text style={{ fontWeight: '700', color: colors.text }}>{todayMinutes} mins</Text>
          </Text>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

        <View style={styles.metricItem}>
          <Ionicons name="book-outline" size={16} color="#059669" />
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
            Read: <Text style={{ fontWeight: '700', color: colors.text }}>{totalPagesRead} pages</Text>
          </Text>
        </View>

        {completedPdfsCount !== undefined && completedPdfsCount > 0 && (
          <>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginLeft: 5 }]}>
                Done: <Text style={{ fontWeight: '700', color: colors.text }}>{completedPdfsCount}</Text>
              </Text>
            </View>
          </>
        )}

        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

        <View style={styles.metricItem}>
          <Ionicons name="trophy-outline" size={16} color="#F59E0B" />
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
            Streak: <Text style={{ fontWeight: '700', color: colors.text }}>{streakDays}d</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  progressSection: {
    marginTop: 14,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 16,
  },
});
