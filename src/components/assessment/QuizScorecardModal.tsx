import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QuizAttempt, QuizAttemptAnswer } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import * as quizRepo from '@/db/quizRepo';

interface QuizScorecardModalProps {
  visible: boolean;
  attemptId: number | null;
  onClose: () => void;
  onRetake?: () => void;
}

export function QuizScorecardModal({
  visible,
  attemptId,
  onClose,
  onRetake,
}: QuizScorecardModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<QuizAttemptAnswer[]>([]);

  useEffect(() => {
    if (visible && attemptId) {
      const data = quizRepo.getQuizAttemptDetails(attemptId);
      setAttempt(data.attempt);
      setAnswers(data.answers);
    }
  }, [visible, attemptId]);

  if (!visible || !attempt) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const pct = attempt.score_percentage;
  const badgeColor = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 0),
            paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === 'android' ? 14 : 8),
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>Assessment Results</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Main Scorecard Banner */}
          <View
            style={[
              styles.scoreCard,
              {
                backgroundColor: colors.card,
                borderColor: badgeColor,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={[styles.scoreBadge, { backgroundColor: `${badgeColor}20` }]}>
              <Text style={[styles.scorePercentage, { color: badgeColor }]}>{pct}%</Text>
              <Text style={[TYPOGRAPHY.tiny, { color: badgeColor, fontWeight: '800' }]}>
                {pct >= 80 ? 'EXCELLENT' : pct >= 50 ? 'GOOD EFFORT' : 'NEEDS PRACTICE'}
              </Text>
            </View>

            <Text style={[TYPOGRAPHY.h2, { color: colors.text, marginTop: 12 }]}>
              {attempt.title}
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Completed in {formatTime(attempt.time_spent_seconds)}
            </Text>

            {/* Metrics Breakdown Grid */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricBox, { backgroundColor: `${colors.primary}12` }]}>
                <Text style={[styles.metricNum, { color: colors.primary }]}>
                  {attempt.total_questions}
                </Text>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>Total</Text>
              </View>

              <View style={[styles.metricBox, { backgroundColor: '#10B98115' }]}>
                <Text style={[styles.metricNum, { color: '#10B981' }]}>
                  {attempt.correct_count}
                </Text>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>Correct</Text>
              </View>

              <View style={[styles.metricBox, { backgroundColor: '#EF444415' }]}>
                <Text style={[styles.metricNum, { color: '#EF4444' }]}>
                  {attempt.wrong_count}
                </Text>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>Wrong</Text>
              </View>

              <View style={[styles.metricBox, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.metricNum, { color: colors.textMuted }]}>
                  {attempt.skipped_count}
                </Text>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>Skipped</Text>
              </View>
            </View>
          </View>

          {/* Solutions & Explanations Header */}
          <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginTop: 20, marginBottom: 12 }]}>
            Question Analysis & Explanations ({answers.length})
          </Text>

          {answers.map((item, idx) => {
            const isCorrect = item.is_correct === 1;
            const isSkipped = !item.selected_option;

            return (
              <View
                key={item.id}
                style={[
                  styles.solutionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isCorrect ? '#10B98150' : isSkipped ? colors.cardBorder : '#EF444450',
                  },
                ]}
              >
                {/* Question Top Row */}
                <View style={styles.qHeader}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isCorrect
                          ? '#10B98120'
                          : isSkipped
                          ? `${colors.textMuted}20`
                          : '#EF444420',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        isCorrect
                          ? 'checkmark-circle'
                          : isSkipped
                          ? 'help-circle-outline'
                          : 'close-circle'
                      }
                      size={14}
                      color={isCorrect ? '#10B981' : isSkipped ? colors.textMuted : '#EF4444'}
                    />
                    <Text
                      style={[
                        TYPOGRAPHY.tiny,
                        {
                          color: isCorrect ? '#10B981' : isSkipped ? colors.textMuted : '#EF4444',
                          fontWeight: '700',
                          marginLeft: 4,
                        },
                      ]}
                    >
                      Q{idx + 1} {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </Text>
                  </View>
                </View>

                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 8 }]}>
                  {item.question_text}
                </Text>

                {/* Selected vs Correct option tags */}
                <View style={styles.ansComparison}>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    Your Choice:{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: isCorrect ? '#10B981' : isSkipped ? colors.textMuted : '#EF4444',
                      }}
                    >
                      {item.selected_option ? `Option ${item.selected_option}` : 'None'}
                    </Text>
                  </Text>

                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    Correct Answer:{' '}
                    <Text style={{ fontWeight: '800', color: '#10B981' }}>
                      Option {item.correct_option}
                    </Text>
                  </Text>
                </View>

                {/* Explanation Box */}
                {item.explanation ? (
                  <View style={[styles.explanationBox, { backgroundColor: colors.surfaceVariant }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="bulb-outline" size={15} color={colors.primary} />
                      <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '800', marginLeft: 4 }]}>
                        EXPLANATION
                      </Text>
                    </View>
                    <Text style={[TYPOGRAPHY.caption, { color: colors.text }]}>
                      {item.explanation}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          {onRetake && (
            <Pressable
              onPress={() => {
                onClose();
                onRetake();
              }}
              style={[styles.actionBtn, { borderColor: colors.border, borderWidth: 1 }]}
            >
              <Ionicons name="refresh" size={18} color={colors.text} />
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginLeft: 6 }]}>
                Retake
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={onClose}
            style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 1 }]}
          >
            <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scoreCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
  },
  scoreBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 26,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    width: '100%',
  },
  metricBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  solutionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ansComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 6,
  },
  explanationBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    paddingHorizontal: 20,
  },
});
