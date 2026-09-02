// ============================================================
// src/hooks/useProgress.ts
// Hook de confort pour accéder à la progression utilisateur
// ============================================================

import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';
import { useState, useEffect, useCallback } from 'react';

export function useProgress() {
  const { user } = useUserStore();
  const { getDailyProgress } = useGamification();
  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(10);
  const [percentage, setPercentage] = useState(0);

  const refreshDailyStats = useCallback(async () => {
    const stats = await getDailyProgress();
    setDailyMinutes(stats.done);
    setTargetMinutes(stats.goal);
    setPercentage(stats.percentage);
  }, [getDailyProgress]);

  useEffect(() => {
    refreshDailyStats();
  }, [user?.progress.totalTimeSpent]); // rafraîchir quand le temps total change

  return {
    streakDays: user?.streak ?? 0,
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
