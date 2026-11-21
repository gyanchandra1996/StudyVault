import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Exam, QuizOptionKey } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TYPOGRAPHY } from '@/theme/typography';
import * as quizRepo from '@/db/quizRepo';
import {
  generateQuestionsWithAi,
  GeneratedQuestion,
} from '@/services/geminiService';

interface QuestionModalProps {
  visible: boolean;
  exams: Exam[];
  selectedExamId?: number | null;
  onClose: () => void;
  onQuestionAdded: () => void;
}

export function QuestionModal({
  visible,
  exams,
  selectedExamId,
  onClose,
  onQuestionAdded,
}: QuestionModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isAiEnabled, geminiApiKey, aiModel } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [examId, setExamId] = useState<number | null>(selectedExamId ?? null);

  // Manual Form State
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<QuizOptionKey>('A');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // AI Generator State
  const [aiSubMode, setAiSubMode] = useState<'generate' | 'paste'>('generate');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [aiLanguage, setAiLanguage] = useState<'bilingual' | 'english' | 'hindi'>('bilingual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<GeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Text Paste Parser State
  const [aiText, setAiText] = useState('');

  const resetForm = () => {
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
    setExplanation('');
    setAiText('');
    setGeneratedList([]);
    setSelectedIndices([]);
  };

  const handleSaveManual = () => {
    if (!questionText.trim()) {
      Alert.alert('Required', 'Please enter question text');
      return;
    }
    if (!optionA.trim() || !optionB.trim()) {
      Alert.alert('Required', 'Please enter at least Option A and Option B');
      return;
    }

    try {
      quizRepo.createQuestion({
        examId,
        questionText: questionText.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim() || 'None of the above',
        optionD: optionD.trim() || 'All of the above',
        correctOption,
        explanation: explanation.trim() || undefined,
        difficulty,
      });

      resetForm();
      onQuestionAdded();
      onClose();
      Alert.alert('Success', 'Question added to Question Bank!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save question.');
    }
  };

  // Generate Questions via Gemini AI
  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) {
      Alert.alert('Topic Required', 'Please enter a topic or paste study notes snippet to generate questions from.');
      return;
    }

    if (!geminiApiKey) {
      Alert.alert(
        'Gemini API Key Missing',
        'Please enter your free Gemini API Key in Settings to use AI question generation.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              onClose();
              router.push('/(tabs)/settings');
            },
          },
        ]
      );
      return;
    }

    setIsGenerating(true);
    try {
      const selectedExam = exams.find((e) => e.id === examId);
      const questions = await generateQuestionsWithAi({
        apiKey: geminiApiKey,
        model: aiModel,
        topic: aiTopic.trim(),
        examName: selectedExam?.name,
        questionCount: aiCount,
        difficulty: aiDifficulty,
        language: aiLanguage,
      });

      setGeneratedList(questions);
      setSelectedIndices(questions.map((_, i) => i));
    } catch (err: any) {
      Alert.alert('AI Generation Error', err?.message || 'Failed to generate questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle selection of generated question in preview
  const toggleSelectGenerated = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Save selected AI-generated questions into SQLite
  const handleSaveGenerated = () => {
    const toInsert = generatedList.filter((_, idx) => selectedIndices.includes(idx));
    if (toInsert.length === 0) {
      Alert.alert('Select Questions', 'Please select at least 1 question to import.');
      return;
    }

    try {
      const mapped = toInsert.map((item) => ({
        examId,
        questionText: item.questionText,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctOption: item.correctOption,
        explanation: item.explanation,
        difficulty: item.difficulty,
      }));

      const count = quizRepo.createQuestionsBulk(mapped);
      resetForm();
      onQuestionAdded();
      onClose();
      Alert.alert('Imported Successfully', `Added ${count} questions to Question Bank! 🎉`);
    } catch (err: any) {
      Alert.alert('Import Error', err?.message || 'Failed to save generated questions.');
    }
  };

  // Fast Text Paste / Parser
  const handleParseAiImport = () => {
    if (!aiText.trim()) {
      Alert.alert('Empty Text', 'Paste questions text first.');
      return;
    }

    try {
      const blocks = aiText.split(/(?=(?:Q\d*[:.]|\n\s*\d+[\.\)]\s*))/i).filter((b) => b.trim().length > 10);
      const parsedQuestions: any[] = [];

      for (const block of blocks) {
        const qMatch = block.match(/(?:Q\d*[:.]|\d+[\.\)])\s*([^\n]+)/i);
        const aMatch = block.match(/A[\.:\)]\s*([^\n]+)/i);
        const bMatch = block.match(/B[\.:\)]\s*([^\n]+)/i);
        const cMatch = block.match(/C[\.:\)]\s*([^\n]+)/i);
        const dMatch = block.match(/D[\.:\)]\s*([^\n]+)/i);
        const ansMatch = block.match(/(?:Ans|Answer|Correct)[\.:\s]*([ABCD])/i);
        const expMatch = block.match(/(?:Exp|Explanation)[\.:\s]*([^\n]+)/i);

        if (qMatch && aMatch && bMatch) {
          parsedQuestions.push({
            examId,
            questionText: qMatch[1].trim(),
            optionA: aMatch[1].trim(),
            optionB: bMatch[1].trim(),
            optionC: cMatch ? cMatch[1].trim() : 'Option C',
            optionD: dMatch ? dMatch[1].trim() : 'Option D',
            correctOption: (ansMatch ? ansMatch[1].toUpperCase() : 'A') as QuizOptionKey,
            explanation: expMatch ? expMatch[1].trim() : null,
            difficulty: 'medium',
          });
        }
      }

      if (parsedQuestions.length === 0) {
        Alert.alert(
          'Format Notice',
          'Could not find standard questions format.\nUse format like:\nQ: What is...\nA: First\nB: Second\nC: Third\nD: Fourth\nAns: A\nExp: Details'
        );
        return;
      }

      const count = quizRepo.createQuestionsBulk(parsedQuestions);
      resetForm();
      onQuestionAdded();
      onClose();
      Alert.alert('Imported Successfully', `Added ${count} questions to Question Bank!`);
    } catch (err: any) {
      Alert.alert('Import Error', err?.message || 'Failed to parse questions.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.header}>
            <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>Add Exam Questions</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Mode Tabs: Manual vs AI / Bulk Import */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceVariant }]}>
            <Pressable
              onPress={() => setActiveTab('manual')}
              style={[
                styles.tabBtn,
                activeTab === 'manual' && { backgroundColor: colors.card, elevation: 2 },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={activeTab === 'manual' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: activeTab === 'manual' ? colors.primary : colors.textSecondary, marginLeft: 6 },
                ]}
              >
                Manual Entry
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('ai')}
              style={[
                styles.tabBtn,
                activeTab === 'ai' && { backgroundColor: colors.card, elevation: 2 },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color={activeTab === 'ai' ? '#8B5CF6' : colors.textSecondary}
              />
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: activeTab === 'ai' ? '#8B5CF6' : colors.textSecondary, marginLeft: 6 },
                ]}
              >
                AI & Bulk Questions
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Target Exam Selector */}
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 8 }]}>
              TARGET EXAM
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <Pressable
                onPress={() => setExamId(null)}
                style={[
                  styles.examChip,
                  {
                    backgroundColor: examId === null ? colors.primary : colors.surfaceVariant,
                    borderColor: examId === null ? colors.primary : colors.cardBorder,
                    marginRight: 8,
                  },
                ]}
              >
                <Text
                  style={[
                    TYPOGRAPHY.captionBold,
                    { color: examId === null ? '#FFFFFF' : colors.text },
                  ]}
                >
                  General / All Exams
                </Text>
              </Pressable>
              {exams.map((ex) => {
                const isSelected = examId === ex.id;
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => setExamId(ex.id)}
                    style={[
                      styles.examChip,
                      {
                        backgroundColor: isSelected ? ex.color || colors.primary : colors.surfaceVariant,
                        borderColor: isSelected ? ex.color || colors.primary : colors.cardBorder,
                        marginRight: 8,
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
            </ScrollView>

            {activeTab === 'manual' ? (
              /* Manual Single Question Entry */
              <>
                <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
                  QUESTION TEXT *
                </Text>
                <TextInput
                  value={questionText}
                  onChangeText={setQuestionText}
                  placeholder="e.g. Which layer of OSI model provides end-to-end communication?"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.textArea,
                    TYPOGRAPHY.body,
                    { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
                  ]}
                />

                <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginTop: 14, marginBottom: 8 }]}>
                  OPTIONS (TAP RADIO CIRCLE TO SET CORRECT ANSWER)
                </Text>

                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const val = key === 'A' ? optionA : key === 'B' ? optionB : key === 'C' ? optionC : optionD;
                  const setVal = key === 'A' ? setOptionA : key === 'B' ? setOptionB : key === 'C' ? setOptionC : setOptionD;
                  const isCorrect = correctOption === key;

                  return (
                    <View key={key} style={styles.optionRow}>
                      <Pressable
                        onPress={() => setCorrectOption(key)}
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isCorrect ? '#10B981' : colors.cardBorder,
                            backgroundColor: isCorrect ? '#10B98120' : 'transparent',
                          },
                        ]}
                      >
                        <Text style={[TYPOGRAPHY.captionBold, { color: isCorrect ? '#10B981' : colors.textSecondary }]}>
                          {key}
                        </Text>
                      </Pressable>
                      <TextInput
                        value={val}
                        onChangeText={setVal}
                        placeholder={`Option ${key} text`}
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.optionInput,
                          TYPOGRAPHY.body,
                          { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: isCorrect ? '#10B981' : colors.cardBorder },
                        ]}
                      />
                    </View>
                  );
                })}

                {/* Difficulty */}
                <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginTop: 10, marginBottom: 6 }]}>
                  DIFFICULTY LEVEL
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(['easy', 'medium', 'hard'] as const).map((diff) => {
                    const isSel = difficulty === diff;
                    return (
                      <Pressable
                        key={diff}
                        onPress={() => setDifficulty(diff)}
                        style={[
                          styles.examChip,
                          {
                            backgroundColor: isSel ? colors.primary : colors.surfaceVariant,
                            borderColor: isSel ? colors.primary : colors.cardBorder,
                            flex: 1,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            TYPOGRAPHY.captionBold,
                            {
                              color: isSel ? '#FFFFFF' : colors.text,
                              textTransform: 'capitalize',
                            },
                          ]}
                        >
                          {diff}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Explanation */}
                <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginTop: 14, marginBottom: 6 }]}>
                  EXPLANATION / SOLUTION (OPTIONAL)
                </Text>
                <TextInput
                  value={explanation}
                  onChangeText={setExplanation}
                  placeholder="Explain why this option is correct for test review..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  style={[
                    styles.textArea,
                    TYPOGRAPHY.body,
                    { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
                  ]}
                />
              </>
            ) : (
              /* AI & Bulk Questions Tab */
              <View>
                {/* Sub-mode selector */}
                <View style={[styles.subModeRow, { backgroundColor: colors.surfaceVariant }]}>
                  <Pressable
                    onPress={() => setAiSubMode('generate')}
                    style={[
                      styles.subModeBtn,
                      aiSubMode === 'generate' && { backgroundColor: colors.card, elevation: 2 },
                    ]}
                  >
                    <Ionicons name="sparkles" size={14} color={aiSubMode === 'generate' ? '#8B5CF6' : colors.textSecondary} />
                    <Text
                      style={[
                        TYPOGRAPHY.captionBold,
                        { color: aiSubMode === 'generate' ? '#8B5CF6' : colors.textSecondary, marginLeft: 6 },
                      ]}
                    >
                      AI Generator
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setAiSubMode('paste')}
                    style={[
                      styles.subModeBtn,
                      aiSubMode === 'paste' && { backgroundColor: colors.card, elevation: 2 },
                    ]}
                  >
                    <Ionicons name="clipboard-outline" size={14} color={aiSubMode === 'paste' ? colors.primary : colors.textSecondary} />
                    <Text
                      style={[
                        TYPOGRAPHY.captionBold,
                        { color: aiSubMode === 'paste' ? colors.primary : colors.textSecondary, marginLeft: 6 },
                      ]}
                    >
                      Paste Text
                    </Text>
                  </Pressable>
                </View>

                {aiSubMode === 'generate' ? (
                  <>
                    {!isAiEnabled || !geminiApiKey ? (
                      <View style={[styles.aiNoticeBox, { backgroundColor: '#8B5CF612', borderColor: '#8B5CF640' }]}>
                        <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                            Gemini AI Setup Needed
                          </Text>
                          <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary, marginTop: 2 }]}>
                            Enable AI and enter your free Gemini API Key in Settings to generate questions automatically.
                          </Text>
                          <Pressable
                            onPress={() => {
                              onClose();
                              router.push('/(tabs)/settings');
                            }}
                            style={[styles.setupBtn, { backgroundColor: '#8B5CF6' }]}
                          >
                            <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF' }]}>
                              Configure AI in Settings
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}

                    {/* Topic Input */}
                    <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
                      TOPIC OR STUDY NOTES *
                    </Text>
                    <TextInput
                      value={aiTopic}
                      onChangeText={setAiTopic}
                      placeholder="e.g. Computer Networks: Introduction, ARPANET, Evolution, Key Points..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      style={[
                        styles.textArea,
                        TYPOGRAPHY.body,
                        { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
                      ]}
                    />

                    {/* Quick Topic Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                      {[
                        'Computer Networks: ARPANET & Evolution',
                        'Operating Systems: Processes & Scheduling',
                        'Teaching Aptitude & Pedagogy',
                        'Indian Constitution & Polity',
                        'Digital Logic & Boolean Algebra',
                      ].map((t) => (
                        <Pressable
                          key={t}
                          onPress={() => setAiTopic(t)}
                          style={[styles.quickTopicChip, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}
                        >
                          <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>+ {t}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    {/* Question Count Selector */}
                    <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginTop: 8, marginBottom: 6 }]}>
                      NUMBER OF QUESTIONS
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {([5, 10, 15, 20] as const).map((cnt) => (
                        <Pressable
                          key={cnt}
                          onPress={() => setAiCount(cnt)}
                          style={[
                            styles.examChip,
                            {
                              backgroundColor: aiCount === cnt ? '#8B5CF6' : colors.surfaceVariant,
                              borderColor: aiCount === cnt ? '#8B5CF6' : colors.cardBorder,
                              flex: 1,
                              alignItems: 'center',
                            },
                          ]}
                        >
                          <Text style={[TYPOGRAPHY.captionBold, { color: aiCount === cnt ? '#FFFFFF' : colors.text }]}>
                            {cnt} Qs
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Language & Difficulty */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
                          LANGUAGE
                        </Text>
                        {(['bilingual', 'hindi', 'english'] as const).map((lang) => (
                          <Pressable
                            key={lang}
                            onPress={() => setAiLanguage(lang)}
                            style={[
                              styles.smallPill,
                              {
                                backgroundColor: aiLanguage === lang ? `${colors.primary}20` : colors.surfaceVariant,
                                borderColor: aiLanguage === lang ? colors.primary : colors.cardBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                TYPOGRAPHY.tiny,
                                { color: aiLanguage === lang ? colors.primary : colors.textSecondary, fontWeight: '700' },
                              ]}
                            >
                              {lang === 'bilingual' ? 'Bilingual (Eng + Hindi)' : lang === 'hindi' ? 'Hindi Only' : 'English Only'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
                          DIFFICULTY
                        </Text>
                        {(['medium', 'easy', 'hard', 'mixed'] as const).map((diff) => (
                          <Pressable
                            key={diff}
                            onPress={() => setAiDifficulty(diff)}
                            style={[
                              styles.smallPill,
                              {
                                backgroundColor: aiDifficulty === diff ? '#8B5CF620' : colors.surfaceVariant,
                                borderColor: aiDifficulty === diff ? '#8B5CF6' : colors.cardBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                TYPOGRAPHY.tiny,
                                { color: aiDifficulty === diff ? '#8B5CF6' : colors.textSecondary, fontWeight: '700', textTransform: 'capitalize' },
                              ]}
                            >
                              {diff}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* Generate Button */}
                    <Pressable
                      onPress={handleGenerateAi}
                      disabled={isGenerating}
                      style={[
                        styles.generateAiBtn,
                        { backgroundColor: '#8B5CF6', opacity: isGenerating ? 0.7 : 1 },
                      ]}
                    >
                      {isGenerating ? (
                        <>
                          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>
                            Generating {aiCount} Questions with AI...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>
                            Generate {aiCount} Questions with AI
                          </Text>
                        </>
                      )}
                    </Pressable>

                    {/* Generated Questions Preview Deck */}
                    {generatedList.length > 0 && (
                      <View style={styles.previewContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
                          <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                            AI Generated Questions ({selectedIndices.length}/{generatedList.length} Selected)
                          </Text>
                          <Pressable
                            onPress={() => {
                              if (selectedIndices.length === generatedList.length) {
                                setSelectedIndices([]);
                              } else {
                                setSelectedIndices(generatedList.map((_, i) => i));
                              }
                            }}
                          >
                            <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '700' }]}>
                              {selectedIndices.length === generatedList.length ? 'Deselect All' : 'Select All'}
                            </Text>
                          </Pressable>
                        </View>

                        {generatedList.map((item, idx) => {
                          const isSel = selectedIndices.includes(idx);
                          return (
                            <Pressable
                              key={idx}
                              onPress={() => toggleSelectGenerated(idx)}
                              style={[
                                styles.previewCard,
                                {
                                  backgroundColor: colors.card,
                                  borderColor: isSel ? '#8B5CF6' : colors.cardBorder,
                                },
                              ]}
                            >
                              <View style={styles.previewTopRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons
                                    name={isSel ? 'checkbox' : 'square-outline'}
                                    size={20}
                                    color={isSel ? '#8B5CF6' : colors.textMuted}
                                  />
                                  <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary, marginLeft: 8 }]}>
                                    Question {idx + 1}
                                  </Text>
                                </View>
                                <View style={[styles.diffBadge, { backgroundColor: `${colors.primary}18` }]}>
                                  <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '700' }]}>
                                    {item.difficulty}
                                  </Text>
                                </View>
                              </View>

                              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 6 }]}>
                                {item.questionText}
                              </Text>

                              <View style={{ marginTop: 8, gap: 4 }}>
                                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                  const text = opt === 'A' ? item.optionA : opt === 'B' ? item.optionB : opt === 'C' ? item.optionC : item.optionD;
                                  const isCorrect = item.correctOption === opt;
                                  return (
                                    <View
                                      key={opt}
                                      style={[
                                        styles.previewOption,
                                        {
                                          backgroundColor: isCorrect ? '#10B98118' : colors.surfaceVariant,
                                          borderColor: isCorrect ? '#10B981' : 'transparent',
                                        },
                                      ]}
                                    >
                                      <Text style={[TYPOGRAPHY.tiny, { color: isCorrect ? '#10B981' : colors.textSecondary, fontWeight: '700' }]}>
                                        {opt}. {text}
                                      </Text>
                                      {isCorrect && (
                                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                      )}
                                    </View>
                                  );
                                })}
                              </View>

                              {item.explanation ? (
                                <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted, marginTop: 6, fontStyle: 'italic' }]}>
                                  💡 {item.explanation}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </>
                ) : (
                  /* Paste Text Submode */
                  <View>
                    <View style={[styles.aiHelperBox, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF630' }]}>
                      <Ionicons name="clipboard" size={18} color="#8B5CF6" />
                      <Text style={[TYPOGRAPHY.caption, { color: colors.text, flex: 1, marginLeft: 8 }]}>
                        Paste multiple MCQs directly from ChatGPT, Gemini, or syllabus notes. Questions will be parsed and added to your bank!
                      </Text>
                    </View>

                    <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 6 }]}>
                      PASTE QUESTIONS (AI / TEXT FORMAT)
                    </Text>
                    <TextInput
                      value={aiText}
                      onChangeText={setAiText}
                      placeholder={`Example:\n\nQ1. What is the capital of India?\nA. Mumbai\nB. New Delhi\nC. Kolkata\nD. Chennai\nAns: B\nExp: New Delhi has been India's capital since 1911.`}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={8}
                      style={[
                        styles.aiTextArea,
                        TYPOGRAPHY.caption,
                        { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
                      ]}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === 'android' ? 14 : 8),
              },
            ]}
          >
            <Pressable onPress={onClose} style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>

            {activeTab === 'manual' ? (
              <Pressable
                onPress={handleSaveManual}
                style={[styles.btn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Save Question</Text>
              </Pressable>
            ) : aiSubMode === 'generate' && generatedList.length > 0 ? (
              <Pressable
                onPress={handleSaveGenerated}
                style={[styles.btn, { backgroundColor: '#10B981' }]}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>
                  Save {selectedIndices.length} Questions
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleParseAiImport}
                style={[styles.btn, { backgroundColor: '#8B5CF6' }]}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Parse & Import</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '92%',
    paddingTop: 18,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  body: {
    paddingHorizontal: 20,
  },
  subModeRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  subModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  setupBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quickTopicChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  smallPill: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    alignItems: 'center',
  },
  generateAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 10,
    elevation: 3,
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  previewCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  examChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  textArea: {
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  aiTextArea: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  aiHelperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  radioCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
