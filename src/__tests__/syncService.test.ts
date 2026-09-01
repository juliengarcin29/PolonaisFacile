// ============================================================
// src/__tests__/syncService.test.ts
// Tests unitaires — mutation queue offline et merge Firestore
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Mocks ─────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      xp: 100,
      streak: 3,
      longestStreak: 7,
      achievements: ['first_lesson'],
      progress: {
        completedLessons: ['lesson_1_1'],
        masteredFlashcards: ['fc_1'],
        completedModules: [],
        totalXpEarned: 100,
        totalLessonsCompleted: 1,
        totalTimeSpent: 300,
      },
      updatedAt: { toMillis: () => Date.now() - 10000 },
    }),
  }),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn(v => v),
  Timestamp: { fromDate: jest.fn() },
}));

jest.mock('../services/firebase/config', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } },
}));

// ── Import après les mocks ───────────────────────────────────
import {
  enqueueMutation,
  flushQueue,
  pullFromFirestore,
  syncActions,
} from '../services/firebase/syncService';

const QUEUE_KEY = 'offline_mutation_queue';

describe('Mutation Queue — Offline Sync', () => {

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('enqueueMutation', () => {
    it('ajoute une mutation à la queue AsyncStorage', async () => {
      await enqueueMutation('ADD_XP', { amount: 50 });
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = JSON.parse(raw!);
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('ADD_XP');
      expect(queue[0].payload.amount).toBe(50);
    });

    it('chaque mutation a un id unique', async () => {
      await enqueueMutation('ADD_XP', { amount: 10 });
      await enqueueMutation('ADD_XP', { amount: 20 });
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = JSON.parse(raw!);
      expect(queue[0].id).not.toBe(queue[1].id);
    });

    it('stocke le timestamp createdAt', async () => {
      const before = Date.now();
      await enqueueMutation('ADD_XP', { amount: 10 });
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const [mutation] = JSON.parse(raw!);
      expect(mutation.createdAt).toBeGreaterThanOrEqual(before);
      expect(mutation.retries).toBe(0);
    });

    it('accumule plusieurs mutations dans l\'ordre', async () => {
      await enqueueMutation('ADD_XP', { amount: 10 });
      await enqueueMutation('COMPLETE_LESSON', { lessonId: 'l1', xpEarned: 50 });
      await enqueueMutation('MASTER_FLASHCARD', { flashcardId: 'fc_1' });
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = JSON.parse(raw!);
      expect(queue).toHaveLength(3);
      expect(queue[0].type).toBe('ADD_XP');
      expect(queue[1].type).toBe('COMPLETE_LESSON');
      expect(queue[2].type).toBe('MASTER_FLASHCARD');
    });
  });

  describe('syncActions helpers', () => {
    it('syncActions.completeLesson enqueue correctement', async () => {
      await syncActions.completeLesson('lesson_1_2', 80);
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const [m] = JSON.parse(raw!);
      expect(m.type).toBe('COMPLETE_LESSON');
      expect(m.payload.lessonId).toBe('lesson_1_2');
      expect(m.payload.xpEarned).toBe(80);
    });

    it('syncActions.updateStreak enqueue correctement', async () => {
      await syncActions.updateStreak(5, 10);
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const [m] = JSON.parse(raw!);
      expect(m.type).toBe('UPDATE_STREAK');
      expect(m.payload.streak).toBe(5);
      expect(m.payload.longestStreak).toBe(10);
    });

    it('syncActions.unlockAchievement enqueue correctement', async () => {
      await syncActions.unlockAchievement('badge_7_days');
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const [m] = JSON.parse(raw!);
      expect(m.type).toBe('UNLOCK_ACHIEVEMENT');
      expect(m.payload.achievementId).toBe('badge_7_days');
    });
  });

  describe('flushQueue', () => {
    it('queue vide → 0 flushed, 0 failed', async () => {
      const result = await flushQueue();
      expect(result.flushed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.remaining).toBe(0);
    });

    it('flush réussi vide la queue', async () => {
      await enqueueMutation('ADD_XP', { amount: 50 });
      const result = await flushQueue();
      expect(result.flushed).toBeGreaterThan(0);
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = JSON.parse(raw ?? '[]');
      expect(queue).toHaveLength(0);
    });

    it('mutations trop anciennes (>7j) sont abandonnées silencieusement', async () => {
      const oldMutation = {
        id: 'old_1',
        type: 'ADD_XP',
        payload: { amount: 10 },
        createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 jours
        retries: 0,
      };
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([oldMutation]));
      const result = await flushQueue();
      expect(result.failed).toBe(1);
      expect(result.flushed).toBe(0);
    });

    it('mutations avec trop de retries sont abandonnées', async () => {
      const exhausted = {
        id: 'ex_1',
        type: 'ADD_XP',
        payload: { amount: 10 },
        createdAt: Date.now(),
        retries: 5, // MAX_RETRIES
      };
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([exhausted]));
      const result = await flushQueue();
      expect(result.failed).toBe(1);
      expect(result.flushed).toBe(0);
      // Elle doit être retirée de la queue
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      expect(JSON.parse(raw ?? '[]')).toHaveLength(0);
    });
  });

  describe('pullFromFirestore — merge anti-régression', () => {
    it('retourne les données Firestore si local est vide', async () => {
      const result = await pullFromFirestore();
      expect(result).not.toBeNull();
      expect(result?.xp).toBe(100);
    });

    it('fusionne en prenant le MAX de xp local vs remote', async () => {
      const localData = {
        xp: 200, // local plus élevé
        streak: 5,
        longestStreak: 7,
        achievements: ['first_lesson'],
        progress: {
          completedLessons: ['lesson_1_1'],
          masteredFlashcards: ['fc_1'],
          completedModules: [],
          totalXpEarned: 200,
          totalLessonsCompleted: 2,
          totalTimeSpent: 600,
        },
        updatedAt: Date.now() - 5000,
      };
      await AsyncStorage.setItem('user_test-uid', JSON.stringify(localData));
      const result = await pullFromFirestore();
      // Doit prendre le max (200 local > 100 remote)
      expect(result?.xp).toBe(200);
    });

    it('union des completedLessons : jamais supprimer une leçon locale', async () => {
      const localData = {
        xp: 50,
        streak: 1,
        longestStreak: 1,
        achievements: [],
        progress: {
          completedLessons: ['lesson_1_1', 'lesson_1_2'], // 1_2 existe seulement en local
          masteredFlashcards: [],
          completedModules: [],
          totalXpEarned: 50,
          totalLessonsCompleted: 2,
          totalTimeSpent: 120,
        },
        updatedAt: Date.now() - 20000,
      };
      await AsyncStorage.setItem('user_test-uid', JSON.stringify(localData));
      const result = await pullFromFirestore();
      // lesson_1_1 vient du remote, lesson_1_2 vient du local → les deux présents
      expect(result?.progress?.completedLessons).toContain('lesson_1_1');
      expect(result?.progress?.completedLessons).toContain('lesson_1_2');
    });

    it('si connexion coupée → retourne le cache local sans planter', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockRejectedValueOnce(new Error('network error'));
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValueOnce(new Error('network error'));

      const localData = { xp: 75, progress: { completedLessons: ['lesson_1_1'] } };
      await AsyncStorage.setItem('user_test-uid', JSON.stringify(localData));

      const result = await pullFromFirestore();
      // Doit retourner le local plutôt que crasher
      expect(result).not.toBeNull();
    });
  });
});
