// ============================================================
// src/services/analytics/analyticsService.ts
// Firebase Analytics — suivi des événements clés
// ============================================================

import { FEATURES } from '@/config/appConfig';

// ── Types d'événements ────────────────────────────────────────
type AnalyticsEvent =
  | 'app_open'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'onboarding_skip'
  | 'lesson_start'
  | 'lesson_complete'
  | 'lesson_fail'
  | 'quiz_start'
  | 'quiz_complete'
  | 'flashcard_session_start'
  | 'flashcard_session_complete'
  | 'dialogue_start'
  | 'dialogue_complete'
  | 'dictation_start'
  | 'dictation_complete'
  | 'conversation_start'
  | 'conversation_message_sent'
  | 'paywall_open'
  | 'paywall_close'
  | 'trial_start'
  | 'purchase_complete'
  | 'purchase_fail'
  | 'restore_purchase'
  | 'rewarded_ad_show'
  | 'rewarded_ad_complete'
  | 'interstitial_ad_show'
  | 'streak_broken'
  | 'streak_milestone'
  | 'level_up'
  | 'achievement_unlock'
  | 'share'
  | 'notification_permission'
  | 'notification_click';

interface EventParams {
  [key: string]: string | number | boolean | null | undefined;
}

// ── Service Analytics ─────────────────────────────────────────
class AnalyticsService {
  private enabled = FEATURES.SHOW_DEV_MENU === false; // Désactivé en dev

  private log(event: AnalyticsEvent, params?: EventParams) {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, params ?? '');
    }
  }

  // ── Événements d'onboarding ──────────────────────────────
  trackOnboardingStart() {
    this.log('onboarding_start');
  }

  trackOnboardingComplete(data: { goal: string; level: string; dailyMinutes: number }) {
    this.log('onboarding_complete', data);
  }

  // ── Événements de leçon ──────────────────────────────────
  trackLessonStart(lessonId: string, moduleId: string, difficulty: string) {
    this.log('lesson_start', { lessonId, moduleId, difficulty });
  }

  trackLessonComplete(data: {
    lessonId: string;
    score: number;
    xpEarned: number;
    timeSpent: number;
    isPerfect: boolean;
  }) {
    this.log('lesson_complete', data);
  }

  // ── Événements de quiz ───────────────────────────────────
  trackQuizStart(quizId: string, difficulty: string) {
    this.log('quiz_start', { quizId, difficulty });
  }

  trackQuizComplete(data: {
    quizId: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    xpEarned: number;
    passed: boolean;
  }) {
    this.log('quiz_complete', data);
  }

  // ── Événements de flashcards ─────────────────────────────
  trackFlashcardSessionComplete(data: {
    cardsReviewed: number;
    xpEarned: number;
    moduleId?: string;
  }) {
    this.log('flashcard_session_complete', data);
  }

  // ── Événements de monétisation ────────────────────────────
  trackPaywallOpen(reason: string) {
    this.log('paywall_open', { reason });
  }

  trackPaywallClose(converted: boolean) {
    this.log('paywall_close', { converted });
  }

  trackTrialStart(plan: string) {
    this.log('trial_start', { plan });
  }

  trackPurchaseComplete(data: {
    plan: string;
    price: string;
    currency: string;
  }) {
    this.log('purchase_complete', data);
  }

  trackPurchaseFail(plan: string, errorCode: string) {
    this.log('purchase_fail', { plan, errorCode });
  }

  // ── Événements publicitaires ─────────────────────────────
  trackRewardedAdComplete(xpReward: number) {
    this.log('rewarded_ad_complete', { xpReward });
  }

  // ── Événements de gamification ────────────────────────────
  trackStreakMilestone(streak: number) {
    this.log('streak_milestone', { streak });
  }

  trackLevelUp(newLevel: number, totalXP: number) {
    this.log('level_up', { newLevel, totalXP });
  }

  trackAchievementUnlock(achievementId: string, rarity: string) {
    this.log('achievement_unlock', { achievementId, rarity });
  }

  // ── Événements IA ────────────────────────────────────────
  trackConversationStart(scenarioId: string) {
    this.log('conversation_start', { scenarioId });
  }

  trackConversationMessage(hasCorrections: boolean) {
    this.log('conversation_message_sent', { hasCorrections });
  }

  // ── Rétention ────────────────────────────────────────────
  trackAppOpen(daysSinceLastOpen: number) {
    this.log('app_open', { daysSinceLastOpen });
  }
}

export const analytics = new AnalyticsService();


// ============================================================
// src/services/firebase/progressService.ts
// Service de progression — Firestore + cache local
// ============================================================

import { FIREBASE_COLLECTIONS } from '@/constants';
import type { UserProgress } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

const CACHE_KEY = 'progress_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const progressService = {

  // ── Charger la progression (cache + Firebase) ────────────
  getProgress: async (): Promise<UserProgress | null> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    // Essayer le cache d'abord
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${uid}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data as UserProgress;
        }
      }
    } catch { /* cache miss */ }

    // Charger depuis Firebase
    try {
      const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;

      const progress = snap.data().progress as UserProgress;

      // Mettre à jour le cache
      await AsyncStorage.setItem(`${CACHE_KEY}_${uid}`, JSON.stringify({
        data: progress,
        timestamp: Date.now(),
      }));

      return progress;
    } catch (e) {
      console.error('Erreur chargement progression:', e);
      return null;
    }
  },

  // ── Marquer une leçon comme complétée ───────────────────
  markLessonComplete: async (lessonId: string, xpEarned: number): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const current = snap.data().progress as UserProgress;
      if (current.completedLessons?.includes(lessonId)) return;

      await updateDoc(ref, {
        'progress.completedLessons': [...(current.completedLessons ?? []), lessonId],
        'progress.totalLessonsCompleted': increment(1),
        'progress.totalXpEarned': increment(xpEarned),
        xp: increment(xpEarned),
        updatedAt: serverTimestamp(),
      });

      // Invalider le cache
      await AsyncStorage.removeItem(`${CACHE_KEY}_${uid}`);
    } catch (e) {
      // Stocker localement pour sync ultérieure
      const pending = JSON.parse(
        (await AsyncStorage.getItem('pending_completions')) ?? '[]'
      );
      pending.push({ lessonId, xpEarned, timestamp: Date.now() });
      await AsyncStorage.setItem('pending_completions', JSON.stringify(pending));
    }
  },

  // ── Synchroniser les completions en attente ──────────────
  syncPendingCompletions: async (): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const pending = JSON.parse(
      (await AsyncStorage.getItem('pending_completions')) ?? '[]'
    );

    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        await progressService.markLessonComplete(item.lessonId, item.xpEarned);
      } catch { /* skip */ }
    }

    await AsyncStorage.removeItem('pending_completions');
  },

  // ── Ajouter un mot maîtrisé ──────────────────────────────
  addMasteredFlashcard: async (flashcardId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const current = snap.data().progress as UserProgress;
      const mastered = current.masteredFlashcards ?? [];
      if (mastered.includes(flashcardId)) return;

      await updateDoc(ref, {
        'progress.masteredFlashcards': [...mastered, flashcardId],
        updatedAt: serverTimestamp(),
      });

      await AsyncStorage.removeItem(`${CACHE_KEY}_${uid}`);
    } catch (e) {
      console.error('Erreur ajout flashcard maîtrisée:', e);
    }
  },

  // ── Mettre à jour le temps passé ────────────────────────
  addTimeSpent: async (seconds: number): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
      await updateDoc(ref, {
        'progress.totalTimeSpent': increment(seconds),
        updatedAt: serverTimestamp(),
      });
    } catch { /* silencieux */ }
  },
};


// ============================================================
// src/services/storage/cacheService.ts
// Cache local intelligent avec TTL et invalidation
// ============================================================


interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // ms
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  // ── Lire depuis le cache ─────────────────────────────────
  async get<T>(key: string): Promise<T | null> {
    // 1. Mémoire d'abord
    const memEntry = this.memoryCache.get(key);
    if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
      return memEntry.data as T;
    }

    // 2. AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(`cache_${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > entry.ttl) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      // Remettre en mémoire
      this.memoryCache.set(key, entry);
      return entry.data;
    } catch {
      return null;
    }
  }

  // ── Écrire dans le cache ─────────────────────────────────
  async set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    this.memoryCache.set(key, entry);

    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.error('Erreur écriture cache:', e);
    }
  }

  // ── Invalider une entrée ─────────────────────────────────
  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await AsyncStorage.removeItem(`cache_${key}`);
  }

  // ── Invalider par préfixe ────────────────────────────────
  async invalidatePrefix(prefix: string): Promise<void> {
    // Vider la mémoire
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) this.memoryCache.delete(key);
    }

    // Vider AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const toRemove = allKeys.filter(k => k.startsWith(`cache_${prefix}`));
      if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    } catch { /* silencieux */ }
  }

  // ── Vider tout le cache ──────────────────────────────────
  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => k.startsWith('cache_'));
      if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
    } catch { /* silencieux */ }
  }

  // ── TTL prédéfinis ───────────────────────────────────────
  static TTL = {
    SHORT: 2 * 60 * 1000,      // 2 min
    MEDIUM: 15 * 60 * 1000,    // 15 min
    LONG: 60 * 60 * 1000,      // 1h
    DAY: 24 * 60 * 60 * 1000,  // 24h
    WEEK: 7 * 24 * 60 * 60 * 1000, // 7 jours
  };
}

export const cacheService = new CacheService();
