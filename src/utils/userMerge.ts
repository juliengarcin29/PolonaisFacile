// ============================================================
// src/utils/userMerge.ts
// Fonctions pures de fusion d'utilisateurs et de calcul de niveau
// ============================================================

import { GAMIFICATION } from '@/constants';
import { mergeActivityLogs } from './activityUtils';
import type { User } from '@/types';

/**
 * Calcule le niveau et l'XP restant jusqu'au niveau suivant.
 */
export function calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
  let level = 1;
  const levels = GAMIFICATION.LEVELS;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xpRequired) {
      level = i + 1;
      break;
    }
  }
  const nextLevelObj = levels[level] ?? levels[levels.length - 1];
  return { level, xpToNextLevel: Math.max(0, nextLevelObj.xpRequired - xp) };
}

/**
 * Fusionne deux objets User en conservant le maximum des compteurs
 * et l'union des listes de progression.
 */
export function mergeUsers(current: User, incoming: User): User {
  const mergedXp = Math.max(current.xp || 0, incoming.xp || 0);
  const { level, xpToNextLevel } = calculateLevel(mergedXp);

  return {
    ...incoming,
    xp: mergedXp,
    level,
    xpToNextLevel,
    streak: Math.max(current.streak || 0, incoming.streak || 0),
    longestStreak: Math.max(current.longestStreak || 0, incoming.longestStreak || 0),
    hearts: current.hearts ?? incoming.hearts ?? 5,
    maxHearts: current.maxHearts ?? incoming.maxHearts ?? 5,
    language: current.language ?? incoming.language ?? 'fr',
    dailyGoal: current.dailyGoal ?? incoming.dailyGoal ?? 10,
    achievements: Array.from(new Set([
      ...(current.achievements || []),
      ...(incoming.achievements || []),
    ])),
    activityLog: mergeActivityLogs(current.activityLog, incoming.activityLog),
    progress: {
      ...incoming.progress,
      completedLessons: Array.from(new Set([
        ...(current.progress?.completedLessons || []),
        ...(incoming.progress?.completedLessons || []),
      ])),
      completedModules: Array.from(new Set([
        ...(current.progress?.completedModules || []),
        ...(incoming.progress?.completedModules || []),
      ])),
      completedQuizzes: Array.from(new Set([
        ...(current.progress?.completedQuizzes || []),
        ...(incoming.progress?.completedQuizzes || []),
      ])),
      masteredFlashcards: Array.from(new Set([
        ...(current.progress?.masteredFlashcards || []),
        ...(incoming.progress?.masteredFlashcards || []),
      ])),
      totalLessonsCompleted: Math.max(
        current.progress?.totalLessonsCompleted || 0,
        incoming.progress?.totalLessonsCompleted || 0
      ),
      totalXpEarned: Math.max(
        current.progress?.totalXpEarned || 0,
        incoming.progress?.totalXpEarned || 0
      ),
      totalTimeSpent: Math.max(
        current.progress?.totalTimeSpent || 0,
        incoming.progress?.totalTimeSpent || 0
      ),
    },
  };
}
