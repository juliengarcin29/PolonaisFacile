// ============================================================
// src/store/userStore.ts
// État global de l'utilisateur avec Zustand
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Subscription } from '@/types';

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
  updateStreak: () => void;
  loseHeart: () => void;
  refillHearts: () => void;
  setOnboarded: (value: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setHasHydrated: (value: boolean) => void; // Ajouté
  reset: () => void;
}

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

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      isLoading: true,
      isOnboarded: false,
      _hasHydrated: false,

      setUser: (user) => {
        // Fusion intelligente pour éviter de reset l'XP locale si Firestore est en retard
        const currentUser = get().user;
        if (currentUser && user && currentUser.id === user.id) {
          const merged = {
            ...user,
            xp: Math.max(currentUser.xp || 0, user.xp || 0),
            streak: Math.max(currentUser.streak || 0, user.streak || 0),
            achievements: Array.from(new Set([
              ...(currentUser.achievements || []),
              ...(user.achievements || []),
            ])),
            progress: {
              ...user.progress,
              completedLessons: Array.from(new Set([
                ...(currentUser.progress?.completedLessons || []),
                ...(user.progress?.completedLessons || []),
              ])),
              completedModules: Array.from(new Set([
                ...(currentUser.progress?.completedModules || []),
                ...(user.progress?.completedModules || []),
              ])),
              completedQuizzes: Array.from(new Set([
                ...(currentUser.progress?.completedQuizzes || []),
                ...(user.progress?.completedQuizzes || []),
              ])),
              masteredFlashcards: Array.from(new Set([
                ...(currentUser.progress?.masteredFlashcards || []),
                ...(user.progress?.masteredFlashcards || []),
              ])),
              totalLessonsCompleted: Math.max(
                currentUser.progress?.totalLessonsCompleted || 0,
                user.progress?.totalLessonsCompleted || 0
              ),
              totalXpEarned: Math.max(
                currentUser.progress?.totalXpEarned || 0,
                user.progress?.totalXpEarned || 0
              ),
              totalTimeSpent: Math.max(
                currentUser.progress?.totalTimeSpent || 0,
                user.progress?.totalTimeSpent || 0
              ),
            }
          };
          set({ user: merged });
        } else {
          set({ user });
        }
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates, updatedAt: new Date() } : null,
        })),

      setSubscription: (subscription) => set({ subscription }),

      addXP: (amount) =>
        set((state) => {
          if (!state.user) return {};
          const newXp = (state.user.xp || 0) + amount;
          const { level, xpToNextLevel } = calculateLevel(newXp);
          return {
            user: {
              ...state.user,
              xp: newXp,
              level,
              xpToNextLevel,
              progress: {
                ...state.user.progress,
                totalXpEarned: (state.user.progress?.totalXpEarned || 0) + amount,
              },
              updatedAt: new Date(),
            },
          };
        }),

      updateStreak: () =>
        set((state) => {
          if (!state.user) return {};
          const today = new Date().toDateString();
          const lastLoginDate = state.user.lastLoginAt ? new Date(state.user.lastLoginAt) : new Date(0);
          const lastLogin = lastLoginDate.toDateString();

          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = yesterdayDate.toDateString();

          let newStreak = state.user.streak || 0;
          if (lastLogin === yesterday) {
            newStreak += 1;
          } else if (lastLogin !== today) {
            newStreak = 1;
          }

          const longestStreak = Math.max(newStreak, state.user.longestStreak || 0);
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

      setOnboarded: (value) => {
        set({ isOnboarded: value });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      reset: () => set({ user: null, subscription: null, isOnboarded: false }),
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
