// ============================================================
// src/store/userStore.ts
// État global de l'utilisateur avec Zustand
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Subscription } from '@/types';

interface UserStore {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setSubscription: (sub: Subscription | null) => void;
  addXP: (amount: number) => void;
  updateStreak: () => void;
  loseHeart: () => void;
  refillHearts: () => void;
  setOnboarded: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  reset: () => void;
}

const DEFAULT_USER: Omit<User, 'id' | 'email' | 'displayName' | 'photoURL' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
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
};

const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];

function calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
  let level = 1;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) {
      level = i + 1;
      break;
    }
  }
  const nextLevelXp = XP_LEVELS[level] ?? XP_LEVELS[XP_LEVELS.length - 1];
  return { level, xpToNextLevel: nextLevelXp - xp };
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  subscription: null,
  isLoading: true,
  isOnboarded: false,

  setUser: (user) => set({ user }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates, updatedAt: new Date() } : null,
    })),

  setSubscription: (subscription) => set({ subscription }),

  addXP: (amount) =>
    set((state) => {
      if (!state.user) return {};
      const newXp = state.user.xp + amount;
      const { level, xpToNextLevel } = calculateLevel(newXp);
      return {
        user: {
          ...state.user,
          xp: newXp,
          level,
          xpToNextLevel,
          progress: {
            ...state.user.progress,
            totalXpEarned: state.user.progress.totalXpEarned + amount,
          },
          updatedAt: new Date(),
        },
      };
    }),

  updateStreak: () =>
    set((state) => {
      if (!state.user) return {};
      const today = new Date().toDateString();
      const lastLogin = new Date(state.user.lastLoginAt).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      let newStreak = state.user.streak;
      if (lastLogin === yesterday) {
        newStreak += 1;
      } else if (lastLogin !== today) {
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, state.user.longestStreak);
      return {
        user: {
          ...state.user,
          streak: newStreak,
          longestStreak,
          lastLoginAt: new Date(),
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
          hearts: Math.max(0, state.user.hearts - 1),
          updatedAt: new Date(),
        },
      };
    }),

  refillHearts: () =>
    set((state) => {
      if (!state.user) return {};
      return {
        user: { ...state.user, hearts: state.user.maxHearts, updatedAt: new Date() },
      };
    }),

  setOnboarded: async (value) => {
    await AsyncStorage.setItem('isOnboarded', value ? 'true' : 'false');
    set({ isOnboarded: value });
  },

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ user: null, subscription: null, isOnboarded: false }),
}));
