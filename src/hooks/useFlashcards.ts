// ============================================================
// src/hooks/useFlashcards.ts
// Hook complet de gestion des sessions de flashcards
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';
import { calculateNextReview, getDefaultReview, isDueForReview } from '@/utils/srs';
import { shuffleArray } from '@/utils';
import type { Flashcard, FlashcardReview } from '@/types';
import type { SRSRating } from '@/utils/srs';

const STORAGE_KEY = 'flashcard_reviews';

export interface FlashcardSession {
  cards: Flashcard[];
  dueCount: number;
  newCount: number;
  reviewCount: number;
}

export function useFlashcards(cards: Flashcard[]) {
  const { user, updateUser } = useUserStore();
  const { awardXP } = useGamification();

  const [reviews, setReviews] = useState<Record<string, FlashcardReview>>({});
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [xpEarned, setXpEarned] = useState(0);

  // ── Charger les révisions sauvegardées ───────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) setReviews(JSON.parse(data));
      setIsLoading(false);
    });
  }, []);

  // ── Calculer les stats de session ────────────────────────
  const getSessionStats = useCallback((): FlashcardSession => {
    const dueCards = cards.filter(c => {
      const review = reviews[c.id];
      if (!review) return true; // nouvelle carte
      return isDueForReview(new Date(review.nextReviewDate));
    });

    const newCards = cards.filter(c => !reviews[c.id]);
    const reviewCards = cards.filter(c => {
      const review = reviews[c.id];
      if (!review) return false;
      return isDueForReview(new Date(review.nextReviewDate));
    });

    return {
      cards: shuffleArray(dueCards).slice(0, 20), // max 20 par session
      dueCount: dueCards.length,
      newCount: newCards.length,
      reviewCount: reviewCards.length,
    };
  }, [cards, reviews]);

  // ── Démarrer une session ─────────────────────────────────
  const startSession = useCallback(() => {
    const { cards: due } = getSessionStats();
    setSessionCards(due);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone([]);
    setXpEarned(0);
  }, [getSessionStats]);

  // ── Retourner la carte ───────────────────────────────────
  const flip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // ── Noter la carte (SRS) ─────────────────────────────────
  const rateCard = useCallback(async (rating: SRSRating) => {
    const card = sessionCards[currentIndex];
    if (!card) return;

    const existing = reviews[card.id] ?? getDefaultReview(card.id, user?.id ?? 'local');
    const updated = calculateNextReview(existing, rating);

    const newReview: FlashcardReview = {
      ...existing,
      ...updated,
      lastReviewDate: new Date(),
      totalReviews: (existing.totalReviews ?? 0) + 1,
      correctReviews: rating >= 3
        ? (existing.correctReviews ?? 0) + 1
        : (existing.correctReviews ?? 0),
    };

    const newReviews = { ...reviews, [card.id]: newReview };
    setReviews(newReviews);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newReviews));

    // XP selon la note
    const xp = rating === 5 ? 15 : rating >= 3 ? 10 : 5;
    setXpEarned(prev => prev + xp);
    setSessionDone(prev => [...prev, card.id]);

    // Mettre à jour les mots maîtrisés
    if (rating === 5 && newReview.repetitions >= 3) {
      const mastered = user?.progress.masteredFlashcards ?? [];
      if (!mastered.includes(card.id)) {
        updateUser({
          progress: {
            ...user!.progress,
            masteredFlashcards: [...mastered, card.id],
          },
        });
      }
    }

    // Passer à la carte suivante
    setIsFlipped(false);
    if (currentIndex + 1 >= sessionCards.length) {
      await awardXP(xpEarned + xp, '🃏 Session terminée !');
      return 'completed';
    } else {
      setCurrentIndex(prev => prev + 1);
      return 'next';
    }
  }, [sessionCards, currentIndex, reviews, user, updateUser, awardXP, xpEarned]);

  // ── Obtenir la maîtrise d'une carte ─────────────────────
  const getCardMastery = useCallback((cardId: string): 'new' | 'learning' | 'mastered' => {
    const review = reviews[cardId];
    if (!review) return 'new';
    if (review.repetitions >= 5) return 'mastered';
    return 'learning';
  }, [reviews]);

  const current = sessionCards[currentIndex];
  const isSessionComplete = currentIndex >= sessionCards.length;
  const sessionProgress = sessionCards.length > 0
    ? Math.round((sessionDone.length / sessionCards.length) * 100)
    : 0;

  return {
    reviews,
    sessionCards,
    current,
    currentIndex,
    isFlipped,
    sessionDone,
    xpEarned,
    isLoading,
    isSessionComplete,
    sessionProgress,
    getSessionStats,
    startSession,
    flip,
    rateCard,
    getCardMastery,
    totalCards: cards.length,
    masteredCount: user?.progress.masteredFlashcards.length ?? 0,
  };
}
