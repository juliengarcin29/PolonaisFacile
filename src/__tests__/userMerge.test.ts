// ============================================================
// src/__tests__/userMerge.test.ts
// Tests unitaires purs de la fusion d'utilisateurs et de calculateLevel
// ============================================================

import { describe, it, expect } from '@jest/globals';
import { calculateLevel, mergeUsers } from '../utils/userMerge';
import type { User } from '../types';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user_test',
  email: 'test@example.com',
  displayName: 'User Test',
  photoURL: null,
  level: 1,
  xp: 0,
  xpToNextLevel: 10,
  streak: 0,
  longestStreak: 0,
  hearts: 5,
  maxHearts: 5,
  premium: false,
  premiumExpiresAt: null,
  language: 'fr',
  targetLanguage: 'pl',
  dailyGoal: 10,
  achievements: [],
  progress: {
    completedLessons: [],
    completedModules: [],
    completedQuizzes: [],
    masteredFlashcards: [],
    totalXpEarned: 0,
    totalLessonsCompleted: 0,
    totalTimeSpent: 0,
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  lastLoginAt: new Date('2026-01-01'),
  ...overrides,
});

describe('calculateLevel — bornes exactes de la nouvelle échelle', () => {
  it('0 XP → niveau 1, 10 XP pour niveau 2', () => {
    expect(calculateLevel(0)).toEqual({ level: 1, xpToNextLevel: 10 });
  });

  it('9 XP → niveau 1, 1 XP restant', () => {
    expect(calculateLevel(9)).toEqual({ level: 1, xpToNextLevel: 1 });
  });

  it('10 XP → niveau 2, 20 XP pour niveau 3 (seuil 30)', () => {
    expect(calculateLevel(10)).toEqual({ level: 2, xpToNextLevel: 20 });
  });

  it('29 XP → niveau 2, 1 XP restant', () => {
    expect(calculateLevel(29)).toEqual({ level: 2, xpToNextLevel: 1 });
  });

  it('30 XP → niveau 3, 30 XP pour niveau 4 (seuil 60)', () => {
    expect(calculateLevel(30)).toEqual({ level: 3, xpToNextLevel: 30 });
  });

  it('549 XP → niveau 9, 1 XP pour niveau 10 (seuil 550)', () => {
    expect(calculateLevel(549)).toEqual({ level: 9, xpToNextLevel: 1 });
  });

  it('550 XP → niveau 10 (niveau max), xpToNextLevel=0', () => {
    expect(calculateLevel(550)).toEqual({ level: 10, xpToNextLevel: 0 });
  });

  it('100 000 XP → niveau 10 (niveau max), xpToNextLevel=0', () => {
    expect(calculateLevel(100000)).toEqual({ level: 10, xpToNextLevel: 0 });
  });
});

describe('mergeUsers — fusion sans régression', () => {
  it('même ID : prend le MAX des compteurs et l\'UNION des listes', () => {
    const current = makeUser({
      xp: 50,
      streak: 5,
      longestStreak: 10,
      achievements: ['first_lesson'],
      progress: {
        completedLessons: ['l1', 'l2'],
        completedModules: ['m1'],
        completedQuizzes: ['q1'],
        masteredFlashcards: ['fc1'],
        totalXpEarned: 50,
        totalLessonsCompleted: 2,
        totalTimeSpent: 300,
      },
    });

    const incoming = makeUser({
      xp: 80,
      streak: 3,
      longestStreak: 7,
      achievements: ['streak_3'],
      progress: {
        completedLessons: ['l2', 'l3'],
        completedModules: ['m2'],
        completedQuizzes: ['q2'],
        masteredFlashcards: ['fc2'],
        totalXpEarned: 80,
        totalLessonsCompleted: 3,
        totalTimeSpent: 200,
      },
    });

    const merged = mergeUsers(current, incoming);

    expect(merged.xp).toBe(80); // max(50, 80)
    expect(merged.level).toBe(4); // calculateLevel(80) -> level 4 (seuil 60)
    expect(merged.streak).toBe(5); // max(5, 3)
    expect(merged.longestStreak).toBe(10); // max(10, 7)
    expect(merged.progress.totalLessonsCompleted).toBe(3); // max(2, 3)
    expect(merged.progress.totalXpEarned).toBe(80); // max(50, 80)
    expect(merged.progress.totalTimeSpent).toBe(300); // max(300, 200)

    expect(merged.achievements.sort()).toEqual(['first_lesson', 'streak_3'].sort());
    expect(merged.progress.completedLessons.sort()).toEqual(['l1', 'l2', 'l3'].sort());
    expect(merged.progress.completedModules.sort()).toEqual(['m1', 'm2'].sort());
    expect(merged.progress.completedQuizzes.sort()).toEqual(['q1', 'q2'].sort());
    expect(merged.progress.masteredFlashcards.sort()).toEqual(['fc1', 'fc2'].sort());
  });

  it('profil distant (incoming) vierge face à profil local avancé : ne perd rien', () => {
    const current = makeUser({
      xp: 120,
      streak: 7,
      longestStreak: 7,
      hearts: 3,
      language: 'en',
      dailyGoal: 15,
      achievements: ['first_lesson', 'streak_7'],
      progress: {
        completedLessons: ['l1', 'l2', 'l3', 'l4'],
        completedModules: ['m1'],
        completedQuizzes: ['q1'],
        masteredFlashcards: ['fc1', 'fc2'],
        totalXpEarned: 120,
        totalLessonsCompleted: 4,
        totalTimeSpent: 1200,
      },
    });

    const incomingVierge = makeUser({
      xp: 0,
      streak: 0,
      longestStreak: 0,
      hearts: 5,
      language: 'fr',
      dailyGoal: 10,
      achievements: [],
      progress: {
        completedLessons: [],
        completedModules: [],
        completedQuizzes: [],
        masteredFlashcards: [],
        totalXpEarned: 0,
        totalLessonsCompleted: 0,
        totalTimeSpent: 0,
      },
    });

    const merged = mergeUsers(current, incomingVierge);

    expect(merged.xp).toBe(120);
    expect(merged.level).toBe(5); // calculateLevel(120) -> level 5 (seuil 100)
    expect(merged.streak).toBe(7);
    expect(merged.longestStreak).toBe(7);
    expect(merged.hearts).toBe(3); // garde la valeur du local
    expect(merged.language).toBe('en'); // garde la valeur du local
    expect(merged.dailyGoal).toBe(15); // garde la valeur du local
    expect(merged.progress.completedLessons).toHaveLength(4);
    expect(merged.progress.totalLessonsCompleted).toBe(4);
  });

  it('test de régression du bug corrige : totalXpEarned vaut le MAX des deux totalXpEarned (pas totalTimeSpent)', () => {
    const current = makeUser({
      progress: {
        completedLessons: ['l1'],
        completedModules: [],
        completedQuizzes: [],
        masteredFlashcards: [],
        totalXpEarned: 100,
        totalLessonsCompleted: 1,
        totalTimeSpent: 5000, // totalTimeSpent élevé (5000s)
      },
    });

    const incoming = makeUser({
      progress: {
        completedLessons: ['l1'],
        completedModules: [],
        completedQuizzes: [],
        masteredFlashcards: [],
        totalXpEarned: 20, // totalXpEarned distant plus bas
        totalLessonsCompleted: 1,
        totalTimeSpent: 200,
      },
    });

    const merged = mergeUsers(current, incoming);
    // doit valoir max(100, 20) = 100, PAS max(100, 200) issu de totalTimeSpent !
    expect(merged.progress.totalXpEarned).toBe(100);
  });

  it('fusion idempotente : mergeUsers(merged, incoming) est égal à merged', () => {
    const current = makeUser({ xp: 50, streak: 3, achievements: ['first_lesson'] });
    const incoming = makeUser({ xp: 80, streak: 2, achievements: ['streak_3'] });

    const once = mergeUsers(current, incoming);
    const twice = mergeUsers(once, incoming);

    expect(twice).toEqual(once);
  });

  it('gère les tableaux ou champs optionnels absents sans crasher', () => {
    const current: User = {
      ...makeUser(),
      achievements: undefined as any,
      activityLog: undefined,
      progress: {
        completedLessons: undefined as any,
        completedModules: undefined as any,
        completedQuizzes: undefined as any,
        masteredFlashcards: undefined as any,
        totalXpEarned: 0,
        totalLessonsCompleted: 0,
        totalTimeSpent: 0,
      },
    };

    const incoming: User = {
      ...makeUser(),
      achievements: ['first_lesson'],
      activityLog: { '2026-05-17': { seconds: 10, lessonsCompleted: 1, xp: 10, exercisesDone: 1 } },
      progress: {
        completedLessons: ['l1'],
        completedModules: ['m1'],
        completedQuizzes: ['q1'],
        masteredFlashcards: ['fc1'],
        totalXpEarned: 10,
        totalLessonsCompleted: 1,
        totalTimeSpent: 60,
      },
    };

    expect(() => mergeUsers(current, incoming)).not.toThrow();
    const merged = mergeUsers(current, incoming);
    expect(merged.achievements).toEqual(['first_lesson']);
    expect(merged.progress.completedLessons).toEqual(['l1']);
  });
});
