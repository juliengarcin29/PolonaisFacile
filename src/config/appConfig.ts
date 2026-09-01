// ============================================================
// src/config/appConfig.ts
// Configuration centralisée — variables, feature flags, env
// ============================================================

import Constants from 'expo-constants';

// ── Environnement ─────────────────────────────────────────────
type AppEnv = 'development' | 'preview' | 'production';

const ENV = (Constants.expoConfig?.extra?.APP_ENV ?? 'development') as AppEnv;

export const IS_DEV = ENV === 'development';
export const IS_PREVIEW = ENV === 'preview';
export const IS_PROD = ENV === 'production';

// ── Configuration Firebase ────────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY ?? 'VOTRE_API_KEY',
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN ?? 'votre-projet.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID ?? 'votre-projet',
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET ?? 'votre-projet.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID ?? '000000000',
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID ?? '1:000000000:web:000000000',
};

// ── Configuration RevenueCat ──────────────────────────────────
export const REVENUECAT_CONFIG = {
  androidKey: Constants.expoConfig?.extra?.REVENUECAT_ANDROID_KEY ?? 'appl_VOTRE_CLE',
  iosKey: Constants.expoConfig?.extra?.REVENUECAT_IOS_KEY ?? 'appl_VOTRE_CLE',
};

// ── Configuration AdMob ───────────────────────────────────────
export const ADMOB_CONFIG = {
  androidAppId: Constants.expoConfig?.extra?.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: Constants.expoConfig?.extra?.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511',
  rewardedAndroid: IS_DEV
    ? 'ca-app-pub-3940256099942544/5224354917'
    : (Constants.expoConfig?.extra?.ADMOB_REWARDED_ANDROID ?? ''),
  rewardedIos: IS_DEV
    ? 'ca-app-pub-3940256099942544/1712485313'
    : (Constants.expoConfig?.extra?.ADMOB_REWARDED_IOS ?? ''),
  interstitialAndroid: IS_DEV
    ? 'ca-app-pub-3940256099942544/1033173712'
    : (Constants.expoConfig?.extra?.ADMOB_INTERSTITIAL_ANDROID ?? ''),
  interstitialIos: IS_DEV
    ? 'ca-app-pub-3940256099942544/4411468910'
    : (Constants.expoConfig?.extra?.ADMOB_INTERSTITIAL_IOS ?? ''),
};

// ── Feature Flags ─────────────────────────────────────────────
export const FEATURES = {
  // Fonctionnalités activées
  CONVERSATION_AI: true,
  DICTATIONS: true,
  DIALOGUES: true,
  STATS_ADVANCED: true,
  WEEKLY_REVIEW: true,
  PUSH_NOTIFICATIONS: true,
  REWARDED_ADS: true,
  INTERSTITIAL_ADS: true,

  // Fonctionnalités en développement
  LEADERBOARD: false,
  SOCIAL_SHARING: false,
  VOICE_RECORDING: false,
  OFFLINE_DOWNLOAD: false,

  // Debug
  SHOW_DEV_MENU: IS_DEV,
  MOCK_PREMIUM: IS_DEV && false, // Mettre true pour tester Premium en dev
  SKIP_ONBOARDING: IS_DEV && false,
};

// ── Limites du plan gratuit ───────────────────────────────────
export const FREE_LIMITS = {
  LESSONS: 10,
  FLASHCARDS: 50,
  QUIZZES: 3,
  MODULES: 3,
  DIALOGUES: 2,
  DICTATIONS: 2,
  HEARTS: 5,
  HEARTS_REFILL_MINUTES: 30,
};

// ── Configuration gamification ────────────────────────────────
export const GAMIFICATION_CONFIG = {
  XP_PER_EXERCISE: 10,
  XP_PER_LESSON: 50,
  XP_PER_QUIZ: 100,
  XP_PER_PERFECT_LESSON: 150,
  XP_PER_DIALOGUE: 80,
  XP_PER_DICTATION: 100,
  XP_PER_CONVERSATION_TURN: 15,
  XP_DAILY_GOAL_BONUS: 50,
  XP_STREAK_WEEKLY_BONUS: 100,
  STREAK_FREEZE_MAX: 2,
  LEVELS: [
    { level: 1,  xpRequired: 0,     title: 'Débutant' },
    { level: 2,  xpRequired: 100,   title: 'Curieux' },
    { level: 3,  xpRequired: 300,   title: 'Apprenant' },
    { level: 4,  xpRequired: 600,   title: 'Progressant' },
    { level: 5,  xpRequired: 1000,  title: 'Assidu' },
    { level: 6,  xpRequired: 1500,  title: 'Sérieux' },
    { level: 7,  xpRequired: 2200,  title: 'Expert' },
    { level: 8,  xpRequired: 3000,  title: 'Maître' },
    { level: 9,  xpRequired: 4000,  title: 'Champion' },
    { level: 10, xpRequired: 5500,  title: 'Légende' },
  ],
};

// ── Configuration abonnements ─────────────────────────────────
export const SUBSCRIPTION_CONFIG = {
  TRIAL_DAYS: 7,
  PRODUCTS: {
    MONTHLY: 'premium_monthly',
    YEARLY: 'premium_yearly',
    LIFETIME: 'premium_lifetime',
  },
  PRICES: {
    MONTHLY: '4,99 €',
    YEARLY: '29,99 €',
    LIFETIME: '79,99 €',
    MONTHLY_EQUIVALENT_YEARLY: '2,50 €',
    SAVINGS_YEARLY: '50%',
  },
  ENTITLEMENT: 'premium',
};

// ── Configuration notifications ───────────────────────────────
export const NOTIFICATION_CONFIG = {
  DEFAULT_REMINDER_HOUR: 9,
  DEFAULT_REMINDER_MINUTE: 0,
  STREAK_ALERT_HOUR: 20,
  STREAK_ALERT_MINUTE: 0,
  REACTIVATION_DAYS: 3,
  EXPO_PROJECT_ID: Constants.expoConfig?.extra?.EXPO_PROJECT_ID ?? '',
};

// ── URLs et liens ─────────────────────────────────────────────
export const URLS = {
  PRIVACY_POLICY: 'https://votresite.com/privacy',
  TERMS_OF_SERVICE: 'https://votresite.com/terms',
  SUPPORT_EMAIL: 'support@polonaisfacile.app',
  WEBSITE: 'https://polonaisfacile.app',
  PLAY_STORE: 'https://play.google.com/store/apps/details?id=com.votreapp.polonaisfacile',
  APP_STORE: 'https://apps.apple.com/app/polonais-facile/id000000000',
};

// ── Méta-informations ─────────────────────────────────────────
export const APP_META = {
  NAME: 'Polonais Facile',
  BUNDLE_ID: 'com.votreapp.polonaisfacile',
  VERSION: Constants.expoConfig?.version ?? '1.0.0',
  BUILD_NUMBER: Constants.expoConfig?.ios?.buildNumber ?? '1',
  ENV,
};

// ── app.json extra (à ajouter dans app.json) ─────────────────
/*
"extra": {
  "APP_ENV": "development",
  "FIREBASE_API_KEY": "...",
  "FIREBASE_AUTH_DOMAIN": "...",
  "FIREBASE_PROJECT_ID": "...",
  "FIREBASE_STORAGE_BUCKET": "...",
  "FIREBASE_MESSAGING_SENDER_ID": "...",
  "FIREBASE_APP_ID": "...",
  "REVENUECAT_ANDROID_KEY": "...",
  "REVENUECAT_IOS_KEY": "...",
  "ADMOB_ANDROID_APP_ID": "...",
  "ADMOB_IOS_APP_ID": "...",
  "ADMOB_REWARDED_ANDROID": "...",
  "ADMOB_REWARDED_IOS": "...",
  "ADMOB_INTERSTITIAL_ANDROID": "...",
  "ADMOB_INTERSTITIAL_IOS": "...",
  "EXPO_PROJECT_ID": "...",
  "eas": {
    "projectId": "VOTRE_EXPO_PROJECT_ID"
  }
}
*/
