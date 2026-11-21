import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import * as studyTimerRepo from '@/db/studyTimerRepo';

interface PomodoroWidgetProps {
  visible: boolean;
  pdfId?: number | null;
  categoryId?: number | null;
  onClose: () => void;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODE_DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60, // 25 min
  shortBreak: 5 * 60, // 5 min
  longBreak: 15 * 60, // 15 min
};

export function PomodoroWidget({
  visible,
  pdfId,
  categoryId,
  onClose,
}: PomodoroWidgetProps) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.work);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<any>(null);

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  };

  const handleTimerComplete = () => {
    if (mode === 'work') {
      studyTimerRepo.recordStudySession(pdfId ?? null, categoryId ?? null, MODE_DURATIONS.work, 'pomodoro');
      Alert.alert(
        '🎉 Focus Session Complete!',
        'Great job! 25 minutes of deep study logged. Take a 5-minute break.'
      );
      switchMode('shortBreak');
    } else {
      Alert.alert('Break Finished', 'Ready to begin your next focus session?');
      switchMode('work');
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / MODE_DURATIONS[mode];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="timer-outline" size={22} color={colors.primary} />
              <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginLeft: 8 }]}>
                Study Pomodoro
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Mode Switcher */}
          <View style={[styles.modeRow, { backgroundColor: colors.surfaceVariant }]}>
            <Pressable
              onPress={() => switchMode('work')}
              style={[
                styles.modeBtn,
                mode === 'work' && { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: mode === 'work' ? colors.primary : colors.textSecondary },
                ]}
              >
                Focus (25m)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => switchMode('shortBreak')}
              style={[
                styles.modeBtn,
                mode === 'shortBreak' && { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: mode === 'shortBreak' ? colors.primary : colors.textSecondary },
                ]}
              >
                Break (5m)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => switchMode('longBreak')}
              style={[
                styles.modeBtn,
                mode === 'longBreak' && { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: mode === 'longBreak' ? colors.primary : colors.textSecondary },
                ]}
              >
                Long (15m)
              </Text>
            </Pressable>
          </View>

          {/* Clock Display */}
          <View style={styles.clockContainer}>
            <Text style={[styles.clockText, { color: colors.text }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted, marginTop: 4 }]}>
              {isActive ? 'Session in progress...' : 'Paused'}
            </Text>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: mode === 'work' ? colors.primary : '#10B981',
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={resetTimer}
              style={[
                styles.circleBtn,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              hitSlop={8}
            >
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={toggleTimer}
              style={[
                styles.mainActionBtn,
                { backgroundColor: mode === 'work' ? colors.primary : '#10B981' },
              ]}
            >
              <Ionicons
                name={isActive ? 'pause' : 'play'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF', marginLeft: 8 }]}>
                {isActive ? 'Pause' : 'Start Focus'}
              </Text>
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
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  clockText: {
    fontSize: 54,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
});
