// ============================================================
// src/types/index.ts
// Tous les types TypeScript de l'application
// ============================================================

// ── UTILISATEUR ──────────────────────────────────────────────
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  longestStreak: number;
  hearts: number;
  maxHearts: number;
  premium: boolean;
  premiumExpiresAt: Date | null;
  language: 'fr' | 'en' | 'es' | 'pt';
  targetLanguage: 'pl';
  progress: UserProgress;
  achievements: string[];
  dailyGoal: number; // minutes par jour
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface UserProgress {
  completedLessons: string[];
  completedModules: string[];
  completedQuizzes: string[];
  masteredFlashcards: string[];
  totalXpEarned: number;
  totalLessonsCompleted: number;
  totalTimeSpent: number; // secondes
}

// ── LEÇONS ───────────────────────────────────────────────────
export type LessonType =
  | 'vocabulary'
  | 'grammar'
  | 'pronunciation'
  | 'dialogue'
  | 'dictation'
  | 'conjugation'
  | 'review';

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: LessonType;
  difficulty: DifficultyLevel;
  order: number;
  xpReward: number;
  estimatedMinutes: number;
  isPremium: boolean;
  exercises: Exercise[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  difficulty: DifficultyLevel;
  isPremium: boolean;
  lessonIds: string[];
  totalXp: number;
}

// ── EXERCICES ────────────────────────────────────────────────
export type ExerciseType =
  | 'multiple_choice'    // QCM
  | 'translation_fr_pl'  // Traduction FR → PL
  | 'translation_pl_fr'  // Traduction PL → FR
  | 'fill_blank'         // Texte à trous
  | 'word_order'         // Remise en ordre
  | 'matching'           // Association
  | 'listening'          // Écoute + réponse
  | 'dictation'          // Dictée
  | 'pronunciation'      // Prononciation
  | 'drag_drop';         // Glisser-déposer

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  questionPl?: string;     // version polonaise de la question
  questionFr?: string;     // version française de la question
  correctAnswer: string;
  options?: string[];      // pour QCM
  words?: string[];        // pour word_order et drag_drop
  pairs?: Array<{ left: string; right: string }>; // pour matching
  audioUrl?: string;       // URL Firebase Storage
  hint?: string;
  explanation?: string;    // explication après erreur
  xpReward: number;
}

// ── FLASHCARDS ───────────────────────────────────────────────
export interface Flashcard {
  id: string;
  moduleId: string;
  front: string;           // mot polonais
  back: string;            // traduction française
  phonetic: string;        // transcription phonétique
  audioUrl?: string;
  examplePl: string;
  exampleFr: string;
  tags: string[];
  imageUrl?: string;
  isPremium: boolean;
}

// ── RÉPÉTITION ESPACÉE (SM-2) ────────────────────────────────
export interface FlashcardReview {
  flashcardId: string;
  userId: string;
  easinessFactor: number;  // défaut : 2.5
  interval: number;        // jours jusqu'à la prochaine révision
  repetitions: number;     // nombre de révisions réussies consécutives
  nextReviewDate: Date;
  lastReviewDate: Date;
  totalReviews: number;
  correctReviews: number;
}

// ── QUIZ ─────────────────────────────────────────────────────
export interface Quiz {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  difficulty: DifficultyLevel;
  questions: QuizQuestion[];
  timeLimit?: number;      // secondes, null = pas de limite
  xpReward: number;
  isPremium: boolean;
  passingScore: number;    // pourcentage minimum pour valider
}

export interface QuizQuestion {
  id: string;
  type: ExerciseType;
  question: string;
  correctAnswer: string;
  options?: string[];
  audioUrl?: string;
  points: number;
  explanation?: string;
}

export interface QuizResult {
  quizId: string;
  userId: string;
  score: number;           // pourcentage
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  completedAt: Date;
  timeSpent: number;       // secondes
  passed: boolean;
}

// ── GAMIFICATION ─────────────────────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: AchievementCondition;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementCondition {
  type: 'streak' | 'lessons' | 'xp' | 'quiz_score' | 'flashcards' | 'time';
  value: number;
}

export interface Streak {
  userId: string;
  current: number;
  longest: number;
  lastActivityDate: Date;
  weeklyActivity: boolean[]; // 7 jours, true = actif
  freezeAvailable: number;   // nb de "streak freeze" disponibles
}

export interface DailyGoal {
  userId: string;
  targetMinutes: number;
  completedMinutes: number;
  date: Date;
  completed: boolean;
  xpBonus: number;
}

// ── ABONNEMENTS ──────────────────────────────────────────────
export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface Subscription {
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: Date;
  endDate: Date | null;
  revenueCatCustomerId?: string;
  trialEndsAt?: Date;
  autoRenew: boolean;
}

// ── NOTIFICATIONS ────────────────────────────────────────────
export interface NotificationSettings {
  userId: string;
  dailyReminder: boolean;
  dailyReminderTime: string; // "HH:MM"
  streakAlert: boolean;
  weeklyReport: boolean;
  promotions: boolean;
}

// ── NAVIGATION ───────────────────────────────────────────────
export type TabRoute = 'index' | 'learn' | 'review' | 'premium' | 'profile';

export interface NavigationParams {
  lessonId?: string;
  moduleId?: string;
  quizId?: string;
}

// ── ÉTAT DES EXERCICES ───────────────────────────────────────
export type ExerciseStatus = 'idle' | 'correct' | 'incorrect' | 'skipped';

export interface ExerciseState {
  currentIndex: number;
  totalExercises: number;
  score: number;
  lives: number;
  xpEarned: number;
  answers: ExerciseAnswer[];
  status: 'in_progress' | 'completed' | 'failed';
}

export interface ExerciseAnswer {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

// ── CONTENU STATIQUE ─────────────────────────────────────────
export interface VocabWord {
  pl: string;
  fr: string;
  phonetic: string;
  audioFile?: string;
  gender?: 'masculine' | 'feminine' | 'neuter';
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
}

export interface ConjugationTable {
  verb: string;
  translation: string;
  aspect: 'perfective' | 'imperfective';
  tense: 'present' | 'past' | 'future' | 'conditional';
  forms: {
    ja: string;       // je
    ty: string;       // tu
    on_ona: string;   // il/elle
    my: string;       // nous
    wy: string;       // vous
    oni_one: string;  // ils/elles
  };
}
