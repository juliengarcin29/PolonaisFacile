// ============================================================
// src/constants/index.ts
// ============================================================

export const COLORS = {
  // Palette inspirée du drapeau polonais
  primary: '#DC143C',       // Rouge polonais
  primaryDark: '#A50E2D',
  primaryLight: '#FF4D6D',
  white: '#FFFFFF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F5',

  // Texte
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // États
  success: '#22C55E',
  successLight: '#DCFCE7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Gamification
  xpGold: '#F59E0B',
  streakOrange: '#FF6B35',
  heartRed: '#EF4444',
  premiumGold: '#D4AF37',

  // Dark mode
  darkBg: '#0F172A',
  darkSurface: '#1E293B',
  darkBorder: '#334155',
} as const;

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const GAMIFICATION = {
  XP_PER_EXERCISE: 10,
  XP_PER_LESSON: 50,
  XP_PER_QUIZ: 100,
  XP_PER_PERFECT: 150,       // leçon sans erreur
  HEARTS_MAX: 5,
  HEARTS_REFILL_MINUTES: 30,
  STREAK_FREEZE_MAX: 2,
  LEVELS: [
    { level: 1,  xpRequired: 0 },
    { level: 2,  xpRequired: 100 },
    { level: 3,  xpRequired: 300 },
    { level: 4,  xpRequired: 600 },
    { level: 5,  xpRequired: 1000 },
    { level: 6,  xpRequired: 1500 },
    { level: 7,  xpRequired: 2200 },
    { level: 8,  xpRequired: 3000 },
    { level: 9,  xpRequired: 4000 },
    { level: 10, xpRequired: 5500 },
  ],
} as const;

export const SUBSCRIPTION = {
  MONTHLY_PRICE: '4,99 €',
  YEARLY_PRICE: '29,99 €',
  LIFETIME_PRICE: '79,99 €',
  TRIAL_DAYS: 7,
  REVENUE_CAT_IDS: {
    MONTHLY: 'premium_monthly',
    YEARLY: 'premium_yearly',
    LIFETIME: 'premium_lifetime',
  },
} as const;

export const CONTENT_LIMITS = {
  FREE_LESSONS: 10,
  FREE_FLASHCARDS: 50,
  FREE_QUIZZES: 5,
  FREE_MODULES: 2,
} as const;

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  LESSONS: 'lessons',
  MODULES: 'modules',
  QUIZZES: 'quizzes',
  FLASHCARDS: 'flashcards',
  STREAKS: 'streaks',
  ACHIEVEMENTS: 'achievements',
  SUBSCRIPTIONS: 'subscriptions',
  PROGRESS: 'progress',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
} as const;

export const ADMOB = {
  REWARDED_AD_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917' // ID de test Google
    : 'VOTRE_ID_ADMOB_REWARDED',
  INTERSTITIAL_AD_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712'
    : 'VOTRE_ID_ADMOB_INTERSTITIAL',
  MAX_INTERSTITIAL_PER_HOUR: 3,
  INTERSTITIAL_MIN_INTERVAL_MINUTES: 10,
} as const;

export const ONBOARDING_GOALS = [
  { id: 'travel',      labelKey: 'onboarding.goal.travel',    emoji: '✈️' },
  { id: 'family',      labelKey: 'onboarding.goal.family',    emoji: '👨‍👩‍👧' },
  { id: 'culture',     labelKey: 'onboarding.goal.culture',   emoji: '🎭' },
  { id: 'work',        labelKey: 'onboarding.goal.work',      emoji: '💼' },
  { id: 'study',       labelKey: 'onboarding.goal.study',     emoji: '📚' },
  { id: 'fun',         labelKey: 'onboarding.goal.fun',       emoji: '😊' },
] as const;

export const DAILY_GOALS = [
  { minutes: 5,  labelKey: 'onboarding.time.casual',  emoji: '🌿', xpBonus: 0 },
  { minutes: 10, labelKey: 'onboarding.time.regular',     emoji: '⭐', xpBonus: 10 },
  { minutes: 15, labelKey: 'onboarding.time.serious',      emoji: '🔥', xpBonus: 20 },
  { minutes: 20, labelKey: 'onboarding.time.intensive',     emoji: '💪', xpBonus: 30 },
] as const;

export const LEVELS_LABELS = [
  { id: 'absolute_beginner', labelKey: 'onboarding.level.absolute_beginner', descriptionKey: 'onboarding.level.absolute_beginner_desc' },
  { id: 'beginner',          labelKey: 'onboarding.level.beginner',       descriptionKey: 'onboarding.level.beginner_desc' },
  { id: 'intermediate',      labelKey: 'onboarding.level.intermediate',  descriptionKey: 'onboarding.level.intermediate_desc' },
] as const;
