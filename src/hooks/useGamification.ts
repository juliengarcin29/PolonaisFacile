// ============================================================
// src/hooks/useGamification.ts
// Hook central — XP, niveaux, streak, badges, objectif quotidien
// ============================================================

import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { GAMIFICATION } from '@/constants';
import type { Achievement } from '@/types';

const STORAGE_KEYS = {
  DAILY_XP: 'daily_xp',
  DAILY_DATE: 'daily_date',
  LAST_ACTIVITY: 'last_activity',
};

// ── Tous les badges disponibles ──────────────────────────────
export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'Premier pas',
    description: 'Terminez votre première leçon',
    icon: '🎯',
    xpReward: 50,
    rarity: 'common',
    condition: { type: 'lessons', value: 1 },
  },
  {
    id: 'streak_3',
    title: '3 jours de suite',
    description: 'Maintenez une série de 3 jours',
    icon: '🔥',
    xpReward: 75,
    rarity: 'common',
    condition: { type: 'streak', value: 3 },
  },
  {
    id: 'streak_7',
    title: 'Une semaine !',
    description: 'Maintenez une série de 7 jours',
    icon: '🗓️',
    xpReward: 150,
    rarity: 'rare',
    condition: { type: 'streak', value: 7 },
  },
  {
    id: 'streak_30',
    title: 'Un mois !',
    description: 'Maintenez une série de 30 jours',
    icon: '🏅',
    xpReward: 500,
    rarity: 'epic',
    condition: { type: 'streak', value: 30 },
  },
  {
    id: 'xp_100',
    title: 'Démarrage',
    description: 'Gagnez 100 XP',
    icon: '⚡',
    xpReward: 25,
    rarity: 'common',
    condition: { type: 'xp', value: 100 },
  },
  {
    id: 'xp_500',
    title: 'Assidu',
    description: 'Gagnez 500 XP',
    icon: '💪',
    xpReward: 75,
    rarity: 'rare',
    condition: { type: 'xp', value: 500 },
  },
  {
    id: 'xp_1000',
    title: 'Expert',
    description: 'Gagnez 1 000 XP',
    icon: '🧠',
    xpReward: 150,
    rarity: 'epic',
    condition: { type: 'xp', value: 1000 },
  },
  {
    id: 'xp_5000',
    title: 'Maître',
    description: 'Gagnez 5 000 XP',
    icon: '👑',
    xpReward: 500,
    rarity: 'legendary',
    condition: { type: 'xp', value: 5000 },
  },
  {
    id: 'lessons_5',
    title: 'Studieux',
    description: 'Terminez 5 leçons',
    icon: '📚',
    xpReward: 100,
    rarity: 'common',
    condition: { type: 'lessons', value: 5 },
  },
  {
    id: 'lessons_25',
    title: 'Dévoué',
    description: 'Terminez 25 leçons',
    icon: '🎓',
    xpReward: 300,
    rarity: 'rare',
    condition: { type: 'lessons', value: 25 },
  },
  {
    id: 'flashcards_50',
    title: 'Vocabulaire',
    description: 'Maîtrisez 50 flashcards',
    icon: '🃏',
    xpReward: 200,
    rarity: 'rare',
    condition: { type: 'flashcards', value: 50 },
  },
  {
    id: 'quiz_perfect',
    title: 'Parfait !',
    description: 'Obtenez 100% à un quiz',
    icon: '🏆',
    xpReward: 250,
    rarity: 'epic',
    condition: { type: 'quiz_score', value: 100 },
  },
];

// ── Hook principal ───────────────────────────────────────────
export function useGamification() {
  const { user, addXP, updateUser, updateStreak } = useUserStore();

  // ── Vérifier et mettre à jour le streak ──────────────────
  const checkAndUpdateStreak = useCallback(async () => {
    if (!user) return;

    const today = new Date().toDateString();
    const lastActivity = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);

    if (lastActivity === today) return; // déjà mis à jour aujourd'hui

    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    let newStreak = user.streak;

    if (lastActivity === yesterday) {
      newStreak = user.streak + 1;
    } else if (lastActivity !== today) {
      newStreak = 1; // série cassée
    }

    const longestStreak = Math.max(newStreak, user.longestStreak);
    updateUser({ streak: newStreak, longestStreak, lastLoginAt: new Date() });
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, today);

    // Bonus XP pour les jalons de streak
    if (newStreak % 7 === 0) {
      await awardXP(newStreak * 10, `🔥 ${newStreak} jours de suite !`);
    }

    // Vérifier badges streak
    await checkAchievements({ streak: newStreak });
  }, [user]);

  // ── Enregistrer l'activité quotidienne ──────────────────
  const recordDailyActivity = useCallback(async (minutesSpent: number) => {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_DATE);
    const storedXP = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_XP);

    if (storedDate !== today) {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_DATE, today);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_XP, String(minutesSpent));
    } else {
      const totalMin = (parseInt(storedXP ?? '0') + minutesSpent);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_XP, String(totalMin));

      // Objectif quotidien atteint ?
      if (totalMin >= (user?.dailyGoal ?? 10) && parseInt(storedXP ?? '0') < (user?.dailyGoal ?? 10)) {
        await awardXP(50, '🎯 Objectif du jour atteint !');
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, today);
  }, [user]);

  // ── Octroyer des XP ──────────────────────────────────────
  const awardXP = useCallback(async (amount: number, reason?: string) => {
    if (!user) return { newTotal: 0, leveledUp: false };

    const oldLevel = user.level;
    addXP(amount);
    const newTotal = user.xp + amount;

    // Vérifier un level up
    const newLevel = calculateLevel(newTotal);
    const leveledUp = newLevel > oldLevel;

    // Vérifier badges XP
    await checkAchievements({ xp: newTotal });

    return { newTotal, leveledUp, newLevel, reason };
  }, [user, addXP]);

  // ── Terminer une leçon ───────────────────────────────────
  const completeLesson = useCallback(async (
    lessonId: string,
    score: number,
    total: number,
    timeSpentSeconds: number,
  ) => {
    if (!user) return;
    if (user.progress.completedLessons.includes(lessonId)) return;

    const isPerfect = score === total;
    const baseXP = GAMIFICATION.XP_PER_LESSON;
    const bonusXP = isPerfect ? GAMIFICATION.XP_PER_PERFECT : 0;
    const totalXP = baseXP + bonusXP;

    const updatedProgress = {
      ...user.progress,
      completedLessons: [...user.progress.completedLessons, lessonId],
      totalLessonsCompleted: user.progress.totalLessonsCompleted + 1,
      totalTimeSpent: user.progress.totalTimeSpent + timeSpentSeconds,
    };

    updateUser({ progress: updatedProgress });
    await awardXP(totalXP, isPerfect ? '🏆 Leçon parfaite !' : '📚 Leçon terminée !');
    await recordDailyActivity(Math.round(timeSpentSeconds / 60));
    await checkAchievements({
      lessons: updatedProgress.totalLessonsCompleted,
      xp: user.xp + totalXP,
    });

    return { xpEarned: totalXP, isPerfect };
  }, [user]);

  // ── Terminer un quiz ─────────────────────────────────────
  const completeQuiz = useCallback(async (
    quizId: string,
    score: number,
    total: number,
    timeSpentSeconds: number,
  ) => {
    if (!user) return;

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70; // score de passage par défaut
    const xpReward = Math.round((score / total) * 100); // XP proportionnels au score

    if (passed) {
      const updatedProgress = {
        ...user.progress,
        completedQuizzes: [...new Set([...user.progress.completedQuizzes, quizId])],
        totalTimeSpent: user.progress.totalTimeSpent + timeSpentSeconds,
      };
      updateUser({ progress: updatedProgress });
    }

    await awardXP(xpReward, passed ? '🎯 Quiz réussi !' : '🎯 Quiz terminé');
    await recordDailyActivity(Math.round(timeSpentSeconds / 60));

    if (percentage === 100) {
      await checkAchievements({ quizScore: 100 });
    }

    return { xpEarned: xpReward, passed };
  }, [user]);

  // ── Vérifier et débloquer les badges ────────────────────
  const checkAchievements = useCallback(async (params: {
    streak?: number;
    xp?: number;
    lessons?: number;
    flashcards?: number;
    quizScore?: number;
  }) => {
    if (!user) return [];

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ALL_ACHIEVEMENTS) {
      if (user.achievements.includes(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.condition.type) {
        case 'streak':
          unlocked = (params.streak ?? user.streak) >= achievement.condition.value;
          break;
        case 'xp':
          unlocked = (params.xp ?? user.xp) >= achievement.condition.value;
          break;
        case 'lessons':
          unlocked = (params.lessons ?? user.progress.totalLessonsCompleted) >= achievement.condition.value;
          break;
        case 'flashcards':
          unlocked = (params.flashcards ?? user.progress.masteredFlashcards.length) >= achievement.condition.value;
          break;
        case 'quiz_score':
          unlocked = (params.quizScore ?? 0) >= achievement.condition.value;
          break;
      }

      if (unlocked) {
        newlyUnlocked.push(achievement);
        updateUser({
          achievements: [...user.achievements, achievement.id],
        });
        addXP(achievement.xpReward);
      }
    }

    return newlyUnlocked;
  }, [user]);

  // ── Calculer l'objectif quotidien ────────────────────────
  const getDailyProgress = useCallback(async () => {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_DATE);
    const storedMin = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_XP);

    if (storedDate !== today) return { done: 0, goal: user?.dailyGoal ?? 10, percentage: 0 };

    const done = parseInt(storedMin ?? '0');
    const goal = user?.dailyGoal ?? 10;
    return { done, goal, percentage: Math.min(100, Math.round((done / goal) * 100)) };
  }, [user]);

  // ── XP pour les exercices individuels ───────────────────
  const awardExerciseXP = useCallback(async (isCorrect: boolean) => {
    if (isCorrect) {
      await awardXP(GAMIFICATION.XP_PER_EXERCISE);
    }
  }, [awardXP]);

  return {
    checkAndUpdateStreak,
    recordDailyActivity,
    awardXP,
    completeLesson,
    completeQuiz,
    checkAchievements,
    getDailyProgress,
    awardExerciseXP,
    allAchievements: ALL_ACHIEVEMENTS,
  };
}

// ── Calcul du niveau ─────────────────────────────────────────
function calculateLevel(xp: number): number {
  const levels = GAMIFICATION.LEVELS;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xpRequired) return levels[i].level;
  }
  return 1;
}
