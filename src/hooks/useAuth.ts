// ============================================================
// src/hooks/useAuth.ts
// Hook d'authentification — anonyme, Google, email
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { userService } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const { setUser, setLoading } = useUserStore();

  // ── Écouter les changements d'état Auth ──────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await userService.getOrCreateUser(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName ?? 'Apprenant',
            photoURL: firebaseUser.photoURL,
          });
          setUser(user);
          setStatus('authenticated');
        } catch (e) {
          console.error('Erreur récupération utilisateur:', e);
        }
      } else {
        setUser(null);
        setStatus('idle');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ── Connexion anonyme silencieuse au démarrage ───────────
  const signInSilently = useCallback(async () => {
    try {
      setStatus('loading');
      // Vérifier si déjà connecté
      if (auth.currentUser) {
        setStatus('authenticated');
        return;
      }
      await signInAnonymously(auth);
      setStatus('authenticated');
    } catch (e: any) {
      console.error('Erreur connexion anonyme:', e);
      setStatus('error');
      setError(e.message);
    }
  }, []);

  // ── Connexion email ──────────────────────────────────────
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setStatus('loading');
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      setStatus('authenticated');
      return { success: true };
    } catch (e: any) {
      const msg = getAuthErrorMessage(e.code);
      setError(msg);
      setStatus('error');
      return { success: false, error: msg };
    }
  }, []);

  // ── Inscription email ────────────────────────────────────
  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    try {
      setStatus('loading');
      setError(null);

      // Si utilisateur anonyme → lier le compte
      if (auth.currentUser?.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        await userService.updateUser(auth.currentUser.uid, {
          email, displayName, updatedAt: new Date(),
        });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      setStatus('authenticated');
      return { success: true };
    } catch (e: any) {
      const msg = getAuthErrorMessage(e.code);
      setError(msg);
      setStatus('error');
      return { success: false, error: msg };
    }
  }, []);

  // ── Déconnexion ──────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('isOnboarded');
      setUser(null);
      setStatus('idle');
    } catch (e) {
      console.error('Erreur déconnexion:', e);
    }
  }, []);

  // ── Vérifier si compte anonyme ───────────────────────────
  const isAnonymous = auth.currentUser?.isAnonymous ?? true;
  const currentUid = auth.currentUser?.uid ?? null;

  return {
    status,
    error,
    isAnonymous,
    currentUid,
    signInSilently,
    signInWithEmail,
    signUpWithEmail,
    logout,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

// ── Messages d'erreur lisibles ───────────────────────────────
function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
    'auth/user-not-found': 'Aucun compte associé à cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
  };
  return messages[code] ?? 'Une erreur est survenue. Réessayez.';
}

// ── Mise à jour manquante dans userService ───────────────────
declare module '@/services/firebase/userService' {
  interface UserServiceExtension {
    updateUser: (uid: string, data: Partial<any>) => Promise<void>;
  }
}
