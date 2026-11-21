import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { FlashcardModal } from '@/components/study/FlashcardModal';
import * as flashcardRepo from '@/db/flashcardRepo';
import { Flashcard } from '@/types/database';

export default function FlashcardsScreen() {
  const { colors, isDark } = useTheme();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newCardModalVisible, setNewCardModalVisible] = useState(false);

  const loadCards = useCallback(() => {
    const all = flashcardRepo.getAllFlashcards();
    const due = flashcardRepo.getDueFlashcards();
    setCards(all);
    setDueCards(due);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const startReview = () => {
    if (dueCards.length === 0) {
      if (cards.length === 0) {
        Alert.alert('No Cards', 'You have not created any flashcards yet. Highlight text in a PDF to create flashcards!');
        return;
      }
      // Allow reviewing all cards if none are strictly due
      setDueCards([...cards]);
    }
    setCurrentIdx(0);
    setIsFlipped(false);
    setReviewMode(true);
  };

  const handleReviewAnswer = (quality: 0 | 1 | 2 | 3) => {
    const currentCard = dueCards[currentIdx];
    if (!currentCard) return;

    flashcardRepo.reviewFlashcard(currentCard.id, quality);

    if (currentIdx + 1 < dueCards.length) {
      setCurrentIdx((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      Alert.alert('Session Complete! 🎉', 'You have finished all your flashcards for this review session.');
      setReviewMode(false);
      loadCards();
    }
  };

  const handleDeleteCard = (id: number) => {
    Alert.alert('Delete Flashcard', 'Are you sure you want to delete this study flashcard?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          flashcardRepo.deleteFlashcard(id);
          loadCards();
        },
      },
    ]);
  };

  const currentCard = dueCards[currentIdx];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Study Flashcards"
        subtitle={reviewMode ? `Reviewing ${currentIdx + 1} of ${dueCards.length}` : `${cards.length} total • ${dueCards.length} due today`}
        showBack
        rightComponent={
          !reviewMode ? (
            <Pressable
              onPress={() => setNewCardModalVisible(true)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              hitSlop={6}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setReviewMode(false)}
              style={[styles.exitBtn, { borderColor: colors.border }]}
              hitSlop={6}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          )
        }
      />

      {reviewMode && currentCard ? (
        /* Interactive Spaced Repetition Flip Card Review */
        <View style={styles.reviewContainer}>
          <Pressable
            onPress={() => setIsFlipped((prev) => !prev)}
            style={({ pressed }) => [
              styles.cardBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadow,
                shadowOpacity: isDark ? 0.3 : 0.1,
                opacity: pressed ? 0.96 : 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardTag, { backgroundColor: isFlipped ? '#22C55E20' : `${colors.primary}20` }]}>
                <Ionicons
                  name={isFlipped ? 'checkmark-circle-outline' : 'help-circle-outline'}
                  size={14}
                  color={isFlipped ? '#22C55E' : colors.primary}
                />
                <Text
                  style={[
                    TYPOGRAPHY.tiny,
                    { color: isFlipped ? '#22C55E' : colors.primary, marginLeft: 4, fontWeight: '700' },
                  ]}
                >
                  {isFlipped ? 'ANSWER (BACK)' : 'QUESTION (FRONT)'}
                </Text>
              </View>

              <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                Tap card to flip
              </Text>
            </View>

            <View style={styles.cardBody}>
              <Text
                style={[
                  isFlipped ? TYPOGRAPHY.h3 : TYPOGRAPHY.h2,
                  { color: colors.text, textAlign: 'center', lineHeight: isFlipped ? 26 : 30 },
                ]}
              >
                {isFlipped ? currentCard.answer : currentCard.question}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted }]}>
                Repetition: {currentCard.repetitions} • Interval: {currentCard.interval_days} day(s)
              </Text>
              <Ionicons name="swap-horizontal" size={16} color={colors.textMuted} />
            </View>
          </Pressable>

          {/* Review Evaluation Rating Buttons (shown after flip) */}
          {isFlipped ? (
            <View style={styles.ratingRow}>
              <Pressable
                onPress={() => handleReviewAnswer(0)}
                style={[styles.ratingBtn, { backgroundColor: '#EF444418', borderColor: '#EF4444' }]}
              >
                <Text style={[TYPOGRAPHY.captionBold, { color: '#EF4444' }]}>Again</Text>
                <Text style={[TYPOGRAPHY.tiny, { color: '#EF4444' }]}>1d</Text>
              </Pressable>

              <Pressable
                onPress={() => handleReviewAnswer(1)}
                style={[styles.ratingBtn, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B' }]}
              >
                <Text style={[TYPOGRAPHY.captionBold, { color: '#F59E0B' }]}>Hard</Text>
                <Text style={[TYPOGRAPHY.tiny, { color: '#F59E0B' }]}>2d</Text>
              </Pressable>

              <Pressable
                onPress={() => handleReviewAnswer(2)}
                style={[styles.ratingBtn, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary }]}
              >
                <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>Good</Text>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.primary }]}>3d+</Text>
              </Pressable>

              <Pressable
                onPress={() => handleReviewAnswer(3)}
                style={[styles.ratingBtn, { backgroundColor: '#10B98118', borderColor: '#10B981' }]}
              >
                <Text style={[TYPOGRAPHY.captionBold, { color: '#10B981' }]}>Easy</Text>
                <Text style={[TYPOGRAPHY.tiny, { color: '#10B981' }]}>4d+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsFlipped(true)}
              style={[styles.revealBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF', marginLeft: 6 }]}>
                Show Answer
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        /* Deck Hub List View */
        <View style={styles.hubContainer}>
          {/* Quick Review Banner */}
          <View
            style={[
              styles.reviewBanner,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadow,
                shadowOpacity: isDark ? 0.3 : 0.08,
              },
            ]}
          >
            <View style={styles.bannerInfo}>
              <View style={[styles.bannerBadge, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="school" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                  {dueCards.length > 0 ? `${dueCards.length} Cards Due Today` : 'All Caught Up!'}
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Spaced repetition algorithm (SM-2) for maximum memory retention.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={startReview}
              style={[
                styles.startReviewBtn,
                { backgroundColor: dueCards.length > 0 ? colors.primary : colors.surfaceVariant },
              ]}
            >
              <Ionicons
                name="play"
                size={16}
                color={dueCards.length > 0 ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: dueCards.length > 0 ? '#FFFFFF' : colors.text, marginLeft: 6 },
                ]}
              >
                {dueCards.length > 0 ? 'Start Review' : 'Practice All'}
              </Text>
            </Pressable>
          </View>

          {/* Cards List */}
          <View style={styles.listHeaderRow}>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>All Cards ({cards.length})</Text>
          </View>

          <FlatList
            data={cards}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.cardItem,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]} numberOfLines={2}>
                    Q: {item.question}
                  </Text>
                  <Text
                    style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 4 }]}
                    numberOfLines={2}
                  >
                    A: {item.answer}
                  </Text>
                  <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted, marginTop: 6 }]}>
                    Repetitions: {item.repetitions} • Next review: {item.next_review_date ? new Date(item.next_review_date).toLocaleDateString() : 'Today'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleDeleteCard(item.id)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyBox}>
                <Ionicons name="albums-outline" size={48} color={colors.textMuted} />
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 12 }]}>
                  No Flashcards Yet
                </Text>
                <Text
                  style={[
                    TYPOGRAPHY.caption,
                    { color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
                  ]}
                >
                  Highlight key definitions, formulas, or summaries in any PDF and tap the Flashcard icon to save them here.
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Manual New Flashcard Modal */}
      <FlashcardModal
        visible={newCardModalVisible}
        onClose={() => setNewCardModalVisible(false)}
        onCreated={loadCards}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hubContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reviewBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    marginTop: 14,
  },
  listHeaderRow: {
    marginTop: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  reviewContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  cardBox: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    maxHeight: 460,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000015',
    paddingTop: 12,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    marginTop: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  ratingBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});