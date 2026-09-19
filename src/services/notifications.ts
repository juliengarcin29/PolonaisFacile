// ============================================================
// src/services/notifications.ts
// Notifications push — rappels quotidiens, streak, premium
// ============================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/config/i18n';

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

  console.log('[Notifications] Vérification des permissions...');
  const { status: existing } = await Notifications.getPermissionsAsync();
  console.log('[Notifications] Permission actuelle:', existing);
  if (existing === 'granted') return true;

  console.log('[Notifications] Demande de nouvelle permission...');
  const { status } = await Notifications.requestPermissionsAsync();
  console.log('[Notifications] Résultat de la demande:', status);
  return status === 'granted';
}

// ── Obtenir le token push ────────────────────────────────────
export async function getPushToken(): Promise<string | null> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'd3ea15f2-e0c2-4970-84ee-0d59791a3a71',
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

  const trigger = {
    type: 'daily',
    hour,
    minute,
  };

  console.log('[Notifications] Planification du rappel quotidien...');
  console.log('[Notifications] Trigger utilisé:', JSON.stringify(trigger));

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_reminder',
      content: {
        title: i18n.t('notifications.daily_reminder.title'),
        body: i18n.t('notifications.daily_reminder.body'),
        data: { type: 'daily_reminder' },
        sound: true,
      },
      trigger: trigger as any,
    });
    console.log('[Notifications] Rappel planifié avec succès !');
  } catch (e) {
    console.error('[Notifications] Erreur lors de la planification:', e);
  }
}

// ── Alerte de streak en danger ────────────────────────────────
export async function scheduleStreakAlert(streakCount: number): Promise<void> {
  await cancelNotification('streak_alert');

  if (streakCount === 0) return;

  // Alerte à 20h si pas d'activité ce jour
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'streak_alert',
      content: {
        title: i18n.t('notifications.streak_alert.title', { count: streakCount }),
        body: i18n.t('notifications.streak_alert.body'),
        data: { type: 'streak_alert', streak: streakCount },
        sound: true,
      },
      trigger: {
        type: 'daily',
        hour: 20,
        minute: 0,
      } as any,
    });
  } catch (e) {
    console.error('[Notifications] Erreur planification alerte streak:', e);
  }
}

// ── Notification de réactivation (J+3 sans activité) ─────────
export async function scheduleReactivation(): Promise<void> {
  await cancelNotification('reactivation');

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'reactivation',
      content: {
        title: i18n.t('notifications.reactivation.title'),
        body: i18n.t('notifications.reactivation.body'),
        data: { type: 'reactivation' },
      },
      trigger: {
        type: 'timeInterval',
        seconds: 3 * 24 * 60 * 60, // 3 jours
        repeats: false,
      } as any,
    });
  } catch (e) {
    console.error('[Notifications] Erreur planification réactivation:', e);
  }
}

// ── Notification de succès / badge ───────────────────────────
export async function sendAchievementNotification(
  title: string,
  body: string,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || i18n.t('notifications.achievement.title'),
        body: body || i18n.t('notifications.achievement.body'),
        data: { type: 'achievement' },
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[Notifications] Erreur notification immédiate:', e);
  }
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

  // On planifie toujours le rappel quotidien si activé, même sans streak
  if (settings.dailyReminder) {
    await scheduleDailyReminder(reminderTime);
  }

  // Alerte de streak uniquement si l'utilisateur a commencé une série
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
