// ============================================================
// src/services/firebase/authService.ts
// Authentification Firebase (anonyme, Google, email)
// ============================================================

import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from './config';

export const authService = {

  // Connexion anonyme (au démarrage, sans compte)
  signInAnonymous: async () => {
    const result = await signInAnonymously(auth);
    return result.user;
  },

  // Inscription email/mot de passe
  signUpWithEmail: async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  // Connexion email/mot de passe
  signInWithEmail: async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  // Déconnexion
  signOut: async () => {
    await signOut(auth);
  },

  // Écouter les changements d'état auth
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Utilisateur courant
  getCurrentUser: () => auth.currentUser,
};
