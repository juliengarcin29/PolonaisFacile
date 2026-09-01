// ============================================================
// src/hooks/useSync.ts
// Hook de synchronisation automatique en arrière-plan
// ============================================================

import { auth } from '@/services/firebase/config';
import { syncService } from '@/services/firebase/syncService';
import { useUserStore } from '@/store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, updateUser } = useUserStore();

  // ── Sync au retour de l'app en foreground ────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      const wasBackground = appStateRef.current === 'background';
      const isNowActive = nextState === 'active';

      if (wasBackground && isNowActive) {
        try {
          const needsSync = await syncService.needsSync();
          if (needsSync) {
            triggerSync();
          }
        } catch (e) {
          console.warn('[SyncHook] Erreur vérification foreground:', e);
        }
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  // ── Sync initiale au montage ─────────────────────────────
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    syncService.needsSync().then((needs) => {
      if (needs) triggerSync();
    }).catch(console.warn);
  }, []);

  // ── Déclencher une synchronisation ──────────────────────
  const triggerSync = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    try {
      // 1. Flush la file d'attente des mutations locales
      await syncService.pushLocalProgress(uid);

      // 2. Synchroniser les données distantes
      const remote = await syncService.pullRemoteProgress(uid) as any;
      if (remote && user) {
        const merged = {
          xp: Math.max(user.xp ?? 0, remote.xp ?? 0),
          streak: Math.max(user.streak ?? 0, remote.streak ?? 0),
          longestStreak: Math.max(user.longestStreak ?? 0, remote.longestStreak ?? 0),
          progress: {
            ...user.progress,
            completedLessons: Array.from(new Set([
              ...(user.progress?.completedLessons ?? []),
              ...(remote.progress?.completedLessons ?? []),
            ])),
            totalLessonsCompleted: Math.max(
              user.progress?.totalLessonsCompleted ?? 0,
              remote.progress?.totalLessonsCompleted ?? 0
            ),
            totalXpEarned: Math.max(
              user.progress?.totalXpEarned ?? 0,
              remote.progress?.totalXpEarned ?? 0
            ),
          },
        };
        updateUser(merged);
      }

      const now = new Date();
      setLastSyncAt(now);
      setSyncStatus('synced');
      await AsyncStorage.setItem('last_sync_timestamp', now.toISOString());

    } catch (e) {
      console.error('[SyncHook] Erreur pendant la sync:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [syncStatus, user, updateUser]);

  // ── Sync différée (debounced) après une action ──────────
  const debouncedSync = useCallback((delayMs = 5000) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(triggerSync, delayMs);
  }, [triggerSync]);

  // ── Sync manuelle forcée ─────────────────────────────────
  const forceSync = useCallback(async () => {
    await triggerSync();
  }, [triggerSync]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  return {
    syncStatus,
    lastSyncAt,
    triggerSync,
    debouncedSync,
    forceSync,
    isSyncing: syncStatus === 'syncing',
    isOffline: syncStatus === 'offline',
  };
}