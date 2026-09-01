// ============================================================
// src/content/quizzes/quizzes.ts
// 20 questions de quiz — thèmes variés
// ============================================================

import type { Quiz } from '@/types';

export const QUIZZES: Quiz[] = [
  {
    id: 'quiz_salutations_01',
    title: 'Salutations — Niveau 1',
    description: 'Testez vos connaissances sur les formules de politesse de base.',
    moduleId: 'module_2',
    difficulty: 'A1',
    xpReward: 100,
    isPremium: false,
    passingScore: 70,
    timeLimit: 120,
    questions: [
      {
        id: 'qq_01', type: 'multiple_choice', points: 10,
        question: 'Comment dit-on "Bonjour" (formel) en polonais ?',
        correctAnswer: 'Dzień dobry',
        options: ['Cześć', 'Dzień dobry', 'Do widzenia', 'Dobranoc'],
        explanation: '"Dzień dobry" signifie littéralement "Bon jour" et s\'utilise dans un contexte formel.',
      },
      {
        id: 'qq_02', type: 'multiple_choice', points: 10,
        question: 'Que signifie "Dziękuję" ?',
        correctAnswer: 'Merci',
        options: ['Pardon', 'Bonjour', 'Merci', 'Au revoir'],
        explanation: '"Dziękuję" = merci. "Bardzo dziękuję" = merci beaucoup.',
      },
      {
        id: 'qq_03', type: 'multiple_choice', points: 10,
        question: 'Comment dit-on "Au revoir" en polonais ?',
        correctAnswer: 'Do widzenia',
        options: ['Dobranoc', 'Cześć', 'Do widzenia', 'Proszę'],
        explanation: '"Do widzenia" = au revoir (formel). "Cześć" peut aussi signifier "salut" en partant.',
      },
      {
        id: 'qq_04', type: 'translation_fr_pl', points: 15,
        question: 'Traduisez : "Excusez-moi"',
        correctAnswer: 'Przepraszam',
        options: ['Dziękuję', 'Przepraszam', 'Proszę', 'Dobrze'],
        explanation: '"Przepraszam" sert à la fois pour "excusez-moi", "pardon" et "je suis désolé".',
      },
      {
        id: 'qq_05', type: 'multiple_choice', points: 10,
        question: '"Cześć" est une formule...',
        correctAnswer: 'Informelle (salut)',
        options: ['Formelle uniquement', 'Informelle (salut)', 'Uniquement pour dire au revoir', 'Uniquement le matin'],
        explanation: '"Cześć" est l\'équivalent de "salut" — on l\'utilise en arrivant et en partant entre amis.',
      },
    ],
  },
  {
    id: 'quiz_chiffres_01',
    title: 'Chiffres — Niveau 1',
    description: 'Maîtrisez les chiffres de 0 à 100.',
    moduleId: 'module_3',
    difficulty: 'A1',
    xpReward: 100,
    isPremium: false,
    passingScore: 70,
    questions: [
      {
        id: 'qq_10', type: 'multiple_choice', points: 10,
        question: 'Comment dit-on "cinq" en polonais ?',
        correctAnswer: 'pięć',
        options: ['cztery', 'pięć', 'sześć', 'siedem'],
        explanation: 'pięć = 5. Attention à la prononciation : [pjɛɲtɕ].',
      },
      {
        id: 'qq_11', type: 'translation_pl_fr', points: 10,
        question: 'Que signifie "dziesięć" ?',
        correctAnswer: 'dix',
        options: ['sept', 'huit', 'neuf', 'dix'],
        explanation: 'dziesięć = 10. Retenez : "dzie-SIEN-tch".',
      },
      {
        id: 'qq_12', type: 'multiple_choice', points: 10,
        question: '"Sto lat" signifie littéralement...',
        correctAnswer: 'Cent ans',
        options: ['Bonne année', 'Cent ans', 'Bon anniversaire', 'Longue vie'],
        explanation: '"Sto lat" = cent ans. C\'est la chanson d\'anniversaire polonaise !',
      },
      {
        id: 'qq_13', type: 'multiple_choice', points: 10,
        question: 'Comment dit-on "deux" en polonais ?',
        correctAnswer: 'dwa',
        options: ['jeden', 'dwa', 'trzy', 'cztery'],
        explanation: 'dwa = 2. Attention : "dwie" pour le féminin (deux femmes = dwie kobiety).',
      },
    ],
  },
  {
    id: 'quiz_mixte_01',
    title: 'Quiz surprise — Bases',
    description: 'Un quiz mixte pour consolider vos acquis.',
    moduleId: 'module_2',
    difficulty: 'A1',
    xpReward: 150,
    isPremium: false,
    passingScore: 60,
    questions: [
      {
        id: 'qq_20', type: 'multiple_choice', points: 10,
        question: 'Que signifie "Jak się masz ?" ?',
        correctAnswer: 'Comment vas-tu ?',
        options: ['Quel est ton prénom ?', 'Comment vas-tu ?', 'Où habites-tu ?', 'Quel âge as-tu ?'],
        explanation: '"Jak się masz ?" est la question informelle pour demander comment quelqu\'un va.',
      },
      {
        id: 'qq_21', type: 'translation_fr_pl', points: 15,
        question: 'Comment dit-on "eau" en polonais ?',
        correctAnswer: 'woda',
        options: ['kawa', 'piwo', 'woda', 'herbata'],
        explanation: 'woda = eau. "Poproszę wodę mineralną" = de l\'eau minérale, s\'il vous plaît.',
      },
      {
        id: 'qq_22', type: 'multiple_choice', points: 10,
        question: '"Brat" signifie...',
        correctAnswer: 'frère',
        options: ['père', 'frère', 'oncle', 'cousin'],
        explanation: 'brat = frère. Le pluriel est "bracia".',
      },
      {
        id: 'qq_23', type: 'multiple_choice', points: 10,
        question: 'Dans "pociąg do Krakowa", "pociąg" signifie...',
        correctAnswer: 'train',
        options: ['bus', 'avion', 'train', 'taxi'],
        explanation: 'pociąg = train. "Do Krakowa" = pour/vers Cracovie.',
      },
      {
        id: 'qq_24', type: 'multiple_choice', points: 15,
        question: 'Sur quelle syllabe tombe l\'accent en polonais ?',
        correctAnswer: "L'avant-dernière",
        options: ["La première", "La dernière", "L'avant-dernière", "Variable"],
        explanation: 'Règle générale : accent sur l\'avant-dernière syllabe. Ex : mu-ZY-ka, War-SZA-wa.',
      },
    ],
  },
];
