// ============================================================
// src/hooks/useWeeklyReview.ts
// Bilan hebdomadaire — stats, recommandations, rappels
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';

const STORAGE_KEY_WEEKLY = 'weekly_review_data';
const STORAGE_KEY_LAST_REVIEW = 'last_weekly_review';

// ── Types ────────────────────────────────────────────────────
export interface WeeklyData {
  weekStart: string;           // 'YYYY-MM-DD'
  xpTotal: number;
  lessonsCompleted: number;
  minutesSpent: number;
  streakDays: number;
  flashcardsReviewed: number;
  quizzesCompleted: number;
  bestStreak: number;
  dailyXP: number[];           // XP par jour (7 valeurs)
}

export interface WeeklyRecommendation {
  type: 'lesson' | 'flashcard' | 'quiz' | 'streak' | 'premium';
  emoji: string;
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
}

// ── Hook principal ───────────────────────────────────────────
export function useWeeklyReview() {
  const { user } = useUserStore();
  const { getDailyProgress } = useGamification();
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [recommendations, setRecommendations] = useState<WeeklyRecommendation[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── Charger les données de la semaine ────────────────────
  const loadWeeklyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_WEEKLY);
      if (stored) {
        const data = JSON.parse(stored) as WeeklyData;
        setWeeklyData(data);
        setRecommendations(generateRecommendations(data, user));
      } else {
        // Données initiales
        const initial = createEmptyWeeklyData();
        setWeeklyData(initial);
        setRecommendations(generateRecommendations(initial, user));
      }
    } catch (e) {
      console.error('Erreur chargement bilan hebdo:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ── Mettre à jour les données du jour ────────────────────
  const updateTodayData = useCallback(async (updates: {
    xpGained?: number;
    lessonCompleted?: boolean;
    minutesSpent?: number;
    flashcardsReviewed?: number;
    quizCompleted?: boolean;
  }) => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_WEEKLY);
    let data: WeeklyData = stored ? JSON.parse(stored) : createEmptyWeeklyData();

    const todayIdx = new Date().getDay();
    const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1; // Lundi = 0

    if (updates.xpGained) {
      data.xpTotal += updates.xpGained;
      data.dailyXP[adjustedIdx] = (data.dailyXP[adjustedIdx] ?? 0) + updates.xpGained;
    }
    if (updates.lessonCompleted) data.lessonsCompleted += 1;
    if (updates.minutesSpent) data.minutesSpent += updates.minutesSpent;
    if (updates.flashcardsReviewed) data.flashcardsReviewed += updates.flashcardsReviewed;
    if (updates.quizCompleted) data.quizzesCompleted += 1;

    data.streakDays = user?.streak ?? 0;
    data.bestStreak = Math.max(data.bestStreak, data.streakDays);

    await AsyncStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(data));
    setWeeklyData(data);
  }, [user]);

  // ── Vérifier si un bilan doit être affiché ───────────────
  const checkForWeeklyReview = useCallback(async () => {
    const lastReview = await AsyncStorage.getItem(STORAGE_KEY_LAST_REVIEW);
    if (!lastReview) return false;

    const lastDate = new Date(lastReview);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Afficher le bilan le lundi si la dernière vue date de > 6 jours
    const isMonday = now.getDay() === 1;
    if (isMonday && daysDiff >= 6) {
      setShowReviewModal(true);
      return true;
    }
    return false;
  }, []);

  // ── Fermer le bilan et réinitialiser ────────────────────
  const dismissReview = useCallback(async () => {
    setShowReviewModal(false);
    await AsyncStorage.setItem(STORAGE_KEY_LAST_REVIEW, new Date().toISOString());
    // Réinitialiser les données pour la nouvelle semaine
    const fresh = createEmptyWeeklyData();
    await AsyncStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(fresh));
    setWeeklyData(fresh);
  }, []);

  useEffect(() => {
    loadWeeklyData();
    checkForWeeklyReview();
  }, []);

  return {
    weeklyData,
    recommendations,
    showReviewModal,
    isLoading,
    updateTodayData,
    dismissReview,
    loadWeeklyData,
  };
}

// ── Créer des données vides ──────────────────────────────────
function createEmptyWeeklyData(): WeeklyData {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  return {
    weekStart: monday.toISOString().split('T')[0],
    xpTotal: 0,
    lessonsCompleted: 0,
    minutesSpent: 0,
    streakDays: 0,
    flashcardsReviewed: 0,
    quizzesCompleted: 0,
    bestStreak: 0,
    dailyXP: [0, 0, 0, 0, 0, 0, 0],
  };
}

// ── Générer les recommandations ──────────────────────────────
function generateRecommendations(
  data: WeeklyData,
  user: any,
): WeeklyRecommendation[] {
  const recs: WeeklyRecommendation[] = [];

  // Recommandation streak
  if ((user?.streak ?? 0) === 0) {
    recs.push({
      type: 'streak',
      emoji: '🔥',
      title: 'Recommencez votre série !',
      description: 'Faites une leçon aujourd\'hui pour démarrer une nouvelle série.',
      action: 'Faire une leçon',
      actionRoute: '/(tabs)/learn',
    });
  } else if ((user?.streak ?? 0) < 7) {
    recs.push({
      type: 'streak',
      emoji: '🔥',
      title: `Encore ${7 - (user?.streak ?? 0)} jours pour 1 semaine !`,
      description: 'Maintenez votre série quotidienne pour débloquer un badge.',
      action: 'Continuer',
      actionRoute: '/(tabs)/learn',
    });
  }

  // Recommandation leçons
  if (data.lessonsCompleted < 3) {
    recs.push({
      type: 'lesson',
      emoji: '📚',
      title: 'Augmentez votre rythme',
      description: 'Essayez de faire 3 leçons par semaine pour progresser rapidement.',
      action: 'Voir les leçons',
      actionRoute: '/(tabs)/learn',
    });
  }

  // Recommandation flashcards
  if (data.flashcardsReviewed < 20) {
    recs.push({
      type: 'flashcard',
      emoji: '🃏',
      title: 'Révisez votre vocabulaire',
      description: 'La répétition espacée ancre les mots dans la mémoire long terme.',
      action: 'Réviser maintenant',
      actionRoute: '/(tabs)/review',
    });
  }

  // Recommandation quiz
  if (data.quizzesCompleted === 0) {
    recs.push({
      type: 'quiz',
      emoji: '🎯',
      title: 'Testez vos connaissances',
      description: 'Un quiz rapide consolide ce que vous avez appris cette semaine.',
      action: 'Faire un quiz',
      actionRoute: '/(tabs)/learn',
    });
  }

  // Recommandation Premium
  if (!user?.premium && data.lessonsCompleted >= 3) {
    recs.push({
      type: 'premium',
      emoji: '⭐',
      title: 'Débloquez Premium',
      description: 'Accédez aux dictées, dialogues et à l\'IA conversationnelle.',
      action: 'Essayer 7 jours',
      actionRoute: '/(tabs)/premium',
    });
  }

  return recs.slice(0, 3);
}
