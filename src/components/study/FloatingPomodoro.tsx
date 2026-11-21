import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

export function FloatingPomodoro() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    mode,
    timeLeft,
    isActive,
    isModalVisible,
    workDurationMinutes,
    breakDurationMinutes,
    toggleTimer,
    setModalVisible,
    tick,
  } = usePomodoroStore();

  // Run the background tick interval
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, tick]);

  const totalSecs =
    mode === 'work' ? workDurationMinutes * 60 : breakDurationMinutes * 60;
  const isStarted = timeLeft < totalSecs;

  // Don't show floating pill if the full modal is open or timer is inactive and untouched
  if (isModalVisible || (!isActive && !isStarted)) {
    return null;
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const modeColor = mode === 'work' ? colors.primary : '#10B981';

  return (
    <View
      style={[
        styles.floatingContainer,
        {
          bottom: Math.max(insets.bottom, 16) + 70, // Sits comfortably above bottom tab bar
          shadowColor: colors.shadow,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[
          styles.pill,
          {
            backgroundColor: colors.card,
            borderColor: modeColor,
            shadowOpacity: isDark ? 0.35 : 0.12,
          },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: modeColor }]} />

        <Ionicons
          name={mode === 'work' ? 'timer-outline' : 'cafe-outline'}
          size={16}
          color={modeColor}
        />

        <View style={styles.timeSection}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>
            {mode === 'work' ? 'Focus' : 'Break'}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleTimer();
          }}
          style={[styles.actionBtn, { backgroundColor: `${modeColor}18` }]}
          hitSlop={6}
        >
          <Ionicons
            name={isActive ? 'pause' : 'play'}
            size={16}
            color={modeColor}
          />
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            setModalVisible(true);
          }}
          style={styles.expandBtn}
          hitSlop={6}
        >
          <Ionicons name="expand-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
    elevation: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandBtn: {
    padding: 2,
  },
});
