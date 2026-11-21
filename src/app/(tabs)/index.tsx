import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryCard } from '@/components/category/CategoryCard';
import { PdfCard } from '@/components/pdf/PdfCard';
import { CategoryModal } from '@/components/category/CategoryModal';
import { ExamModal } from '@/components/category/ExamModal';
import { PdfEditModal } from '@/components/pdf/PdfEditModal';
import { PdfMoveModal } from '@/components/pdf/PdfMoveModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { StudyTrackerCard } from '@/components/study/StudyTrackerCard';
import { AssessmentView } from '@/components/assessment/AssessmentView';
import { pickPdfDocuments } from '@/services/pdfPicker';
import { Category, PdfDocument, Exam } from '@/types/database';
import * as flashcardRepo from '@/db/flashcardRepo';
import * as studyTimerRepo from '@/db/studyTimerRepo';

export default function HomeScreen() {
  const { colors, isDark, setMode } = useTheme();
  const {
    exams,
    selectedExamId,
    setSelectedExamId,
    addExam,
    editExam,
    removeExam,
    categories,
    pdfs,
    recentPdfs,
    favoritePdfs,
    storageStats,
    loadAll,
    importPdfFiles,
    addSampleStudyGuide,
    addCategory,
    editCategory,
    removeCategory,
    renamePdf,
    movePdf,
    toggleFavorite,
    togglePdfCompleted,
    deletePdfToBin,
  } = useAppStore();

  const [activeTopTab, setActiveTopTab] = useState<'study' | 'assessment'>('study');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modals state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [editingPdf, setEditingPdf] = useState<PdfDocument | null>(null);
  const [movingPdf, setMovingPdf] = useState<PdfDocument | null>(null);
  const [deletingPdf, setDeletingPdf] = useState<PdfDocument | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [dueCardsCount, setDueCardsCount] = useState(0);

  const [studySummary, setStudySummary] = useState({
    todayMinutes: 0,
    totalHours: 0,
    streakDays: 0,
    totalPagesRead: 0,
  });

  const loadStudyStats = () => {
    try {
      const due = flashcardRepo.getDueFlashcards();
      setDueCardsCount(due.length);
      const summary = studyTimerRepo.getStudyTrackingSummary();
      setStudySummary(summary);
    } catch {
      // Ignore initial stats load errors
    }
  };

  useEffect(() => {
    loadAll();
    loadStudyStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    loadStudyStats();
    setRefreshing(false);
  };

  const handleUploadPdf = () => {
    Alert.alert(
      'Add PDF to StudyVault',
      'Choose how you want to add documents:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add Sample Study Guide',
          onPress: async () => {
            try {
              const doc = await addSampleStudyGuide();
              Alert.alert('Document Added', `"${doc.title}" has been added to your study library!`);
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to add sample study guide.');
            }
          },
        },
        {
          text: 'Select PDF from Device',
          onPress: async () => {
            try {
              const files = await pickPdfDocuments();
              if (files && files.length > 0) {
                const { importedCount, duplicateCount, errors } = await importPdfFiles(files);
                if (importedCount > 0) {
                  Alert.alert(
                    'Success',
                    `Successfully added ${importedCount} document(s) to StudyVault.` +
                      (duplicateCount > 0 ? ` (${duplicateCount} duplicate notice)` : '')
                  );
                } else if (errors.length > 0) {
                  Alert.alert('Import Failed', errors.join('\n'));
                }
              }
            } catch (err: any) {
              Alert.alert('Upload Error', err?.message || 'Failed to import PDF.');
            }
          },
        },
      ]
    );
  };

  // Toggle theme mode
  const handleToggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Continue reading item (the most recently opened PDF with page > 1)
  const continueReadingPdf = pdfs.find((p) => p.last_read_page > 1) || recentPdfs[0];

  // Filtered PDFs when search is typed
  const searchResults = search.trim()
    ? pdfs.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.original_filename.toLowerCase().includes(search.toLowerCase()) ||
          (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Bar Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.branding}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="library" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>StudyVault</Text>
            <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
              Offline Study Notes & PDFs
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable
            onPress={handleToggleTheme}
            style={({ pressed }) => [
              styles.actionIconButton,
              { backgroundColor: pressed ? colors.surfaceVariant : colors.card, borderColor: colors.border },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? '#FBBF24' : colors.primary}
            />
          </Pressable>

          <Pressable
            onPress={handleUploadPdf}
            style={({ pressed }) => [
              styles.uploadButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF', marginLeft: 4 }]}>
              Upload PDF
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Top Dual Tab Switcher: Study Material vs Assessment */}
      <View style={[styles.dualTabBar, { backgroundColor: colors.surfaceVariant }]}>
        <Pressable
          onPress={() => setActiveTopTab('study')}
          style={[
            styles.dualTabBtn,
            activeTopTab === 'study' && [
              styles.dualTabBtnActive,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ],
          ]}
        >
          <Ionicons
            name="book"
            size={16}
            color={activeTopTab === 'study' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              TYPOGRAPHY.captionBold,
              {
                color: activeTopTab === 'study' ? colors.primary : colors.textSecondary,
                marginLeft: 6,
              },
            ]}
          >
            Study Material
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTopTab('assessment')}
          style={[
            styles.dualTabBtn,
            activeTopTab === 'assessment' && [
              styles.dualTabBtnActive,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ],
          ]}
        >
          <Ionicons
            name="school"
            size={16}
            color={activeTopTab === 'assessment' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              TYPOGRAPHY.captionBold,
              {
                color: activeTopTab === 'assessment' ? colors.primary : colors.textSecondary,
                marginLeft: 6,
              },
            ]}
          >
            Assessment
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTopTab === 'assessment' ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <AssessmentView
              exams={exams}
              selectedExamId={selectedExamId}
              onSelectExam={setSelectedExamId}
              onOpenExamModal={() => {
                setEditingExam(null);
                setExamModalVisible(true);
              }}
            />
          </View>
        ) : (
          <>
            {/* Target Exam Filter Pills */}
            <View style={styles.examFilterSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.examPillsContainer}
              >
                <Pressable
                  onPress={() => setSelectedExamId(null)}
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
                      onPress={() => setSelectedExamId(ex.id)}
                      onLongPress={() => {
                        setEditingExam(ex);
                        setExamModalVisible(true);
                      }}
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
                  onPress={() => {
                    setEditingExam(null);
                    setExamModalVisible(true);
                  }}
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

            {/* Daily Study Progress & Streak Tracking Card */}
            <View style={{ paddingHorizontal: 16 }}>
              <StudyTrackerCard
                todayMinutes={studySummary.todayMinutes}
                streakDays={studySummary.streakDays}
                totalPagesRead={studySummary.totalPagesRead}
                completedPdfsCount={pdfs.filter((p) => p.is_completed === 1).length}
                onOpenTimer={() => usePomodoroStore.getState().setModalVisible(true)}
              />
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search notes, subjects, PDFs..."
              />
            </View>

        {/* If Search is Active */}
        {search.trim().length > 0 ? (
          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginBottom: 12 }]}>
              Search Results ({searchResults.length})
            </Text>
            {searchResults.length === 0 ? (
              <Text style={[TYPOGRAPHY.body, { color: colors.textMuted, textAlign: 'center', marginVertical: 24 }]}>
                No documents found matching "{search}"
              </Text>
            ) : (
              searchResults.map((pdf) => (
                <PdfCard
                  key={pdf.id}
                  pdf={pdf}
                  onToggleFavorite={toggleFavorite}
                  onToggleCompleted={togglePdfCompleted}
                  onRename={setEditingPdf}
                  onMove={setMovingPdf}
                  onDelete={setDeletingPdf}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* Dashboard Metric Stats Cards */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={[styles.statIconBadge, { backgroundColor: `${colors.primary}18` }]}>
                  <Ionicons name="folder" size={18} color={colors.primary} />
                </View>
                <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginTop: 8 }]}>
                  {storageStats?.categoriesCount ?? categories.length}
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Categories
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={[styles.statIconBadge, { backgroundColor: '#0D948818' }]}>
                  <Ionicons name="git-branch" size={18} color="#0D9488" />
                </View>
                <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginTop: 8 }]}>
                  {storageStats?.subcategoriesCount ?? 0}
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Subcategories
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={[styles.statIconBadge, { backgroundColor: '#D9770618' }]}>
                  <Ionicons name="document-text" size={18} color="#D97706" />
                </View>
                <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginTop: 8 }]}>
                  {storageStats?.pdfCount ?? pdfs.length}
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>PDF Notes</Text>
              </View>
            </View>

            {/* Student Study Hub: Flashcards & Focus Pomodoro Timer */}
            <View style={styles.studyHubRow}>
              <Pressable
                onPress={() => router.push('/flashcards')}
                style={({ pressed }) => [
                  styles.studyHubCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={[styles.studyHubIcon, { backgroundColor: `${colors.primary}18` }]}>
                  <Ionicons name="albums" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Flashcards</Text>
                  <Text
                    style={[
                      TYPOGRAPHY.tiny,
                      { color: dueCardsCount > 0 ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {dueCardsCount > 0 ? `${dueCardsCount} due today` : 'Review deck'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={() => usePomodoroStore.getState().setModalVisible(true)}
                style={({ pressed }) => [
                  styles.studyHubCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={[styles.studyHubIcon, { backgroundColor: '#EF444418' }]}>
                  <Ionicons name="timer" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Focus Timer</Text>
                  <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>
                    {studySummary.todayMinutes > 0 ? `${studySummary.todayMinutes}m today` : 'Focus session'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Continue Reading Section */}
            {continueReadingPdf && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Continue Reading</Text>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/reader/[id]',
                        params: { id: String(continueReadingPdf.id) },
                      })
                    }
                  >
                    <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>Resume</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/reader/[id]',
                      params: { id: String(continueReadingPdf.id) },
                    })
                  }
                  style={({ pressed }) => [
                    styles.continueCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={styles.continueHeader}>
                    <View
                      style={[
                        styles.continueIcon,
                        {
                          backgroundColor: `${
                            continueReadingPdf.category_color || colors.primary
                          }20`,
                        },
                      ]}
                    >
                      <Ionicons
                        name="book"
                        size={22}
                        color={continueReadingPdf.category_color || colors.primary}
                      />
                    </View>
                    <View style={styles.continueTitleArea}>
                      <Text
                        style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {continueReadingPdf.title}
                      </Text>
                      <Text
                        style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {continueReadingPdf.category_name || 'Study Document'}
                      </Text>
                    </View>
                    <View style={[styles.continueButton, { backgroundColor: colors.primary }]}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                  </View>

                  {continueReadingPdf.page_count > 0 && (
                    <View style={styles.continueProgress}>
                      <View style={[styles.continueTrack, { backgroundColor: colors.surfaceVariant }]}>
                        <View
                          style={[
                            styles.continueFill,
                            {
                              backgroundColor: continueReadingPdf.category_color || colors.primary,
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (continueReadingPdf.last_read_page /
                                    continueReadingPdf.page_count) *
                                    100
                                )
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.progressTextRow}>
                        <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                          Page {continueReadingPdf.last_read_page} of{' '}
                          {continueReadingPdf.page_count}
                        </Text>
                        <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '700' }]}>
                          {Math.min(
                            100,
                            Math.round(
                              (continueReadingPdf.last_read_page /
                                continueReadingPdf.page_count) *
                                100
                            )
                          )}
                          %
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>
            )}

            {/* Categories Overview */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Study Categories</Text>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => {
                      setEditingCategory(null);
                      setCategoryModalVisible(true);
                    }}
                    style={styles.textAction}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>New</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/(tabs)/categories')}
                    style={styles.textAction}
                  >
                    <Text
                      style={[
                        TYPOGRAPHY.captionBold,
                        { color: colors.textSecondary, marginLeft: 8 },
                      ]}
                    >
                      View All
                    </Text>
                  </Pressable>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {(selectedExamId ? categories.filter((c) => c.exam_id === selectedExamId) : categories).map((cat) => (
                  <View key={cat.id} style={{ width: 180, marginRight: 12 }}>
                    <CategoryCard
                      category={cat}
                      layout="grid"
                      onEdit={(c) => {
                        setEditingCategory(c);
                        setCategoryModalVisible(true);
                      }}
                      onDelete={setDeletingCategory}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Recently Opened PDFs */}
            {recentPdfs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Recently Opened</Text>
                  <Pressable onPress={() => router.push('/(tabs)/recent')}>
                    <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>
                      History
                    </Text>
                  </Pressable>
                </View>
                {recentPdfs.slice(0, 4).map((pdf) => (
                  <PdfCard
                    key={pdf.id}
                    pdf={pdf}
                    onToggleFavorite={toggleFavorite}
                    onToggleCompleted={togglePdfCompleted}
                    onRename={setEditingPdf}
                    onMove={setMovingPdf}
                    onDelete={setDeletingPdf}
                  />
                ))}
              </View>
            )}

            {/* Favorite PDFs Section */}
            {favoritePdfs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Favorites</Text>
                  <Pressable onPress={() => router.push('/(tabs)/favorites')}>
                    <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>
                      All ({favoritePdfs.length})
                    </Text>
                  </Pressable>
                </View>
                {favoritePdfs.slice(0, 3).map((pdf) => (
                  <PdfCard
                    key={pdf.id}
                    pdf={pdf}
                    onToggleFavorite={toggleFavorite}
                    onToggleCompleted={togglePdfCompleted}
                    onRename={setEditingPdf}
                    onMove={setMovingPdf}
                    onDelete={setDeletingPdf}
                  />
                ))}
              </View>
            )}

            {/* All / Recently Added PDFs */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>All Documents</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted }]}>
                  {pdfs.length} items
                </Text>
              </View>

              {pdfs.length === 0 ? (
                <View
                  style={[
                    styles.emptyNotice,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 8 }]}>
                    No PDFs uploaded yet
                  </Text>
                  <Text
                    style={[
                      TYPOGRAPHY.caption,
                      { color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
                    ]}
                  >
                    Import textbooks, lecture slides and research papers to start annotating offline.
                  </Text>
                  <View style={styles.emptyButtonRow}>
                    <Pressable
                      onPress={handleUploadPdf}
                      style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF' }]}>
                        Add Study PDF
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={async () => {
                        try {
                          const doc = await addSampleStudyGuide();
                          Alert.alert('Document Added', `"${doc.title}" has been added!`);
                        } catch (e: any) {
                          Alert.alert('Error', e?.message || 'Failed to add sample PDF.');
                        }
                      }}
                      style={[
                        styles.emptyBtn,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text style={[TYPOGRAPHY.captionBold, { color: colors.text }]}>
                        Load Sample Notes
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                pdfs.slice(0, 8).map((pdf) => (
                  <PdfCard
                    key={pdf.id}
                    pdf={pdf}
                    onToggleFavorite={toggleFavorite}
                    onToggleCompleted={togglePdfCompleted}
                    onRename={setEditingPdf}
                    onMove={setMovingPdf}
                    onDelete={setDeletingPdf}
                  />
                ))
              )}
            </View>
          </>
        )}
          </>
        )}
      </ScrollView>

      {/* Target Exam Create/Edit Modal */}
      <ExamModal
        visible={examModalVisible}
        exam={editingExam}
        onSave={(name, code, desc, icon, col) => {
          if (editingExam) {
            editExam(editingExam.id, name, code, desc, icon, col);
          } else {
            addExam(name, code, desc, icon, col);
          }
        }}
        onDelete={(id) => removeExam(id)}
        onClose={() => {
          setExamModalVisible(false);
          setEditingExam(null);
        }}
      />

      {/* Category Create/Edit Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        category={editingCategory}
        exams={exams}
        initialExamId={selectedExamId}
        onSave={(name, desc, icon, col, exId) => {
          if (editingCategory) {
            editCategory(editingCategory.id, name, desc, icon, col, exId);
          } else {
            addCategory(name, desc, icon, col, exId);
          }
        }}
        onClose={() => {
          setCategoryModalVisible(false);
          setEditingCategory(null);
        }}
      />

      {/* PDF Rename Modal */}
      <PdfEditModal
        visible={!!editingPdf}
        pdf={editingPdf}
        onSave={(id, title) => renamePdf(id, title)}
        onClose={() => setEditingPdf(null)}
      />

      {/* PDF Move Modal */}
      <PdfMoveModal
        visible={!!movingPdf}
        pdf={movingPdf}
        onSave={(id, catId, subId) => movePdf(id, catId, subId)}
        onClose={() => setMovingPdf(null)}
      />

      {/* PDF Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!deletingPdf}
        title="Move to Recycle Bin?"
        message={`"${deletingPdf?.title}" will be moved to the recycle bin. You can restore it anytime.`}
        confirmText="Move to Bin"
        isDestructive
        onConfirm={() => {
          if (deletingPdf) {
            deletePdfToBin(deletingPdf.id);
            setDeletingPdf(null);
          }
        }}
        onCancel={() => setDeletingPdf(null)}
      />

      {/* Category Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!deletingCategory}
        title="Delete Category?"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? Its subcategories will also be deleted, and PDFs in this category will be unfiled.`}
        confirmText="Delete Category"
        isDestructive
        onConfirm={() => {
          if (deletingCategory) {
            removeCategory(deletingCategory.id);
            setDeletingCategory(null);
          }
        }}
        onCancel={() => setDeletingCategory(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
  },
  dualTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    padding: 3,
  },
  dualTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
  },
  dualTabBtnActive: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  examFilterSection: {
    paddingTop: 6,
    marginBottom: 8,
  },
  examPillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  examPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  addExamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  continueCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  continueTitleArea: {
    flex: 1,
  },
  continueButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueProgress: {
    marginTop: 12,
  },
  continueTrack: {
    height: 5,
    borderRadius: 2.5,
    width: '100%',
    overflow: 'hidden',
  },
  continueFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  emptyNotice: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  studyHubRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  studyHubCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  studyHubIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
