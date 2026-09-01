// ============================================================
// src/hooks/useNotifications.ts
// Hook notifications — permissions, planification, paramètres
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import {
  requestPermissions,
  loadSettings,
  saveSettings,
  scheduleDailyReminder,
  scheduleStreakAlert,
  cancelNotification,
  cancelAllNotifications,
  addNotificationListener,
} from '@/services/notifications';
import { useUserStore } from '@/store/userStore';
import { storage } from '@/utils/storage';

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'not_asked';

interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;
  streakAlert: boolean;
  weeklyReport: boolean;
  promotions: boolean;
}

export function useNotifications() {
  const { user } = useUserStore();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminder: true,
    dailyReminderTime: '09:00',
    streakAlert: true,
    weeklyReport: true,
    promotions: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ── Charger les paramètres ────────────────────────────────
  useEffect(() => {
    async function init() {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(
        status === 'granted' ? 'granted'
        : status === 'denied' ? 'denied'
        : 'not_asked'
      );

      const saved = await loadSettings();
      setSettings(prev => ({ ...prev, ...saved }));
      setIsLoading(false);
    }
    init();
  }, []);

  // ── Demander les permissions ──────────────────────────────
  const askPermissions = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermissions();
    setPermissionStatus(granted ? 'granted' : 'denied');
    await storage.set('notification_permission_asked', true);
    return granted;
  }, []);

  // ── Mettre à jour un paramètre ────────────────────────────
  const updateSetting = useCallback(async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings({ [key]: value });

    if (permissionStatus !== 'granted') return;

    // Appliquer immédiatement
    switch (key) {
      case 'dailyReminder':
        if (value) {
          await scheduleDailyReminder(settings.dailyReminderTime);
        } else {
          await cancelNotification('daily_reminder');
        }
        break;
      case 'dailyReminderTime':
        if (settings.dailyReminder) {
          await scheduleDailyReminder(value as string);
        }
        break;
      case 'streakAlert':
        if (value && (user?.streak ?? 0) > 0) {
          await scheduleStreakAlert(user?.streak ?? 0);
        } else {
          await cancelNotification('streak_alert');
        }
        break;
    }
  }, [settings, permissionStatus, user]);

  // ── Tout désactiver ──────────────────────────────────────
  const disableAll = useCallback(async () => {
    await cancelAllNotifications();
    const allOff: NotificationSettings = {
      dailyReminder: false,
      dailyReminderTime: '09:00',
      streakAlert: false,
      weeklyReport: false,
      promotions: false,
    };
    setSettings(allOff);
    await saveSettings(allOff);
  }, []);

  // ── Configurer toutes les notifications ──────────────────
  const setupAll = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      const granted = await askPermissions();
      if (!granted) return false;
    }

    if (settings.dailyReminder) {
      await scheduleDailyReminder(settings.dailyReminderTime);
    }
    if (settings.streakAlert && (user?.streak ?? 0) > 0) {
      await scheduleStreakAlert(user?.streak ?? 0);
    }
    return true;
  }, [settings, permissionStatus, user, askPermissions]);

  // ── Écouter les notifications ─────────────────────────────
  const listenForNotifications = useCallback((
    onReceive: (n: Notifications.Notification) => void,
    onResponse: (r: Notifications.NotificationResponse) => void,
  ) => {
    return addNotificationListener(onReceive, onResponse);
  }, []);

  const hasPermission = permissionStatus === 'granted';
  const hasAsked = permissionStatus !== 'not_asked' && permissionStatus !== 'unknown';

  return {
    settings,
    permissionStatus,
    hasPermission,
    hasAsked,
    isLoading,
    updateSetting,
    askPermissions,
    disableAll,
    setupAll,
    listenForNotifications,
  };
}


// ============================================================
// src/hooks/useProgress.ts
// Hook de suivi de progression globale
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';
import { progressService } from '@/services/firebase/progressService';
import { cacheService } from '@/services/storage/cacheService';
import { auth } from '@/services/firebase/config';

interface ProgressStats {
  lessonsCompleted: number;
  totalLessons: number;
  lessonsPercent: number;
  flashcardsMastered: number;
  totalFlashcards: number;
  flashcardsPercent: number;
  modulesCompleted: number;
  totalModules: number;
  modulesPercent: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpent: number;
  level: number;
  xpToNextLevel: number;
}

const TOTAL_LESSONS = 50;
const TOTAL_FLASHCARDS = 250;
const TOTAL_MODULES = 10;

export function useProgress() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Calculer les stats depuis le store ───────────────────
  const computeStats = useCallback((): ProgressStats => {
    const p = user?.progress;
    const lessonsCompleted = p?.totalLessonsCompleted ?? 0;
    const flashcardsMastered = p?.masteredFlashcards.length ?? 0;
    const modulesCompleted = p?.completedModules.length ?? 0;

    return {
      lessonsCompleted,
      totalLessons: TOTAL_LESSONS,
      lessonsPercent: Math.round((lessonsCompleted / TOTAL_LESSONS) * 100),
      flashcardsMastered,
      totalFlashcards: TOTAL_FLASHCARDS,
      flashcardsPercent: Math.round((flashcardsMastered / TOTAL_FLASHCARDS) * 100),
      modulesCompleted,
      totalModules: TOTAL_MODULES,
      modulesPercent: Math.round((modulesCompleted / TOTAL_MODULES) * 100),
      totalXP: user?.xp ?? 0,
      currentStreak: user?.streak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      totalTimeSpent: p?.totalTimeSpent ?? 0,
      level: user?.level ?? 1,
      xpToNextLevel: user?.xpToNextLevel ?? 100,
    };
  }, [user]);

  // ── Charger et synchroniser ──────────────────────────────
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const cacheKey = `progress_${auth.currentUser?.uid}`;
      const cached = await cacheService.get<ProgressStats>(cacheKey);

      if (cached) {
        setStats(cached);
      } else {
        const computed = computeStats();
        setStats(computed);
        await cacheService.set(cacheKey, computed, cacheService.TTL.MEDIUM);
      }
      setLastUpdated(new Date());
    } catch (e) {
      setStats(computeStats());
    } finally {
      setIsLoading(false);
    }
  }, [computeStats]);

  useEffect(() => {
    refresh();
  }, [user?.xp, user?.streak, user?.progress.totalLessonsCompleted]);

  // ── Marquer une leçon ────────────────────────────────────
  const markLessonComplete = useCallback(async (lessonId: string, xpEarned: number) => {
    await progressService.markLessonComplete(lessonId, xpEarned);
    await cacheService.invalidate(`progress_${auth.currentUser?.uid}`);
    await refresh();
  }, [refresh]);

  // ── Marquer un mot maîtrisé ──────────────────────────────
  const markFlashcardMastered = useCallback(async (flashcardId: string) => {
    await progressService.addMasteredFlashcard(flashcardId);
    await cacheService.invalidate(`progress_${auth.currentUser?.uid}`);
    await refresh();
  }, [refresh]);

  // ── Temps passé ──────────────────────────────────────────
  const recordTimeSpent = useCallback(async (seconds: number) => {
    await progressService.addTimeSpent(seconds);
  }, []);

  // ── Niveau de maîtrise global ────────────────────────────
  const getOverallMastery = useCallback((): 'beginner' | 'elementary' | 'intermediate' | 'advanced' => {
    if (!stats) return 'beginner';
    const avgPercent = (stats.lessonsPercent + stats.flashcardsPercent) / 2;
    if (avgPercent >= 75) return 'advanced';
    if (avgPercent >= 50) return 'intermediate';
    if (avgPercent >= 25) return 'elementary';
    return 'beginner';
  }, [stats]);

  // ── Prochaine étape recommandée ──────────────────────────
  const getNextMilestone = useCallback((): { label: string; current: number; target: number; type: string } | null => {
    if (!stats) return null;

    const milestones = [
      { label: 'Leçons', current: stats.lessonsCompleted, target: 5, type: 'lesson' },
      { label: 'Leçons', current: stats.lessonsCompleted, target: 10, type: 'lesson' },
      { label: 'Leçons', current: stats.lessonsCompleted, target: 25, type: 'lesson' },
      { label: 'Mots appris', current: stats.flashcardsMastered, target: 50, type: 'flashcard' },
      { label: 'Mots appris', current: stats.flashcardsMastered, target: 100, type: 'flashcard' },
      { label: 'Jours de série', current: stats.currentStreak, target: 7, type: 'streak' },
      { label: 'Jours de série', current: stats.currentStreak, target: 30, type: 'streak' },
    ];

    return milestones.find(m => m.current < m.target) ?? null;
  }, [stats]);

  return {
    stats,
    isLoading,
    lastUpdated,
    refresh,
    markLessonComplete,
    markFlashcardMastered,
    recordTimeSpent,
    getOverallMastery,
    getNextMilestone,
    isCompleted: (stats?.lessonsPercent ?? 0) >= 100,
  };
}


// ============================================================
// src/hooks/useDarkMode.ts
// Hook thème sombre — détection + préférence utilisateur
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { storage } from '@/utils/storage';
import { lightTheme, darkTheme, AppTheme } from '@/config/theme';

type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'user_theme_mode';

export function useDarkMode() {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getString(STORAGE_KEY, 'system').then(saved => {
      setMode(saved as ThemeMode);
      setIsLoaded(true);
    });
  }, []);

  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode);
    await storage.set(STORAGE_KEY, newMode);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const theme: AppTheme = isDark ? darkTheme : lightTheme;

  return {
    mode,
    isDark,
    theme,
    isLoaded,
    setThemeMode,
    toggleTheme: () => setThemeMode(isDark ? 'light' : 'dark'),
  };
}
