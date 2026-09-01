// ============================================================
// src/utils/srs.ts
// Algorithme SM-2 — Répétition Espacée
// ============================================================

import type { FlashcardReview } from '@/types';

export type SRSRating = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = Raté complètement   1 = Raté mais reconnu
// 2 = Raté mais facile    3 = Correct avec effort
// 4 = Correct facilement  5 = Parfait

export function calculateNextReview(
  review: Pick<FlashcardReview, 'easinessFactor' | 'interval' | 'repetitions'>,
  rating: SRSRating
): Pick<FlashcardReview, 'easinessFactor' | 'interval' | 'repetitions' | 'nextReviewDate'> {
  let { easinessFactor, interval, repetitions } = review;

  if (rating >= 3) {
    // Réponse correcte
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  } else {
    // Réponse incorrecte — recommencer
    repetitions = 0;
    interval = 1;
  }

  // Mise à jour du facteur de facilité
  easinessFactor = Math.max(
    1.3,
    easinessFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return { easinessFactor, interval, repetitions, nextReviewDate };
}

export function isDueForReview(nextReviewDate: Date): boolean {
  return new Date() >= new Date(nextReviewDate);
}

export function getDefaultReview(flashcardId: string, userId: string): FlashcardReview {
  return {
    flashcardId,
    userId,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    lastReviewDate: new Date(),
    totalReviews: 0,
    correctReviews: 0,
  };
}
