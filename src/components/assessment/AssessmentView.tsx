import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exam, QuizQuestion, QuizAttempt } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TYPOGRAPHY } from '@/theme/typography';
import * as quizRepo from '@/db/quizRepo';
import { QuestionModal } from './QuestionModal';
import { QuizRunnerModal } from './QuizRunnerModal';
import { QuizScorecardModal } from './QuizScorecardModal';

interface AssessmentViewProps {
  exams: Exam[];
  selectedExamId: number | null;
  onSelectExam: (examId: number | null) => void;
  onOpenExamModal: () => void;
}

export function AssessmentView({
  exams,
  selectedExamId,
  onSelectExam,
  onOpenExamModal,
}: AssessmentViewProps) {
  const { colors } = useTheme();
  const showDeleteActions = useSettingsStore((s) => s.showDeleteActions);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [analytics, setAnalytics] = useState({ totalAttempts: 0, averageScore: 0, totalQuestionsAnswered: 0 });

  // Modals
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showQuizRunner, setShowQuizRunner] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState<number | null>(null);

  const loadData = useCallback(() => {
    try {
      const qList = quizRepo.getAllQuestions(selectedExamId);
      const aList = quizRepo.getAllQuizAttempts(selectedExamId);
      const stats = quizRepo.getQuizAnalytics();
      setQuestions(qList);
      setAttempts(aList);
      setAnalytics(stats);
    } catch (e) {
      console.warn('Error loading assessment data:', e);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteQuestion = (id: number) => {
    Alert.alert('Delete Question', 'Are you sure you want to remove this question from Question Bank?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          quizRepo.deleteQuestion(id);
          loadData();
        },
      },
    ]);
  };

  const handleStartTest = () => {
    if (questions.length === 0) {
      Alert.alert(
        'No Questions Available',
        'Add questions to this exam first using "+ Add Question" or "AI Import".'
      );
      return;
    }
    setShowQuizRunner(true);
  };

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const examTitle = currentExam ? currentExam.name : 'All Exams';

  return (
    <View style={styles.container}>
      {/* Target Exam Filter Pills */}
      <View style={styles.examFilterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examPillsContainer}>
          <Pressable
            onPress={() => onSelectExam(null)}
            style={[
              styles.examPill,
              {
                backgroundColor: selectedExamId === null ? colors.primary : colors.card,
                borderColor: selectedExamId === null ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                TYPOGRAPHY.captionBold,
                { color: selectedExamId === null ? '#FFFFFF' : colors.text },
              ]}
            >
              All Exams
            </Text>
          </Pressable>

          {exams.map((ex) => {
            const isSelected = selectedExamId === ex.id;
            return (
              <Pressable
                key={ex.id}
                onPress={() => onSelectExam(ex.id)}
                style={[
                  styles.examPill,
                  {
                    backgroundColor: isSelected ? ex.color : colors.card,
                    borderColor: isSelected ? ex.color : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    TYPOGRAPHY.captionBold,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {ex.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={onOpenExamModal}
            style={[
              styles.examPill,
              styles.addExamPill,
              { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary, marginLeft: 2 }]}>
              New Exam
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Assessment Overview Stats Card */}
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.statCol}>
          <View style={[styles.statIconBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="help-circle" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{questions.length}</Text>
          <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>Questions</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

        <View style={styles.statCol}>
          <View style={[styles.statIconBadge, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="checkmark-done" size={18} color="#10B981" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{attempts.length}</Text>
          <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>Tests Taken</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

        <View style={styles.statCol}>
          <View style={[styles.statIconBadge, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="trophy" size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{analytics.averageScore}%</Text>
          <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>Avg Score</Text>
        </View>
      </View>

      {/* Action Buttons: Add Questions & Start Quiz */}
      <View style={styles.actionButtonsRow}>
        <Pressable
          onPress={() => setShowQuestionModal(true)}
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.text, marginLeft: 6 }]}>
            + Add Question
          </Text>
        </Pressable>

        <Pressable
          onPress={handleStartTest}
          style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 1.2 }]}
        >
          <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
          <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF', marginLeft: 6 }]}>
            Start Mock Test
          </Text>
        </Pressable>
      </View>

      {/* Question Bank List */}
      <View style={styles.sectionHeader}>
        <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
          Question Bank ({questions.length})
        </Text>
        <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
          {examTitle}
        </Text>
      </View>

      {questions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
          <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 8 }]}>
            No Questions Found
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
            Tap "+ Add Question" to enter questions manually or paste AI-generated MCQs!
          </Text>
        </View>
      ) : (
        questions.slice(0, 15).map((q, idx) => (
          <View
            key={q.id}
            style={[
              styles.qCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.qCardTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.qIndexPill, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '800' }]}>
                    #{idx + 1}
                  </Text>
                </View>
                {q.exam_name && (
                  <View style={[styles.examBadge, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>
                      {q.exam_name}
                    </Text>
                  </View>
                )}
              </View>

                {showDeleteActions && (
                  <Pressable
                    onPress={() => handleDeleteQuestion(q.id)}
                    style={styles.trashBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                  </Pressable>
                )}
            </View>

            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 8 }]}>
              {q.question_text}
            </Text>

            {/* Answer Options Preview */}
            <View style={styles.optionsGrid}>
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const text =
                  opt === 'A'
                    ? q.option_a
                    : opt === 'B'
                    ? q.option_b
                    : opt === 'C'
                    ? q.option_c
                    : q.option_d;
                const isCorrect = q.correct_option === opt;

                return (
                  <View
                    key={opt}
                    style={[
                      styles.optPill,
                      {
                        backgroundColor: isCorrect ? '#10B98118' : colors.surfaceVariant,
                        borderColor: isCorrect ? '#10B981' : 'transparent',
                        borderWidth: isCorrect ? 1 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        TYPOGRAPHY.tiny,
                        {
                          color: isCorrect ? '#10B981' : colors.textSecondary,
                          fontWeight: isCorrect ? '800' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {opt}: {text}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}

      {/* Past Test Attempts Section */}
      {attempts.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
              Past Test Attempts ({attempts.length})
            </Text>
          </View>

          {attempts.slice(0, 5).map((att) => (
            <Pressable
              key={att.id}
              onPress={() => setActiveAttemptId(att.id)}
              style={[
                styles.attemptCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.attemptLeft}>
                <View
                  style={[
                    styles.scoreCircle,
                    {
                      backgroundColor:
                        att.score_percentage >= 80
                          ? '#10B98120'
                          : att.score_percentage >= 50
                          ? '#F59E0B20'
                          : '#EF444420',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: '800',
                      fontSize: 14,
                      color:
                        att.score_percentage >= 80
                          ? '#10B981'
                          : att.score_percentage >= 50
                          ? '#F59E0B'
                          : '#EF4444',
                    }}
                  >
                    {att.score_percentage}%
                  </Text>
                </View>
                <View>
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                    {att.title}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    {att.correct_count}/{att.total_questions} correct • {Math.round(att.time_spent_seconds / 60)}m spent
                  </Text>
                </View>
              </View>

              <View style={styles.reviewPill}>
                <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>Review</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Modals */}
      <QuestionModal
        visible={showQuestionModal}
        exams={exams}
        selectedExamId={selectedExamId}
        onClose={() => setShowQuestionModal(false)}
        onQuestionAdded={loadData}
      />

      <QuizRunnerModal
        visible={showQuizRunner}
        questions={questions}
        examId={selectedExamId}
        examTitle={examTitle}
        durationMinutes={15}
        onClose={() => setShowQuizRunner(false)}
        onFinish={(attemptId) => {
          setShowQuizRunner(false);
          loadData();
          setActiveAttemptId(attemptId);
        }}
      />

      <QuizScorecardModal
        visible={activeAttemptId !== null}
        attemptId={activeAttemptId}
        onClose={() => setActiveAttemptId(null)}
        onRetake={() => {
          setActiveAttemptId(null);
          setShowQuizRunner(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  examFilterSection: {
    marginBottom: 12,
  },
  examPillsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  examPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  addExamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderStyle: 'dashed',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 14,
    elevation: 2,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  qCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  qCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qIndexPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trashBtn: {
    padding: 4,
  },
  optionsGrid: {
    marginTop: 10,
    gap: 6,
  },
  optPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attemptCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  attemptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
