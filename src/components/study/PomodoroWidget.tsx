import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

interface PomodoroWidgetProps {
  visible: boolean;
  pdfId?: number | null;
  categoryId?: number | null;
  onClose: () => void;
}

const PRESET_DURATIONS = [15, 25, 30, 45, 60];

export function PomodoroWidget({
  visible,
  pdfId,
  categoryId,
  onClose,
}: PomodoroWidgetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    mode,
    timeLeft,
    isActive,
    workDurationMinutes,
    breakDurationMinutes,
    setMode,
    toggleTimer,
    resetTimer,
    setDurations,
    setModalVisible,
    setActiveContext,
  } = usePomodoroStore();

  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSecs =
    mode === 'work' ? workDurationMinutes * 60 : breakDurationMinutes * 60;
  const progress = Math.max(0, Math.min(1, 1 - timeLeft / (totalSecs || 1)));

  const handleClose = () => {
    onClose();
    setModalVisible(false);
  };

  const adjustWorkMinutes = (delta: number) => {
    const next = Math.max(5, Math.min(120, workDurationMinutes + delta));
    setDurations(next, breakDurationMinutes);
  };

  const adjustBreakMinutes = (delta: number) => {
    const next = Math.max(1, Math.min(30, breakDurationMinutes + delta));
    setDurations(workDurationMinutes, next);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + (Platform.OS === 'android' ? 10 : 6),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="timer-outline" size={24} color={colors.primary} />
              <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginLeft: 8 }]}>
                Study Pomodoro
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => setShowSettings((prev) => !prev)}
                hitSlop={8}
                style={[
                  styles.headerIconBtn,
                  showSettings && { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={showSettings ? colors.primary : colors.textSecondary}
                />
              </Pressable>

              <Pressable onPress={handleClose} hitSlop={8} style={styles.headerIconBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Mode Switcher */}
          <View style={[styles.modeRow, { backgroundColor: colors.surfaceVariant }]}>
            <Pressable
              onPress={() => setMode('work')}
              style={[
                styles.modeBtn,
                mode === 'work' && { backgroundColor: colors.card, elevation: 2 },
              ]}
            >
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: mode === 'work' ? colors.primary : colors.textSecondary },
                ]}
              >
                Focus ({workDurationMinutes}m)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('shortBreak')}
              style={[
                styles.modeBtn,
                mode === 'shortBreak' && { backgroundColor: colors.card, elevation: 2 },
              ]}
            >
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: mode === 'shortBreak' ? '#10B981' : colors.textSecondary },
                ]}
              >
                Break ({breakDurationMinutes}m)
              </Text>
            </Pressable>
          </View>

          {/* Custom Duration Settings Panel (Collapsible) */}
          {showSettings ? (
            <View
              style={[
                styles.settingsCard,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
            >
              <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 8 }]}>
                CUSTOM FOCUS PRESETS (MINUTES)
              </Text>
              <View style={styles.presetRow}>
                {PRESET_DURATIONS.map((mins) => {
                  const isSelected = workDurationMinutes === mins;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => setDurations(mins, breakDurationMinutes)}
                      style={[
                        styles.presetBtn,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          TYPOGRAPHY.captionBold,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {mins}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Fine Tuning Steppers */}
              <View style={styles.stepperContainer}>
                <View style={styles.stepperItem}>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    Focus Length: <Text style={{ fontWeight: '700', color: colors.text }}>{workDurationMinutes}m</Text>
                  </Text>
                  <View style={styles.stepperControls}>
                    <Pressable
                      onPress={() => adjustWorkMinutes(-5)}
                      style={[styles.stepBtn, { backgroundColor: colors.card }]}
                      hitSlop={6}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => adjustWorkMinutes(5)}
                      style={[styles.stepBtn, { backgroundColor: colors.card }]}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.stepperItem}>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    Break Length: <Text style={{ fontWeight: '700', color: colors.text }}>{breakDurationMinutes}m</Text>
                  </Text>
                  <View style={styles.stepperControls}>
                    <Pressable
                      onPress={() => adjustBreakMinutes(-1)}
                      style={[styles.stepBtn, { backgroundColor: colors.card }]}
                      hitSlop={6}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => adjustBreakMinutes(1)}
                      style={[styles.stepBtn, { backgroundColor: colors.card }]}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Clock Display */}
          <View style={styles.clockContainer}>
            <Text style={[styles.clockText, { color: colors.text }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted, marginTop: 4 }]}>
              {isActive
                ? mode === 'work'
                  ? '🎯 Deep focus in progress...'
                  : '☕ Relaxation break...'
                : 'Paused — tap start to focus'}
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
              onPress={() => {
                setActiveContext(pdfId, categoryId);
                toggleTimer();
              }}
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
                {isActive ? 'Pause' : mode === 'work' ? 'Start Focus' : 'Start Break'}
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
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 16,
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
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  modeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    gap: 8,
  },
  stepperItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperControls: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  clockText: {
    fontSize: 52,
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
    marginTop: 20,
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
