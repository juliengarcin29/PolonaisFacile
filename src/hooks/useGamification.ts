// ============================================================
// src/hooks/useGamification.ts
// Hook central — XP, niveaux, streak, badges, objectif quotidien
// ============================================================

import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { GAMIFICATION } from '@/constants';
import { capSessionSeconds } from '@/utils/activityUtils';
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
    title: 'achievements.first_lesson.title',
    description: 'achievements.first_lesson.desc',
    icon: '🎯',
    xpReward: 5,
    rarity: 'common',
    condition: { type: 'lessons', value: 1 },
  },
  {
    id: 'streak_3',
    title: 'achievements.streak_3.title',
    description: 'achievements.streak_3.desc',
    icon: '🔥',
    xpReward: 8,
    rarity: 'common',
    condition: { type: 'streak', value: 3 },
  },
  {
    id: 'streak_7',
    title: 'achievements.streak_7.title',
    description: 'achievements.streak_7.desc',
    icon: '🗓️',
    xpReward: 15,
    rarity: 'rare',
    condition: { type: 'streak', value: 7 },
  },
  {
    id: 'streak_30',
    title: 'achievements.streak_30.title',
    description: 'achievements.streak_30.desc',
    icon: '🏅',
    xpReward: 50,
    rarity: 'epic',
    condition: { type: 'streak', value: 30 },
  },
  {
    id: 'xp_50',
    title: 'achievements.xp_50.title',
    description: 'achievements.xp_50.desc',
    icon: '⚡',
    xpReward: 3,
    rarity: 'common',
    condition: { type: 'xp', value: 50 },
  },
  {
    id: 'xp_200',
    title: 'achievements.xp_200.title',
    description: 'achievements.xp_200.desc',
    icon: '💪',
    xpReward: 8,
    rarity: 'rare',
    condition: { type: 'xp', value: 200 },
  },
  {
    id: 'xp_500',
    title: 'achievements.xp_500.title',
    description: 'achievements.xp_500.desc',
    icon: '🧠',
    xpReward: 15,
    rarity: 'epic',
    condition: { type: 'xp', value: 500 },
  },
  {
    id: 'xp_1000',
    title: 'achievements.xp_1000.title',
    description: 'achievements.xp_1000.desc',
    icon: '👑',
    xpReward: 50,
    rarity: 'legendary',
    condition: { type: 'xp', value: 1000 },
  },
  {
    id: 'lessons_5',
    title: 'achievements.lessons_5.title',
    description: 'achievements.lessons_5.desc',
    icon: '📚',
    xpReward: 10,
    rarity: 'common',
    condition: { type: 'lessons', value: 5 },
  },
  {
    id: 'lessons_25',
    title: 'achievements.lessons_25.title',
    description: 'achievements.lessons_25.desc',
    icon: '🎓',
    xpReward: 30,
    rarity: 'rare',
    condition: { type: 'lessons', value: 25 },
  },
  {
    id: 'flashcards_50',
    title: 'achievements.flashcards_50.title',
    description: 'achievements.flashcards_50.desc',
    icon: '🃏',
    xpReward: 20,
    rarity: 'rare',
    condition: { type: 'flashcards', value: 50 },
  },
  {
    id: 'quiz_perfect',
    title: 'achievements.quiz_perfect.title',
    description: 'achievements.quiz_perfect.desc',
    icon: '🏆',
    xpReward: 25,
    rarity: 'epic',
    condition: { type: 'quiz_score', value: 100 },
  },
];

// ── Hook principal ───────────────────────────────────────────
export function useGamification() {
  const { user, addXP, updateUser, updateStreak } = useUserStore();

  // 1. Vérifier et débloquer les badges (Passe unique sur état frais)
  const checkAchievements = useCallback(async (params?: {
    streak?: number;
    quizScore?: number;
  }) => {
    const freshUser = useUserStore.getState().user;
    if (!freshUser) return [];

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ALL_ACHIEVEMENTS) {
      if (freshUser.achievements.includes(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.condition.type) {
        case 'streak':
          unlocked = (params?.streak ?? freshUser.streak) >= achievement.condition.value;
          break;
        case 'xp':
          unlocked = freshUser.xp >= achievement.condition.value;
          break;
        case 'lessons':
          unlocked = freshUser.progress.totalLessonsCompleted >= achievement.condition.value;
          break;
        case 'flashcards':
          unlocked = freshUser.progress.masteredFlashcards.length >= achievement.condition.value;
          break;
        case 'quiz_score':
          unlocked = (params?.quizScore ?? 0) >= achievement.condition.value;
          break;
      }

      if (unlocked) {
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      const newIds = newlyUnlocked.map(a => a.id);
      const sumRewards = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);

      updateUser({
        achievements: Array.from(new Set([...freshUser.achievements, ...newIds])),
      });
      addXP(sumRewards);

      if (__DEV__) {
        newlyUnlocked.forEach(a => console.log('[badge]', a.id, '+' + a.xpReward));
      }
    }

    return newlyUnlocked;
  }, [updateUser, addXP]);

  // 2. Octroyer des XP
  const awardXP = useCallback(async (amount: number, reason?: string) => {
    const freshUser = useUserStore.getState().user;
    if (!freshUser) return { newTotal: 0, leveledUp: false };

    const oldLevel = freshUser.level;
    addXP(amount);

    if (__DEV__) {
      console.log('[xp]', '+' + amount, reason || '');
    }

    const latestUser = useUserStore.getState().user;
    const newTotal = latestUser?.xp ?? (freshUser.xp + amount);
    const newLevel = calculateLevel(newTotal);
    const leveledUp = newLevel > oldLevel;

    await checkAchievements();

    return { newTotal, leveledUp, newLevel, reason };
  }, [addXP, checkAchievements]);

  // 3. Enregistrer l'activité quotidienne
  const recordDailyActivity = useCallback(async (minutesSpent: number, exactSeconds?: number) => {
    const freshUser = useUserStore.getState().user;
    const secondsToRecord = exactSeconds ?? (minutesSpent * 60);
    useUserStore.getState().recordActivity({ seconds: capSessionSeconds(secondsToRecord) });

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
      if (totalMin >= (freshUser?.dailyGoal ?? 10) && parseInt(storedXP ?? '0') < (freshUser?.dailyGoal ?? 10)) {
        await awardXP(GAMIFICATION.XP_DAILY_GOAL_BONUS, '🎯 Objectif du jour atteint !');
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, today);
  }, [awardXP]);

  // 4. Vérifier et mettre à jour le streak
  const checkAndUpdateStreak = useCallback(async () => {
    const freshUser = useUserStore.getState().user;
    if (!freshUser) return;

    const today = new Date().toDateString();
    const lastActivity = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);

    if (lastActivity === today) return; // déjà mis à jour aujourd'hui

    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    let newStreak = freshUser.streak;

    if (lastActivity === yesterday) {
      newStreak = freshUser.streak + 1;
    } else if (lastActivity !== today) {
      newStreak = 1; // série cassée
    }

    const longestStreak = Math.max(newStreak, freshUser.longestStreak);
    updateUser({ streak: newStreak, longestStreak, lastLoginAt: new Date() });
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, today);

    // Bonus XP pour les jalons de streak
    if (newStreak % 7 === 0) {
      await awardXP(newStreak * GAMIFICATION.XP_STREAK_PER_DAY, `🔥 ${newStreak} jours de suite !`);
    }

    // Vérifier badges streak
    await checkAchievements({ streak: newStreak });
  }, [updateUser, awardXP, checkAchievements]);

  // 5. Terminer une leçon
  const completeLesson = useCallback(async (
    lessonId: string,
    score: number,
    total: number,
    timeSpentSeconds: number,
  ) => {
    const freshUser = useUserStore.getState().user;
    if (!freshUser) return;

    if (freshUser.progress.completedLessons.includes(lessonId)) {
      // Relecture d'une leçon déjà terminée : consigner uniquement secondes et exercices dans activityLog
      useUserStore.getState().recordActivity({
        seconds: capSessionSeconds(timeSpentSeconds),
        exercisesDone: total,
      });
      return;
    }

    // Première complétion : consigner 1 leçon et les exercices dans activityLog
    useUserStore.getState().recordActivity({
      lessonsCompleted: 1,
      exercisesDone: total,
    });

    const isPerfect = score === total;
    const baseXP = GAMIFICATION.XP_PER_LESSON;
    const bonusXP = isPerfect ? GAMIFICATION.XP_PER_PERFECT : 0;
    const totalXP = baseXP + bonusXP;

    const updatedProgress = {
      ...freshUser.progress,
      completedLessons: [...freshUser.progress.completedLessons, lessonId],
      totalLessonsCompleted: freshUser.progress.totalLessonsCompleted + 1,
      totalTimeSpent: freshUser.progress.totalTimeSpent + timeSpentSeconds,
    };

    updateUser({ progress: updatedProgress });
    await awardXP(totalXP, isPerfect ? '🏆 Leçon parfaite !' : '📚 Leçon terminée !');
    await recordDailyActivity(Math.round(timeSpentSeconds / 60), timeSpentSeconds);

    return { xpEarned: totalXP, isPerfect };
  }, [updateUser, awardXP, recordDailyActivity]);

  // 6. Terminer un quiz
  const completeQuiz = useCallback(async (
    quizId: string,
    score: number,
    total: number,
    timeSpentSeconds: number,
  ) => {
    const freshUser = useUserStore.getState().user;
    if (!freshUser) return;

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70; // score de passage par défaut
    const xpReward = Math.round((score / total) * GAMIFICATION.XP_PER_QUIZ); // XP proportionnels au score

    if (passed) {
      const updatedProgress = {
        ...freshUser.progress,
        completedQuizzes: [...new Set([...freshUser.progress.completedQuizzes, quizId])],
        totalTimeSpent: freshUser.progress.totalTimeSpent + timeSpentSeconds,
      };
      updateUser({ progress: updatedProgress });
    }

    await awardXP(xpReward, passed ? '🎯 Quiz réussi !' : '🎯 Quiz terminé');
    await recordDailyActivity(Math.round(timeSpentSeconds / 60), timeSpentSeconds);

    if (percentage === 100) {
      await checkAchievements({ quizScore: 100 });
    }

    return { xpEarned: xpReward, passed };
  }, [updateUser, awardXP, recordDailyActivity, checkAchievements]);

  // 7. Calculer l'objectif quotidien
  const getDailyProgress = useCallback(async () => {
    const freshUser = useUserStore.getState().user;
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_DATE);
    const storedMin = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_XP);

    if (storedDate !== today) return { done: 0, goal: freshUser?.dailyGoal ?? 10, percentage: 0 };

    const done = parseInt(storedMin ?? '0');
    const goal = freshUser?.dailyGoal ?? 10;
    return { done, goal, percentage: Math.min(100, Math.round((done / goal) * 100)) };
  }, []);

  // 8. XP pour les exercices individuels
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
