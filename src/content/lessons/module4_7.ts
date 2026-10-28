// ============================================================
// src/content/lessons/module4_7.ts
// Modules 4-7 : Café et restaurant, Verbes, Premiers nombres, Famille
// ============================================================

import type { Lesson } from '@/types';
import { VOCAB_4_1 } from '@/content/vocabulary/module4';

// ── MODULE 4 : CAFÉ ET RESTAURANT (Officiel) ────────────────
export const MODULE_4_LESSONS: Lesson[] = [
  {
    id: 'lesson_4_1',
    moduleId: 'module_4',
    title: 'Commander un café',
    description: 'Commander une boisson chaude.',
    type: 'vocabulary',
    difficulty: 'A1',
    order: 1,
    xpReward: 50,
    estimatedMinutes: 3,
    isPremium: false,
    tags: ['boissons', 'café', 'restaurant'],
    discoveryItems: VOCAB_4_1,
    exercises: [
      {
        id: 'ex_4_1_01',
        type: 'multiple_choice',
        question: 'Que veut dire « Poproszę… » ?',
        correctAnswer: 'Je voudrais…',
        options: ['café', 'Je voudrais…', 'lait'],
        explanation: 'Poproszę… = Je voudrais…',
        xpReward: 10,
      },
      {
        id: 'ex_4_1_02',
        type: 'matching',
        question: 'Associe chaque mot polonais à sa traduction.',
        correctAnswer: 'correct',
        pairs: [
          { left: 'Poproszę…', right: 'Je voudrais…' },
          { left: 'kawa', right: 'café' },
          { left: 'herbata', right: 'thé' },
          { left: 'mleko', right: 'lait' },
        ],
        explanation: 'Bonnes associations : Poproszę… = Je voudrais… ; kawa = café ; herbata = thé ; mleko = lait.',
        xpReward: 15,
      },
      {
        id: 'ex_4_1_03',
        type: 'word_order',
        question: 'Remets dans l\'ordre : « Je voudrais un café sans sucre. »',
        correctAnswer: 'Poproszę kawę bez cukru.',
        words: ['Poproszę', 'kawę', 'bez', 'cukru.'],
        explanation: 'Poproszę kawę bez cukru. = Je voudrais un café sans sucre.',
        xpReward: 15,
      },
      {
        id: 'ex_4_1_04',
        type: 'fill_blank',
        question: 'Complète : Poproszę ___. (« Je voudrais un café. »)',
        correctAnswer: 'kawę',
        options: ['herbatę', 'mlekiem', 'kawę'],
        explanation: 'kawa = café. Dans « Poproszę kawę. », la forme est « kawę ».',
        xpReward: 10,
      },
      {
        id: 'ex_4_1_05',
        type: 'multiple_choice',
        question: 'Comment dit-on « thé » ?',
        correctAnswer: 'herbata',
        options: ['herbata', 'cukier', 'bez'],
        explanation: 'herbata = thé.',
        xpReward: 10,
      },
      {
        id: 'ex_4_1_06',
        type: 'word_order',
        question: 'Écoute la phrase puis remets les mots dans l\'ordre.',
        correctAnswer: 'Poproszę herbatę z cukrem.',
        words: ['Poproszę', 'herbatę', 'z', 'cukrem.'],
        isAudioPrompt: true,
        audioText: 'Poproszę herbatę z cukrem.',
        audioKey: 'v_4_1_06_example',
        explanation: 'Poproszę herbatę z cukrem. = Je voudrais un thé avec du sucre.',
        xpReward: 15,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ── MODULE 5 : VERBES ESSENTIELS (Officiel) ─────────────────
export const MODULE_5_LESSONS: Lesson[] = [];

// ── MODULE 6 : PREMIERS NOMBRES (Officiel) ──────────────────
export const MODULE_6_LESSONS: Lesson[] = [];

// ── MODULE 7 : FAMILLE ET RELATIONS (Officiel) ──────────────
export const MODULE_7_LESSONS: Lesson[] = [];
