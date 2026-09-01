// ============================================================
// src/__tests__/setup.ts
// Configuration des mocks pour les tests
// ============================================================

// ── Mock AsyncStorage ─────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ── Mock Expo Speech ──────────────────────────────────────────
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// ── Mock Expo Notifications ───────────────────────────────────
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
}));

// ── Mock Firebase ─────────────────────────────────────────────
jest.mock('@/services/firebase/config', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-uid', isAnonymous: true },
  },
  storage: {},
}));

jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-uid', isAnonymous: true });
    return jest.fn();
  }),
  signOut: jest.fn().mockResolvedValue(undefined),
  getAuth: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [], empty: true }),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn(v => v),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

// ── Mock Expo Router ──────────────────────────────────────────
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ id: 'test-id' })),
  useSegments: jest.fn(() => []),
}));

// ── Mock Expo Constants ───────────────────────────────────────
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.0.0',
      extra: {
        APP_ENV: 'test',
      },
    },
  },
}));

// ── Mock react-native-purchases (RevenueCat) ──────────────────
jest.mock('react-native-purchases', () => ({
  default: {
    configure: jest.fn().mockResolvedValue(undefined),
    logIn: jest.fn().mockResolvedValue(undefined),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
    }),
    getCustomerInfo: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
    }),
    addCustomerInfoUpdateListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    setLogLevel: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'debug' },
  PURCHASES_ERROR_CODE: {},
}));

// ── Mock react-native-google-mobile-ads ───────────────────────
jest.mock('react-native-google-mobile-ads', () => ({
  RewardedAd: {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(),
      addAdEventListener: jest.fn(),
    })),
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(),
      addAdEventListener: jest.fn(),
    })),
  },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' },
  TestIds: {
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  },
}));

// ── Mock Expo AV ──────────────────────────────────────────────
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setPositionAsync: jest.fn(),
          setRateAsync: jest.fn(),
          setOnPlaybackStatusUpdate: jest.fn(),
        },
        status: { isLoaded: true },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

// ── Mock Zustand pour les tests ───────────────────────────────
const mockUser = {
  id: 'test-uid',
  email: null,
  displayName: 'Apprenant Test',
  photoURL: null,
  level: 1,
  xp: 150,
  xpToNextLevel: 150,
  streak: 3,
  longestStreak: 7,
  hearts: 5,
  maxHearts: 5,
  premium: false,
  premiumExpiresAt: null,
  language: 'fr' as const,
  targetLanguage: 'pl' as const,
  dailyGoal: 10,
  achievements: ['first_lesson'],
  progress: {
    completedLessons: ['lesson_1_1'],
    completedModules: [],
    completedQuizzes: [],
    masteredFlashcards: [],
    totalXpEarned: 150,
    totalLessonsCompleted: 1,
    totalTimeSpent: 300,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
};

jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(() => ({
    user: mockUser,
    subscription: null,
    isLoading: false,
    isOnboarded: true,
    setUser: jest.fn(),
    updateUser: jest.fn(),
    setSubscription: jest.fn(),
    addXP: jest.fn(),
    updateStreak: jest.fn(),
    loseHeart: jest.fn(),
    refillHearts: jest.fn(),
    setOnboarded: jest.fn(),
    setLoading: jest.fn(),
    reset: jest.fn(),
  })),
}));

// ── Suppression des warnings console pendant les tests ────────
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.('Warning:') ||
      args[0]?.includes?.('act(')
    ) return;
    originalConsoleError(...args);
  };
  console.warn = (...args: any[]) => {
    if (args[0]?.includes?.('Warning:')) return;
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
