// ============================================================
// src/services/firebase/contentService.ts
// Récupération du contenu pédagogique depuis le code local & Firestore (flashcards/quizzes)
// ============================================================

import {
  collection, getDocs, getDoc, doc,
  query, where, limit,
} from 'firebase/firestore';
import { db } from './config';
import { FIREBASE_COLLECTIONS } from '@/constants';
import type { Lesson, Module, Flashcard, Quiz } from '@/types';

// Source locale unique pour les leçons et modules
import { FLASHCARDS } from '@/content/flashcards/flashcards';
import { QUIZZES } from '@/content/quizzes/quizzes';
import { getLessonsByModule, getLessonById } from '@/content/lessons';

export const contentService = {

  // ── Modules ───────────────────────────────────────────────
  getModules: async (): Promise<Module[]> => {
    return [];
  },

  // ── Un module spécifique (Source locale) ─────────────────
  getModuleById: async (moduleId: string): Promise<Module | null> => {
    const modules: Record<string, string> = {
      module_1: 'Sons du polonais',
      module_2: 'Salutations et présentation',
      module_3: 'Demander et répondre',
      module_4: 'Café et restaurant',
      module_5: 'Verbes essentiels',
      module_6: 'Premiers nombres',
      module_7: 'Famille et relations',
      module_8: 'Nourriture',
      module_9: 'Nombres et argent',
      module_10: 'Magasins et paiement',
      module_11: 'Couleurs et vêtements',
      module_12: "L'heure",
      module_13: 'Jours et mois',
      module_14: 'Ville et transports',
      module_15: 'Logement et maison',
      module_16: 'Travail et quotidien',
      module_17: 'Téléphone et démarches',
      module_18: 'Santé et urgences',
      module_19: 'Météo, saisons et voyages',
      module_20: 'Début A2',
    };
    return { id: moduleId, title: modules[moduleId] ?? 'Module' } as any;
  },

  // ── Leçons d'un module (Source locale) ────────────────────
  getLessonsForModule: async (moduleId: string): Promise<Lesson[]> => {
    return getLessonsByModule(moduleId);
  },

  // ── Une leçon spécifique (Source locale) ──────────────────
  getLesson: async (lessonId: string): Promise<Lesson | null> => {
    return getLessonById(lessonId) ?? null;
  },

  // ── Flashcards d'un module ────────────────────────────────
  getFlashcards: async (moduleId?: string): Promise<Flashcard[]> => {
    try {
      const q = moduleId
        ? query(collection(db, FIREBASE_COLLECTIONS.FLASHCARDS), where('moduleId', '==', moduleId))
        : query(collection(db, FIREBASE_COLLECTIONS.FLASHCARDS), limit(100));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('empty');
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));
    } catch {
      return moduleId ? FLASHCARDS.filter(f => f.moduleId === moduleId) : FLASHCARDS;
    }
  },

  // ── Quiz d'un module ──────────────────────────────────────
  getQuizzes: async (moduleId?: string): Promise<Quiz[]> => {
    try {
      const q = moduleId
        ? query(collection(db, FIREBASE_COLLECTIONS.QUIZZES), where('moduleId', '==', moduleId))
        : collection(db, FIREBASE_COLLECTIONS.QUIZZES);
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('empty');
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
    } catch {
      return moduleId ? QUIZZES.filter(q => q.moduleId === moduleId) : QUIZZES;
    }
  },

  // ── Quiz spécifique ───────────────────────────────────────
  getQuiz: async (quizId: string): Promise<Quiz | null> => {
    try {
      const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.QUIZZES, quizId));
      if (!snap.exists()) throw new Error('not found');
      return { id: snap.id, ...snap.data() } as Quiz;
    } catch {
      return QUIZZES.find(q => q.id === quizId) ?? null;
    }
  },
};
