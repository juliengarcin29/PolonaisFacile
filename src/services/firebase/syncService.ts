// ============================================================
// src/services/firebase/syncService.ts
// FIX PRODUCTION — Sync offline robuste avec mutation queue
// Corrige : race conditions, écrasement données locales,
//           perte de progression hors-ligne
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  doc, getDoc,
  increment,
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './config';

// ── Types ─────────────────────────────────────────────────────
type MutationType =
  | 'COMPLETE_LESSON'
  | 'MASTER_FLASHCARD'
  | 'ADD_XP'
  | 'UPDATE_STREAK'
  | 'UNLOCK_ACHIEVEMENT'
  | 'ADD_TIME_SPENT';

interface PendingMutation {
  id: string;           // UUID local unique
  type: MutationType;
  payload: Record<string, unknown>;
  createdAt: number;    // timestamp ms
  retries: number;
}

const QUEUE_KEY = 'offline_mutation_queue';
const LAST_SYNC_KEY = 'last_successful_sync';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// ── Lecture/écriture de la queue ──────────────────────────────
async function readQueue(): Promise<PendingMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[Sync] Erreur écriture queue:', e);
  }
}

// ── Ajouter une mutation à la queue ──────────────────────────
export async function enqueueMutation(
  type: MutationType,
  payload: Record<string, unknown>,
): Promise<void> {
  const mutation: PendingMutation = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
    retries: 0,
  };

  const queue = await readQueue();
  queue.push(mutation);
  await writeQueue(queue);

  // Tenter la sync immédiatement si connecté
  const { isConnected } = await NetInfo.fetch();
  if (isConnected) {
    // fire and forget — ne bloque pas l'UI
    flushQueue().catch(e => console.warn('[Sync] Flush immédiat échoué:', e));
  }
}

// ── Appliquer UNE mutation sur Firestore ─────────────────────
async function applyMutation(
  mutation: PendingMutation,
  uid: string,
): Promise<void> {
  const userRef = doc(db, 'users', uid);

  switch (mutation.type) {
    case 'COMPLETE_LESSON': {
      const { lessonId, xpEarned } = mutation.payload as {
        lessonId: string; xpEarned: number;
      };
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error('User doc missing');
      const data = snap.data();
      const completed: string[] = data?.progress?.completedLessons ?? [];
      if (completed.includes(lessonId)) return; // idempotent
      await updateDoc(userRef, {
        'progress.completedLessons': [...completed, lessonId],
        'progress.totalLessonsCompleted': increment(1),
        'progress.totalXpEarned': increment(xpEarned),
        xp: increment(xpEarned),
        updatedAt: serverTimestamp(),
      });
      break;
    }

    case 'MASTER_FLASHCARD': {
      const { flashcardId } = mutation.payload as { flashcardId: string };
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error('User doc missing');
      const mastered: string[] = snap.data()?.progress?.masteredFlashcards ?? [];
      if (mastered.includes(flashcardId)) return; // idempotent
      await updateDoc(userRef, {
        'progress.masteredFlashcards': [...mastered, flashcardId],
        updatedAt: serverTimestamp(),
      });
      break;
    }

    case 'ADD_XP': {
      const { amount } = mutation.payload as { amount: number };
      await updateDoc(userRef, {
        xp: increment(amount),
        'progress.totalXpEarned': increment(amount),
        updatedAt: serverTimestamp(),
      });
      break;
    }

    case 'UPDATE_STREAK': {
      const { streak, longestStreak } = mutation.payload as {
        streak: number; longestStreak: number;
      };
      // Ne mettre à jour que si la valeur est plus grande (anti-régression)
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error('User doc missing');
      const current = snap.data()?.streak ?? 0;
      if (streak < current) return; // refuse l'écrasement par une valeur ancienne
      await updateDoc(userRef, {
        streak,
        longestStreak,
        updatedAt: serverTimestamp(),
      });
      break;
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const { achievementId } = mutation.payload as { achievementId: string };
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error('User doc missing');
      const achievements: string[] = snap.data()?.achievements ?? [];
      if (achievements.includes(achievementId)) return; // idempotent
      await updateDoc(userRef, {
        achievements: [...achievements, achievementId],
        updatedAt: serverTimestamp(),
      });
      break;
    }

    case 'ADD_TIME_SPENT': {
      const { seconds } = mutation.payload as { seconds: number };
      await updateDoc(userRef, {
        'progress.totalTimeSpent': increment(seconds),
        updatedAt: serverTimestamp(),
      });
      break;
    }

    default:
      console.warn('[Sync] Type de mutation inconnu:', (mutation as any).type);
  }
}

// ── Vider la queue : rejouer toutes les mutations pendantes ──
export async function flushQueue(): Promise<{
  flushed: number;
  failed: number;
  remaining: number;
}> {
  const uid = auth.currentUser?.uid;
  if (!uid) return { flushed: 0, failed: 0, remaining: 0 };

  const { isConnected } = await NetInfo.fetch();
  if (!isConnected) return { flushed: 0, failed: 0, remaining: await readQueue().then(q => q.length) };

  const queue = await readQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0, remaining: 0 };

  const remaining: PendingMutation[] = [];
  let flushed = 0;
  let failed = 0;

  for (const mutation of queue) {
    // Abandonner les mutations trop vieilles (> 7 jours) ou trop retentées
    const age = Date.now() - mutation.createdAt;
    if (mutation.retries >= MAX_RETRIES || age > 7 * 24 * 60 * 60 * 1000) {
      console.warn('[Sync] Mutation abandonnée:', mutation.id, mutation.type);
      failed++;
      continue;
    }

    try {
      await applyMutation(mutation, uid);
      flushed++;
    } catch (e) {
      console.warn('[Sync] Mutation échouée, retry plus tard:', mutation.id, e);
      remaining.push({ ...mutation, retries: mutation.retries + 1 });
      failed++;
      // Pause entre les retries pour éviter de saturer Firestore
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  await writeQueue(remaining);

  if (flushed > 0) {
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  }

  return { flushed, failed, remaining: remaining.length };
}

// ── Pull depuis Firestore → local (lecture uniquement, pas d'écrasement) ──
export async function pullFromFirestore(): Promise<Record<string, unknown> | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;

    const remote = snap.data();
    const localRaw = await AsyncStorage.getItem(`user_${uid}`);
    const local = localRaw ? JSON.parse(localRaw) : null;

    // RÈGLE ANTI-RÉGRESSION : ne jamais écraser le local par des données moins récentes
    if (local) {
      const remoteUpdated = remote?.updatedAt instanceof Timestamp
        ? remote.updatedAt.toMillis()
        : (remote?.updatedAt ?? 0);
      const localUpdated = local?.updatedAt ?? 0;

      // Si local plus récent ET il y a des mutations en attente → garder local
      const pendingCount = (await readQueue()).length;
      if (localUpdated > remoteUpdated && pendingCount > 0) {
        console.log('[Sync] Local plus récent avec mutations pendantes — pull ignoré');
        return local;
      }
    }

    // Fusionner : prendre le max pour les champs numériques critiques
    const merged = {
      ...remote,
      xp: Math.max(remote?.xp ?? 0, local?.xp ?? 0),
      streak: Math.max(remote?.streak ?? 0, local?.streak ?? 0),
      longestStreak: Math.max(remote?.longestStreak ?? 0, local?.longestStreak ?? 0),
      progress: {
        ...remote?.progress,
        totalXpEarned: Math.max(
          remote?.progress?.totalXpEarned ?? 0,
          local?.progress?.totalXpEarned ?? 0,
        ),
        totalLessonsCompleted: Math.max(
          remote?.progress?.totalLessonsCompleted ?? 0,
          local?.progress?.totalLessonsCompleted ?? 0,
        ),
        // Union des arrays (jamais supprimer une complétion locale)
        completedLessons: Array.from(new Set([
          ...(remote?.progress?.completedLessons ?? []),
          ...(local?.progress?.completedLessons ?? []),
        ])),
        masteredFlashcards: Array.from(new Set([
          ...(remote?.progress?.masteredFlashcards ?? []),
          ...(local?.progress?.masteredFlashcards ?? []),
        ])),
        completedModules: Array.from(new Set([
          ...(remote?.progress?.completedModules ?? []),
          ...(local?.progress?.completedModules ?? []),
        ])),
        achievements: Array.from(new Set([
          ...(remote?.achievements ?? []),
          ...(local?.achievements ?? []),
        ])),
      },
    };

    await AsyncStorage.setItem(`user_${uid}`, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('[Sync] Erreur pull Firestore:', e);
    // Retourner le local en cas d'erreur réseau
    const localRaw = await AsyncStorage.getItem(`user_${uid}`);
    return localRaw ? JSON.parse(localRaw) : null;
  }
}

// ── Initialisation du listener réseau ────────────────────────
// Appeler UNE FOIS au démarrage de l'app dans _layout.tsx
let networkListenerCleanup: (() => void) | null = null;

export function initNetworkSyncListener(): () => void {
  if (networkListenerCleanup) return networkListenerCleanup;

  networkListenerCleanup = NetInfo.addEventListener(state => {
    if (state.isConnected && auth.currentUser) {
      // Reconnexion détectée → flush immédiat
      flushQueue().then(result => {
        if (result.flushed > 0) {
          console.log(`[Sync] Reconnexion : ${result.flushed} mutations synchronisées`);
        }
      }).catch(e => console.warn('[Sync] Flush après reconnexion échoué:', e));
    }
  });

  return () => {
    if (networkListenerCleanup) {
      networkListenerCleanup();
      networkListenerCleanup = null;
    }
  };
}

// ── Helpers pratiques pour les hooks ─────────────────────────
export const syncActions = {
  completeLesson: (lessonId: string, xpEarned: number) =>
    enqueueMutation('COMPLETE_LESSON', { lessonId, xpEarned }),

  masterFlashcard: (flashcardId: string) =>
    enqueueMutation('MASTER_FLASHCARD', { flashcardId }),

  addXP: (amount: number) =>
    enqueueMutation('ADD_XP', { amount }),

  updateStreak: (streak: number, longestStreak: number) =>
    enqueueMutation('UPDATE_STREAK', { streak, longestStreak }),

  unlockAchievement: (achievementId: string) =>
    enqueueMutation('UNLOCK_ACHIEVEMENT', { achievementId }),

  addTimeSpent: (seconds: number) =>
    enqueueMutation('ADD_TIME_SPENT', { seconds }),
};

// ── Export d'interface unifiée pour useSync ────────────────
export const syncService = {
  needsSync: async (): Promise<boolean> => {
    const queue = await readQueue();
    return queue.length > 0;
  },

  pushLocalProgress: async (uid: string): Promise<void> => {
    await flushQueue();
  },

  pullRemoteProgress: async (uid: string): Promise<Record<string, unknown> | null> => {
    return await pullFromFirestore();
  },

  syncFlashcardReviews: async (uid: string): Promise<void> => {
    // Les révisions de flashcards passent par la queue (flushQueue les traite)
    await flushQueue();
  },
  
  triggerSync: async (): Promise<void> => {
    await flushQueue();
    await pullFromFirestore();
  }
};

export default syncService;