import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QuizQuestion, QuizOptionKey } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import * as quizRepo from '@/db/quizRepo';

interface QuizRunnerModalProps {
  visible: boolean;
  questions: QuizQuestion[];
  examId?: number | null;
  examTitle: string;
  durationMinutes?: number;
  onClose: () => void;
  onFinish: (attemptId: number) => void;
}

export function QuizRunnerModal({
  visible,
  questions,
  examId,
  examTitle,
  durationMinutes = 15,
  onClose,
  onFinish,
}: QuizRunnerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, QuizOptionKey>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<any>(null);
  const handleSubmitTestRef = useRef<(isAuto?: boolean) => void>(() => {});

  const handleSubmitTest = useCallback((isAuto: boolean = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const total = questions.length;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const answerRecords: {
      questionId: number;
      selectedOption?: QuizOptionKey | null;
      isCorrect: boolean;
    }[] = [];

    for (const q of questions) {
      const chosen = selectedAnswers[q.id];
      if (!chosen) {
        skipped++;
        answerRecords.push({ questionId: q.id, selectedOption: null, isCorrect: false });
      } else if (chosen === q.correct_option) {
        correct++;
        answerRecords.push({ questionId: q.id, selectedOption: chosen, isCorrect: true });
      } else {
        wrong++;
        answerRecords.push({ questionId: q.id, selectedOption: chosen, isCorrect: false });
      }
    }

    const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = durationMinutes * 60 - timeLeft;

    const attemptId = quizRepo.recordQuizAttempt({
      examId: examId ?? null,
      categoryId: questions[currentIndex]?.category_id ?? null,
      title: `${examTitle} Mock Test`,
      totalQuestions: total,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      scorePercentage: scorePct,
      timeSpentSeconds: Math.max(1, timeSpent),
      answers: answerRecords,
    });

    setIsSubmitting(false);
    onFinish(attemptId);

    if (isAuto) {
      Alert.alert('Time Up!', 'Your assessment has been automatically submitted.');
    }
  }, [
    isSubmitting,
    questions,
    selectedAnswers,
    durationMinutes,
    timeLeft,
    examId,
    currentIndex,
    examTitle,
    onFinish,
  ]);

  useEffect(() => {
    handleSubmitTestRef.current = handleSubmitTest;
  }, [handleSubmitTest]);

  useEffect(() => {
    if (visible && questions.length > 0) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setMarkedForReview({});
      setTimeLeft(durationMinutes * 60);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitTestRef.current(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, questions, durationMinutes]);

  if (!visible || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (opt: QuizOptionKey) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt,
    }));
  };

  const handleToggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleClearChoice = () => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const confirmSubmit = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    Alert.alert(
      'Submit Assessment?',
      `You have answered ${answeredCount} of ${questions.length} questions. Are you ready to submit and view your score?`,
      [
        { text: 'Keep Practicing', style: 'cancel' },
        { text: 'Submit Test', style: 'default', onPress: () => handleSubmitTest(false) },
      ]
    );
  };

  const confirmExit = () => {
    Alert.alert(
      'Quit Test?',
      'Progress will not be saved if you leave now.',
      [
        { text: 'Continue Test', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onClose },
      ]
    );
  };

  const isLowTime = timeLeft < 120; // less than 2 min
  const isSelected = selectedAnswers[currentQ.id];
  const isReviewed = markedForReview[currentQ.id];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={confirmExit}>
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
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={confirmExit} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.headerTitleBox}>
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]} numberOfLines={1}>
              {examTitle} Test
            </Text>
            <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
          </View>

          {/* Timer Badge */}
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: isLowTime ? '#EF444420' : colors.surfaceVariant,
                borderColor: isLowTime ? '#EF4444' : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="stopwatch-outline"
              size={16}
              color={isLowTime ? '#EF4444' : colors.primary}
            />
            <Text
              style={[
                styles.timerText,
                { color: isLowTime ? '#EF4444' : colors.text },
              ]}
            >
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Question Navigator Bar */}
        <View style={styles.navBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navPills}>
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isMarked = markedForReview[q.id];
              const isCur = idx === currentIndex;

              let bgColor = colors.card;
              let textColor = colors.text;
              let borderColor = colors.border;

              if (isCur) {
                borderColor = colors.primary;
              }
              if (isAnswered) {
                bgColor = '#10B981';
                textColor = '#FFFFFF';
              } else if (isMarked) {
                bgColor = '#8B5CF6';
                textColor = '#FFFFFF';
              }

              return (
                <Pressable
                  key={q.id}
                  onPress={() => setCurrentIndex(idx)}
                  style={[
                    styles.navPill,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      borderWidth: isCur ? 2.5 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.navPillText, { color: textColor }]}>
                    {idx + 1}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Question Body */}
        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.badgeRow}>
              <View style={[styles.qNumBadge, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>
                  Q{currentIndex + 1}
                </Text>
              </View>

              <Pressable
                onPress={handleToggleReview}
                style={[
                  styles.flagBtn,
                  isReviewed && { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' },
                ]}
              >
                <Ionicons
                  name={isReviewed ? 'flag' : 'flag-outline'}
                  size={16}
                  color={isReviewed ? '#8B5CF6' : colors.textSecondary}
                />
                <Text
                  style={[
                    TYPOGRAPHY.tiny,
                    { color: isReviewed ? '#8B5CF6' : colors.textSecondary, marginLeft: 4, fontWeight: '700' },
                  ]}
                >
                  {isReviewed ? 'Marked' : 'Review Later'}
                </Text>
              </Pressable>
            </View>

            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 12, lineHeight: 22 }]}>
              {currentQ.question_text}
            </Text>
          </View>

          {/* Options */}
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginVertical: 10, paddingHorizontal: 4 }]}>
            SELECT YOUR ANSWER:
          </Text>

          {(['A', 'B', 'C', 'D'] as QuizOptionKey[]).map((key) => {
            const optText =
              key === 'A'
                ? currentQ.option_a
                : key === 'B'
                ? currentQ.option_b
                : key === 'C'
                ? currentQ.option_c
                : currentQ.option_d;

            const isThisChosen = selectedAnswers[currentQ.id] === key;

            return (
              <Pressable
                key={key}
                onPress={() => handleSelectOption(key)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isThisChosen ? `${colors.primary}14` : colors.card,
                    borderColor: isThisChosen ? colors.primary : colors.cardBorder,
                    borderWidth: isThisChosen ? 2 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionRadio,
                    {
                      borderColor: isThisChosen ? colors.primary : colors.textMuted,
                      backgroundColor: isThisChosen ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: isThisChosen ? '#FFFFFF' : colors.text, fontWeight: '700', fontSize: 13 }}>
                    {key}
                  </Text>
                </View>

                <Text
                  style={[
                    TYPOGRAPHY.body,
                    {
                      color: isThisChosen ? colors.primary : colors.text,
                      flex: 1,
                      fontWeight: isThisChosen ? '700' : '400',
                    },
                  ]}
                >
                  {optText}
                </Text>

                {isThisChosen && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </Pressable>
            );
          })}

          {isSelected && (
            <Pressable onPress={handleClearChoice} style={styles.clearBtn}>
              <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted, marginLeft: 4 }]}>
                Clear Response
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Bottom Navigation Controls */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable
            disabled={currentIndex === 0}
            onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            style={[
              styles.navStepBtn,
              {
                borderColor: colors.border,
                borderWidth: 1,
                opacity: currentIndex === 0 ? 0.4 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginLeft: 4 }]}>Prev</Text>
          </Pressable>

          {currentIndex === questions.length - 1 ? (
            <Pressable
              onPress={confirmSubmit}
              style={[styles.submitBtn, { backgroundColor: '#10B981' }]}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF', marginLeft: 6 }]}>
                Submit Test
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF', marginRight: 4 }]}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Pressable>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  navBar: {
    paddingVertical: 10,
  },
  navPills: {
    paddingHorizontal: 16,
    gap: 8,
  },
  navPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
  },
  optionRadio: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  navStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
});
