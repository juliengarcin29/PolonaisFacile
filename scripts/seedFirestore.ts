// ============================================================
// scripts/seedFirestore.ts
// Script de peuplement Firestore — contenu pédagogique initial
// ============================================================

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { FLASHCARDS } from '../src/content/flashcards/flashcards';
import { MODULE_1_LESSONS } from '../src/content/lessons/module1';
import { MODULE_2_LESSONS, MODULE_3_LESSONS } from '../src/content/lessons/module2_3';
import { QUIZZES } from '../src/content/quizzes/quizzes';

// Importation de la clé JSON
const serviceAccount = require('./serviceAccountKey.json');

// ── Initialisation Admin SDK ──────────────────────────────────
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

// ── Modules à créer ──────────────────────────────────────────
const MODULES = [
  {
    id: 'module_1',
    title: 'Alphabet & Prononciation',
    description: 'Maîtrisez les bases de la prononciation polonaise',
    icon: '🔤',
    color: '#DC143C',
    order: 1,
    difficulty: 'A1',
    isPremium: false,
    lessonIds: ['lesson_1_1', 'lesson_1_2', 'lesson_1_3'],
    totalXp: 150,
  },
  {
    id: 'module_2',
    title: 'Salutations essentielles',
    description: 'Les formules de base pour communiquer',
    icon: '👋',
    color: '#3B82F6',
    order: 2,
    difficulty: 'A1',
    isPremium: false,
    lessonIds: ['lesson_2_1', 'lesson_2_2', 'lesson_2_3', 'lesson_2_4'],
    totalXp: 200,
  },
  {
    id: 'module_3',
    title: 'Chiffres et nombres',
    description: 'Comptez en polonais de 0 à 1 000',
    icon: '🔢',
    color: '#22C55E',
    order: 3,
    difficulty: 'A1',
    isPremium: false,
    lessonIds: ['lesson_3_1', 'lesson_3_2', 'lesson_3_3'],
    totalXp: 150,
  },
  {
    id: 'module_4',
    title: 'La famille',
    description: 'Vocabulaire pour parler de votre entourage',
    icon: '👨‍👩‍👧',
    color: '#F59E0B',
    order: 4,
    difficulty: 'A1',
    isPremium: false,
    lessonIds: [],
    totalXp: 200,
  },
  {
    id: 'module_5',
    title: 'Nourriture & Boissons',
    description: 'Commandez et parlez de gastronomie polonaise',
    icon: '🍕',
    color: '#8B5CF6',
    order: 5,
    difficulty: 'A1',
    isPremium: false,
    lessonIds: [],
    totalXp: 250,
  },
  {
    id: 'module_6',
    title: 'Ville & Transport',
    description: 'Naviguer en Pologne avec confiance',
    icon: '🏙️',
    color: '#06B6D4',
    order: 6,
    difficulty: 'A1',
    isPremium: true,
    lessonIds: [],
    totalXp: 300,
  },
  {
    id: 'module_7',
    title: 'Temps & Dates',
    description: 'Exprimer le temps, les jours et les mois',
    icon: '⏰',
    color: '#EC4899',
    order: 7,
    difficulty: 'A2',
    isPremium: true,
    lessonIds: [],
    totalXp: 300,
  },
  {
    id: 'module_8',
    title: 'Grammaire — Les 7 cas',
    description: 'Comprendre le système casuel polonais',
    icon: '🧠',
    color: '#6366F1',
    order: 8,
    difficulty: 'A2',
    isPremium: true,
    lessonIds: [],
    totalXp: 400,
  },
  {
    id: 'module_9',
    title: 'Conjugaison',
    description: 'Les verbes essentiels au présent et au passé',
    icon: '🔄',
    color: '#14B8A6',
    order: 9,
    difficulty: 'A2',
    isPremium: true,
    lessonIds: [],
    totalXp: 400,
  },
  {
    id: 'module_10',
    title: 'Dialogues réels',
    description: 'Situations authentiques du quotidien',
    icon: '💬',
    color: '#F97316',
    order: 10,
    difficulty: 'B1',
    isPremium: true,
    lessonIds: [],
    totalXp: 500,
  },
];

// ── Achievements à créer ──────────────────────────────────────
const ACHIEVEMENTS = [
  {
    id: 'first_lesson',
    title: 'Premier pas',
    description: 'Terminez votre première leçon',
    icon: '🎯',
    xpReward: 50,
    rarity: 'common',
    condition: { type: 'lessons', value: 1 },
  },
  {
    id: 'streak_3',
    title: '3 jours de suite',
    description: 'Maintenez une série de 3 jours',
    icon: '🔥',
    xpReward: 75,
    rarity: 'common',
    condition: { type: 'streak', value: 3 },
  },
  {
    id: 'streak_7',
    title: 'Une semaine !',
    description: 'Maintenez une série de 7 jours',
    icon: '🗓️',
    xpReward: 150,
    rarity: 'rare',
    condition: { type: 'streak', value: 7 },
  },
  {
    id: 'xp_100',
    title: 'Démarrage',
    description: 'Gagnez 100 XP',
    icon: '⚡',
    xpReward: 25,
    rarity: 'common',
    condition: { type: 'xp', value: 100 },
  },
  {
    id: 'xp_500',
    title: 'Assidu',
    description: 'Gagnez 500 XP',
    icon: '💪',
    xpReward: 75,
    rarity: 'rare',
    condition: { type: 'xp', value: 500 },
  },
  {
    id: 'xp_1000',
    title: 'Expert',
    description: 'Gagnez 1 000 XP',
    icon: '🧠',
    xpReward: 150,
    rarity: 'epic',
    condition: { type: 'xp', value: 1000 },
  },
  {
    id: 'lessons_5',
    title: 'Studieux',
    description: 'Terminez 5 leçons',
    icon: '📚',
    xpReward: 100,
    rarity: 'common',
    condition: { type: 'lessons', value: 5 },
  },
  {
    id: 'flashcards_50',
    title: 'Vocabulaire',
    description: 'Maîtrisez 50 flashcards',
    icon: '🃏',
    xpReward: 200,
    rarity: 'rare',
    condition: { type: 'flashcards', value: 50 },
  },
  {
    id: 'quiz_perfect',
    title: 'Parfait !',
    description: 'Obtenez 100% à un quiz',
    icon: '🏆',
    xpReward: 250,
    rarity: 'epic',
    condition: { type: 'quiz_score', value: 100 },
  },
  {
    id: 'streak_30',
    title: 'Un mois !',
    description: 'Maintenez une série de 30 jours',
    icon: '🏅',
    xpReward: 500,
    rarity: 'legendary',
    condition: { type: 'streak', value: 30 },
  },
];

// ── Fonction principale de seeding ───────────────────────────
async function seedFirestore() {
  console.log('🌱 Début du peuplement Firestore...\n');
  let currentBatch = db.batch();
  let operationCount = 0;

  const commitBatch = async () => {
    if (operationCount > 0) {
      await currentBatch.commit();
      console.log(`   ✅ Batch commité (${operationCount} opérations)`);
      currentBatch = db.batch(); // Réinitialisation d'un nouveau batch
      operationCount = 0;
    }
  };

  // 1. Modules
  console.log('📦 Insertion des modules...');
  for (const module of MODULES) {
    const ref = db.collection('modules').doc(module.id);
    currentBatch.set(ref, {
      ...module,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    operationCount++;
  }
  console.log(`   → ${MODULES.length} modules préparés`);

  // 2. Leçons
  console.log('📚 Insertion des leçons...');
  const allLessons = [...MODULE_1_LESSONS, ...MODULE_2_LESSONS, ...MODULE_3_LESSONS];
  for (const lesson of allLessons) {
    const ref = db.collection('lessons').doc(lesson.id);
    currentBatch.set(ref, {
      ...lesson,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    operationCount++;
  }
  console.log(`   → ${allLessons.length} leçons préparées`);

  await commitBatch();

  // 3. Flashcards
  console.log('🃏 Insertion des flashcards...');
  for (const card of FLASHCARDS) {
    const ref = db.collection('flashcards').doc(card.id);
    currentBatch.set(ref, {
      ...card,
      createdAt: FieldValue.serverTimestamp(),
    });
    operationCount++;
  }
  console.log(`   → ${FLASHCARDS.length} flashcards préparées`);

  // 4. Quiz
  console.log('❓ Insertion des quiz...');
  for (const quiz of QUIZZES) {
    const ref = db.collection('quizzes').doc(quiz.id);
    currentBatch.set(ref, {
      ...quiz,
      createdAt: FieldValue.serverTimestamp(),
    });
    operationCount++;
  }
  console.log(`   → ${QUIZZES.length} quiz préparés`);

  await commitBatch();

  // 5. Achievements
  console.log('🏆 Insertion des achievements...');
  for (const achievement of ACHIEVEMENTS) {
    const ref = db.collection('achievements').doc(achievement.id);
    currentBatch.set(ref, achievement);
    operationCount++;
  }
  console.log(`   → ${ACHIEVEMENTS.length} achievements préparés`);

  await commitBatch();

  console.log('\n✅ Peuplement Firestore terminé avec succès !');
  console.log('\n📊 Résumé :');
  console.log(`   - ${MODULES.length} modules`);
  console.log(`   - ${allLessons.length} leçons`);
  console.log(`   - ${FLASHCARDS.length} flashcards`);
  console.log(`   - ${QUIZZES.length} quiz`);
  console.log(`   - ${ACHIEVEMENTS.length} achievements`);
  console.log('\n🔗 Vérifier dans : console.firebase.google.com');
}

// ── Exécution ────────────────────────────────────────────────
seedFirestore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur lors du seeding :', error);
    process.exit(1);
  });