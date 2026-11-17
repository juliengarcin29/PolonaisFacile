// ============================================================
// src/store/userStore.ts
// État global de l'utilisateur avec Zustand
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Subscription, ActivityLogDay } from '@/types';
import { toDateKey, pruneActivityLog, mergeActivityLogs } from '@/utils/activityUtils';

interface UserStore {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isOnboarded: boolean;
  _hasHydrated: boolean; // Ajouté

  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setSubscription: (subscription: Subscription | null) => void;
  addXP: (amount: number) => void;
  recordActivity: (delta: {
    seconds?: number;
    lessonsCompleted?: number;
    xp?: number;
    exercisesDone?: number;
  }) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  setOnboarded: (value: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setHasHydrated: (value: boolean) => void; // Ajouté
  reset: () => void;
}

import { GAMIFICATION } from '@/constants';

function calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
  let level = 1;
  const levels = GAMIFICATION.LEVELS;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xpRequired) {
      level = i + 1;
      break;
    }
  }
  const nextLevelObj = levels[level] ?? levels[levels.length - 1];
  return { level, xpToNextLevel: nextLevelObj.xpRequired - xp };
}

function mergeUsers(current: User, incoming: User): User {
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

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      isLoading: true,
      isOnboarded: false,
      _hasHydrated: false,

      setUser: (user) => {
        const currentUser = get().user;
        let mode: 'merge' | 'adoption' | 'replace' = 'replace';
        let newUserObj: User | null = user;

        if (currentUser && user) {
          if (currentUser.id === user.id) {
            mode = 'merge';
            newUserObj = mergeUsers(currentUser, user);
          } else if (currentUser.id.startsWith('anon_')) {
            mode = 'adoption';
            newUserObj = mergeUsers(currentUser, user);
          }
        }

        if (__DEV__) {
          console.log('[setUser debug]', {
            mode,
            oldId: currentUser?.id,
            newId: user?.id,
            oldXp: currentUser?.xp,
            newXp: user?.xp,
            oldLessons: currentUser?.progress?.completedLessons?.length ?? 0,
            newLessons: user?.progress?.completedLessons?.length ?? 0,
            level: newUserObj?.level,
            language: newUserObj?.language,
            dailyGoal: newUserObj?.dailyGoal,
          });
        }

        set({ user: newUserObj });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates, updatedAt: new Date() } : null,
        })),

      setSubscription: (subscription) => set({ subscription }),

      recordActivity: (delta) =>
        set((state) => {
          if (!state.user) return {};
          const dateKey = toDateKey();
          const currentLog = state.user.activityLog ?? {};
          const currentDay = currentLog[dateKey] ?? {
            seconds: 0,
            lessonsCompleted: 0,
            xp: 0,
            exercisesDone: 0,
          };

          const updatedDay: ActivityLogDay = {
            ...currentDay,
            seconds: (currentDay.seconds ?? 0) + (delta.seconds ?? 0),
            lessonsCompleted: (currentDay.lessonsCompleted ?? 0) + (delta.lessonsCompleted ?? 0),
            xp: (currentDay.xp ?? 0) + (delta.xp ?? 0),
            exercisesDone: (currentDay.exercisesDone ?? 0) + (delta.exercisesDone ?? 0),
          };

          if (__DEV__) {
            console.log('[activityLog]', dateKey, JSON.stringify(updatedDay));
          }

          const updatedLog = pruneActivityLog({
            ...currentLog,
            [dateKey]: updatedDay,
          }, 400);

          return {
            user: {
              ...state.user,
              activityLog: updatedLog,
              updatedAt: new Date(),
            },
          };
        }),

      addXP: (amount) =>
        set((state) => {
          if (!state.user) return {};
          const newXp = (state.user.xp || 0) + amount;
          const { level, xpToNextLevel } = calculateLevel(newXp);

          const dateKey = toDateKey();
          const currentLog = state.user.activityLog ?? {};
          const currentDay = currentLog[dateKey] ?? {
            seconds: 0,
            lessonsCompleted: 0,
            xp: 0,
            exercisesDone: 0,
          };

          const updatedDay: ActivityLogDay = {
            ...currentDay,
            xp: (currentDay.xp ?? 0) + amount,
          };

          if (__DEV__) {
            console.log('[activityLog]', dateKey, JSON.stringify(updatedDay));
          }

          const updatedLog = pruneActivityLog({
            ...currentLog,
            [dateKey]: updatedDay,
          }, 400);

          return {
            user: {
              ...state.user,
              xp: newXp,
              level,
              xpToNextLevel,
              activityLog: updatedLog,
              progress: {
                ...state.user.progress,
                totalXpEarned: (state.user.progress?.totalXpEarned || 0) + amount,
              },
              updatedAt: new Date(),
            },
          };
        }),

      loseHeart: () =>
        set((state) => {
          if (!state.user) return {};
          return {
            user: {
              ...state.user,
              hearts: Math.max(0, (state.user.hearts || 0) - 1),
              updatedAt: new Date(),
            },
          };
        }),

      refillHearts: () =>
        set((state) => {
          if (!state.user) return {};
          return {
            user: {
              ...state.user,
              hearts: state.user.maxHearts || 5,
              updatedAt: new Date()
            },
          };
        }),

      setLanguage: (lang) =>
        set((state) => ({
          user: state.user ? { ...state.user, language: lang as any, updatedAt: new Date() } : null,
        })),

      setOnboarded: (value) => {
        set({ isOnboarded: value });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      reset: () => {
        if (__DEV__) {
          console.log('[reset] appelé');
        }
        set({ user: null, subscription: null, isOnboarded: false });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
