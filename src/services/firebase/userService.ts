// ============================================================
// src/services/firebase/userService.ts — VERSION COMPLÈTE
// Remplace le fichier précédent
// ============================================================

import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { FIREBASE_COLLECTIONS } from '@/constants';
import type { User, UserProgress } from '@/types';

export const userService = {

  // ── Créer ou récupérer un utilisateur ────────────────────
  getOrCreateUser: async (uid: string, defaults: Partial<User> = {}): Promise<User | null> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { id: uid, ...snap.data() } as User;
    }

    const newUser: Omit<User, 'id'> = {
      email: defaults.email ?? null,
      displayName: defaults.displayName ?? 'Apprenant',
      photoURL: defaults.photoURL ?? null,
      level: 1, xp: 0, xpToNextLevel: 100,
      streak: 0, longestStreak: 0,
      hearts: 5, maxHearts: 5,
      premium: false, premiumExpiresAt: null,
      language: 'fr', targetLanguage: 'pl',
      dailyGoal: 10, achievements: [],
      progress: {
        completedLessons: [], completedModules: [],
        completedQuizzes: [], masteredFlashcards: [],
        totalXpEarned: 0, totalLessonsCompleted: 0, totalTimeSpent: 0,
      },
      createdAt: new Date(), updatedAt: new Date(), lastLoginAt: new Date(),
    };

    await setDoc(ref, {
      id: uid, ...newUser,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return { id: uid, ...newUser };
  },

  // ── Mise à jour générique ────────────────────────────────
  updateUser: async (uid: string, data: Partial<User>): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  },

  // ── Mettre à jour la progression ────────────────────────
  updateProgress: async (uid: string, progress: Partial<UserProgress>): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    await updateDoc(ref, { progress, updatedAt: serverTimestamp() });
  },

  // ── Ajouter de l'XP (incrémental) ───────────────────────
  addXP: async (uid: string, amount: number): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    await updateDoc(ref, {
      xp: increment(amount),
      'progress.totalXpEarned': increment(amount),
      updatedAt: serverTimestamp(),
    });
  },

  // ── Mettre à jour le streak ──────────────────────────────
  updateStreak: async (uid: string, streak: number, longestStreak: number): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    await updateDoc(ref, {
      streak, longestStreak,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // ── Marquer une leçon comme complétée ───────────────────
  completeLesson: async (uid: string, lessonId: string, xpEarned: number): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const user = snap.data() as User;
    const completed = user.progress?.completedLessons ?? [];
    if (completed.includes(lessonId)) return;

    await updateDoc(ref, {
      'progress.completedLessons': [...completed, lessonId],
      'progress.totalLessonsCompleted': increment(1),
      'progress.totalXpEarned': increment(xpEarned),
      xp: increment(xpEarned),
      updatedAt: serverTimestamp(),
    });
  },

  // ── Débloquer un badge ───────────────────────────────────
  unlockAchievement: async (uid: string, achievementId: string): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const user = snap.data() as User;
    const achievements = user.achievements ?? [];
    if (achievements.includes(achievementId)) return;
    await updateDoc(ref, {
      achievements: [...achievements, achievementId],
      updatedAt: serverTimestamp(),
    });
  },

  // ── Mettre à jour l'objectif quotidien ──────────────────
  updateDailyGoal: async (uid: string, minutes: number): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    await updateDoc(ref, { dailyGoal: minutes, updatedAt: serverTimestamp() });
  },

  // ── Activer Premium ──────────────────────────────────────
  activatePremium: async (uid: string, expiresAt: Date | null): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    await updateDoc(ref, {
      premium: true,
      premiumExpiresAt: expiresAt,
      updatedAt: serverTimestamp(),
    });
  },

  // ── Désactiver Premium ───────────────────────────────────
  deactivatePremium: async (uid: string): Promise<void> => {
    const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    await updateDoc(ref, {
      premium: false,
      premiumExpiresAt: null,
      updatedAt: serverTimestamp(),
    });
  },
};
