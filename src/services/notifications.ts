// ============================================================
// src/services/notifications.ts
// Notifications push — rappels quotidiens, streak, premium
// ============================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notification_settings';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Types ────────────────────────────────────────────────────
interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;   // "HH:MM"
  streakAlert: boolean;
  weeklyReport: boolean;
  promotions: boolean;
  pushToken: string | null;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: true,
  dailyReminderTime: '09:00',
  streakAlert: true,
  weeklyReport: true,
  promotions: false,
  pushToken: null,
};

// ── Demander les permissions ─────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications : simulateur détecté, skip');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Obtenir le token push ────────────────────────────────────
export async function getPushToken(): Promise<string | null> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'VOTRE_EXPO_PROJECT_ID', // À remplacer avec votre ID Expo
    });
    return token;
  } catch (e) {
    console.error('Erreur token push:', e);
    return null;
  }
}

// ── Charger / sauvegarder les paramètres ─────────────────────
export async function loadSettings(): Promise<NotificationSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
  const current = await loadSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ── Planifier le rappel quotidien ────────────────────────────
export async function scheduleDailyReminder(time: string = '09:00'): Promise<void> {
  await cancelNotification('daily_reminder');

  const [hour, minute] = time.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily_reminder',
    content: {
      title: '🇵🇱 Votre leçon vous attend !',
      body: 'Quelques minutes de polonais pour garder votre série.',
      data: { type: 'daily_reminder' },
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}

// ── Alerte de streak en danger ────────────────────────────────
export async function scheduleStreakAlert(streakCount: number): Promise<void> {
  await cancelNotification('streak_alert');

  if (streakCount === 0) return;

  // Alerte à 20h si pas d'activité ce jour
  await Notifications.scheduleNotificationAsync({
    identifier: 'streak_alert',
    content: {
      title: `🔥 Série de ${streakCount} jours en danger !`,
      body: 'Faites une leçon rapide pour ne pas perdre votre série.',
      data: { type: 'streak_alert', streak: streakCount },
      sound: true,
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: false,
    } as Notifications.CalendarTriggerInput,
  });
}

// ── Notification de réactivation (J+3 sans activité) ─────────
export async function scheduleReactivation(): Promise<void> {
  await cancelNotification('reactivation');

  await Notifications.scheduleNotificationAsync({
    identifier: 'reactivation',
    content: {
      title: '👋 Ça fait un moment...',
      body: 'Le polonais vous attend ! Une leçon de 5 minutes suffit.',
      data: { type: 'reactivation' },
    },
    trigger: {
      seconds: 3 * 24 * 60 * 60, // 3 jours
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput,
  });
}

// ── Notification de succès / badge ───────────────────────────
export async function sendAchievementNotification(
  title: string,
  body: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🏆 ${title}`,
      body,
      data: { type: 'achievement' },
      sound: true,
    },
    trigger: null, // immédiat
  });
}

// ── Annuler une notification planifiée ───────────────────────
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

// ── Annuler toutes les notifications ─────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Configurer toutes les notifications à l'init ─────────────
export async function setupNotifications(
  streakCount: number,
  reminderTime = '09:00',
): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  const settings = await loadSettings();

  if (settings.dailyReminder) {
    await scheduleDailyReminder(reminderTime);
  }

  if (settings.streakAlert && streakCount > 0) {
    await scheduleStreakAlert(streakCount);
  }

  await scheduleReactivation();
}

// ── Écouter les notifications reçues ─────────────────────────
export function addNotificationListener(
  onReceive: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const receiveSub = Notifications.addNotificationReceivedListener(onReceive);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
