// ============================================================
// src/services/firebase/contentService.ts
// Récupération du contenu pédagogique depuis Firestore
// ============================================================

import {
  collection, getDocs, getDoc, doc,
  query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from './config';
import { FIREBASE_COLLECTIONS } from '@/constants';
import type { Lesson, Module, Flashcard, Quiz } from '@/types';

// Fallback local si pas de réseau
import { FLASHCARDS } from '@/content/flashcards/flashcards';
import { QUIZZES } from '@/content/quizzes/quizzes';
import { getLessonsByModule, getLessonById } from '@/content/lessons';

export const contentService = {

  // ── Modules ───────────────────────────────────────────────
  getModules: async (): Promise<Module[]> => {
    try {
      const snap = await getDocs(
        query(collection(db, FIREBASE_COLLECTIONS.MODULES), orderBy('order'))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));
    } catch {
      return []; // fallback silencieux
    }
  },

  // ── Un module spécifique ─────────────────────────────────
  getModuleById: async (moduleId: string): Promise<Module | null> => {
    try {
      const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.MODULES, moduleId));
      if (!snap.exists()) throw new Error('not found');
      return { id: snap.id, ...snap.data() } as Module;
    } catch {
      // Pour les modules locaux, on simule le titre car ils ne sont pas tous exportés
      const modules: Record<string, string> = {
        module_1: 'Alphabet & Prononciation',
        module_2: 'Salutations',
        module_3: 'Chiffres',
        module_4: 'Famille',
        module_5: 'Nourriture & Boissons',
        module_6: 'Ville & Transport',
        module_7: 'Temps & Dates',
      };
      return { id: moduleId, title: modules[moduleId] ?? 'Module' } as any;
    }
  },

  // ── Leçons d'un module ────────────────────────────────────
  getLessonsForModule: async (moduleId: string): Promise<Lesson[]> => {
    try {
      const snap = await getDocs(
        query(
          collection(db, FIREBASE_COLLECTIONS.LESSONS),
          where('moduleId', '==', moduleId),
          orderBy('order')
        )
      );
      if (snap.empty) throw new Error('empty');
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
    } catch {
      // Fallback contenu local
      return getLessonsByModule(moduleId);
    }
  },

  // ── Une leçon spécifique ──────────────────────────────────
  getLesson: async (lessonId: string): Promise<Lesson | null> => {
    try {
      const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.LESSONS, lessonId));
      if (!snap.exists()) throw new Error('not found');
      return { id: snap.id, ...snap.data() } as Lesson;
    } catch {
      return getLessonById(lessonId) ?? null;
    }
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
