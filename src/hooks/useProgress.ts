// ============================================================
// src/hooks/useProgress.ts
// Hook de confort pour accéder à la progression utilisateur
// ============================================================

import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';
import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { toDateKey, computeStreak } from '@/utils/activityUtils';

export function useProgress() {
  const { user } = useUserStore();
  const { getDailyProgress } = useGamification();
  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(10);
  const [percentage, setPercentage] = useState(0);
  const [todayKey, setTodayKey] = useState(() => toDateKey());

  const refreshDailyStats = useCallback(async () => {
    setTodayKey(toDateKey());
    const stats = await getDailyProgress();
    setDailyMinutes(stats.done);
    setTargetMinutes(stats.goal);
    setPercentage(stats.percentage);
  }, [getDailyProgress]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshDailyStats();
      }
    });
    return () => subscription.remove();
  }, [refreshDailyStats]);

  useEffect(() => {
    refreshDailyStats();
  }, [user?.progress.totalTimeSpent, refreshDailyStats]);

  const streakDays = computeStreak(user?.activityLog, todayKey).currentStreak;

  return {
    streakDays,
    totalXp: user?.xp ?? 0,
    level: user?.level ?? 1,
    completedLessonsCount: user?.progress.totalLessonsCompleted ?? 0,
    masteredWordsCount: user?.progress.masteredFlashcards.length ?? 0,
    dailyMinutes,
    targetMinutes,
    dailyPercentage: percentage,
    refreshDailyStats,
  };
}
