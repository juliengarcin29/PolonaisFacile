// ============================================================
// app/lesson/[id].tsx
// Écran de leçon — moteur d'exercices complet
// ============================================================

import { BORDER_RADIUS, COLORS, GAMIFICATION, SPACING } from '@/constants';
import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';
import { getLessonById } from '@/content/lessons';
import { triggerHapticError, triggerHapticImpact } from '@/utils/haptics';
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise';
import MatchingExercise from '@/components/exercises/MatchingExercise';
import WordOrderExercise from '@/components/exercises/WordOrderExercise';
import LessonCompleted from '@/components/exercises/LessonCompleted';
import type { Exercise, ExerciseAnswer, Lesson } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type LessonPhase = 'loading' | 'error' | 'exercise' | 'feedback_correct' | 'feedback_wrong' | 'completed';

export default function LessonScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();
  const { completeLesson } = useGamification();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<LessonPhase>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answers, setAnswers] = useState<ExerciseAnswer[]>([]);
  const [lives, setLives] = useState(user?.hearts ?? 5);
  const [startTime] = useState(Date.now());
  const [matchSelected, setMatchSelected] = useState<{ left?: string; right?: string }>({});
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [wordOrderAnswer, setWordOrderAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // ── Charger la leçon ──────────────────────────────────────
  useEffect(() => {
    if (id) {
      const data = getLessonById(id);
      if (data) {
        setLesson(data);
        setPhase('exercise');
      } else {
        setPhase('error');
      }
    }
  }, [id]);

  const exercises = lesson?.exercises ?? [];
  const current = exercises[currentIndex];
  const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [currentIndex, progress]);

  useEffect(() => {
    if (current?.type === 'word_order' && current.words) {
      setAvailableWords([...current.words].sort(() => Math.random() - 0.5));
      setWordOrderAnswer([]);
    }
    if (current?.type === 'matching') {
      setMatchSelected({});
      setMatchedPairs([]);
    }
  }, [currentIndex, current]);

  const shake = () => {
    const isNative = Platform.OS !== 'web';
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: isNative }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: isNative }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: isNative }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: isNative }),
    ]).start();
  };

  const checkAnswer = (answer: string) => {
    if (!current) return;
    const isCorrect = answer.trim().toLowerCase() === current.correctAnswer.trim().toLowerCase();

    const answerRecord: ExerciseAnswer = {
      exerciseId: current.id,
      userAnswer: answer,
      correctAnswer: current.correctAnswer,
      isCorrect,
      timeSpent: 0,
    };
    setAnswers(prev => [...prev, answerRecord]);
    setSelectedAnswer(answer);

    if (isCorrect) {
      setScore(prev => prev + 1);
      setXpEarned(prev => prev + current.xpReward);
      setPhase('feedback_correct');
    } else {
      triggerHapticError();
      shake();
      setLives(prev => Math.max(0, prev - 1));
      setPhase('feedback_wrong');
    }

    Animated.spring(feedbackAnim, {
      toValue: 1, 
      useNativeDriver: Platform.OS !== 'web', 
      friction: 6,
    }).start();
  };

  const nextExercise = () => {
    triggerHapticImpact();
    feedbackAnim.setValue(0);
    setSelectedAnswer('');
    setMatchSelected({});

    if (currentIndex + 1 >= exercises.length) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      completeLesson(id, score, exercises.length, timeSpent);
      setPhase('completed');
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('exercise');
    }
  };

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('lesson.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'error' || !current) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🛰️</Text>
          <Text style={styles.errorTitle}>{t('lesson.error_title')}</Text>
          <Text style={styles.errorDesc}>{t('lesson.error_desc')}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{t('lesson.error_btn')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'completed') {
    return <LessonCompleted score={score} total={exercises.length} xpEarned={xpEarned} lessonId={id} />;
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header : progression + vies + fermer */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.livesRow}>
            {Array.from({ length: user?.maxHearts ?? 5 }).map((_, i) => (
              <Text key={i} style={[styles.heart, i >= lives && styles.heartEmpty]}>❤️</Text>
            ))}
          </View>
        </View>

        {/* Corps de l'exercice */}
        <Animated.View style={[styles.exerciseWrap, { transform: [{ translateX: shakeAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* Compteur */}
            <Text style={styles.counter}>{currentIndex + 1} / {exercises.length}</Text>

            {/* Type d'exercice */}
            <Text style={styles.typeLabel}>{t(`lesson.types.${current.type}` as any)}</Text>

            {/* Question */}
            <Text style={styles.question}>{current.question}</Text>

            {/* Rendu selon le type */}
            {current.type === 'multiple_choice' || current.type === 'translation_fr_pl' || current.type === 'translation_pl_fr' || current.type === 'fill_blank' ? (
              <MultipleChoiceExercise
                exercise={current}
                selectedAnswer={selectedAnswer}
                phase={phase}
                onAnswer={checkAnswer}
              />
            ) : current.type === 'matching' ? (
              <MatchingExercise
                exercise={current}
                matchSelected={matchSelected}
                setMatchSelected={setMatchSelected}
                matchedPairs={matchedPairs}
                setMatchedPairs={setMatchedPairs}
                onComplete={() => {
                  setScore(prev => prev + 1);
                  setXpEarned(prev => prev + current.xpReward);
                  setPhase('feedback_correct');
                }}
              />
            ) : current.type === 'word_order' ? (
              <WordOrderExercise
                exercise={current}
                wordOrderAnswer={wordOrderAnswer}
                setWordOrderAnswer={setWordOrderAnswer}
                availableWords={availableWords}
                setAvailableWords={setAvailableWords}
                onSubmit={checkAnswer}
                phase={phase}
              />
            ) : null}
          </ScrollView>
        </Animated.View>

        {/* Feedback bas d'écran */}
        {(phase === 'feedback_correct' || phase === 'feedback_wrong') && (
          <Animated.View
            style={[
              styles.feedbackBar,
              { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.md) },
              phase === 'feedback_correct' ? styles.feedbackCorrect : styles.feedbackWrong,
              { transform: [{ scale: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] },
            ]}
          >
            <View style={styles.feedbackTop}>
              <Text style={styles.feedbackIcon}>{phase === 'feedback_correct' ? '✅' : '❌'}</Text>
              <View>
                <Text style={styles.feedbackTitle}>
                  {phase === 'feedback_correct' ? t('lesson.feedback.correct') : t('lesson.feedback.wrong')}
                </Text>
                {phase === 'feedback_wrong' && (
                  <Text style={styles.feedbackCorrectAnswer}>
                    {t('lesson.feedback.correct_answer')} {current.correctAnswer}
                  </Text>
                )}
              </View>
            </View>
            {current.explanation && (
              <Text style={styles.feedbackExplanation}>{current.explanation}</Text>
            )}
            {phase === 'feedback_correct' && (
              <Text style={styles.feedbackXP}>+{current.xpReward} XP</Text>
            )}
            <TouchableOpacity
              style={[styles.continueBtn, phase === 'feedback_wrong' && styles.continueBtnWrong]}
              onPress={nextExercise}
            >
              <Text style={styles.continueBtnText}>
                {currentIndex + 1 >= exercises.length ? t('lesson.feedback.btn_finish') : t('lesson.feedback.btn_continue')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ── HELPERS ──────────────────────────────────────────────────
function getTypeLabel(type: Exercise['type']): string {
  const labels: Record<Exercise['type'], string> = {
    multiple_choice: '📝 Choix multiple',
    translation_fr_pl: '🇫🇷→🇵🇱 Traduction',
    translation_pl_fr: '🇵🇱→🇫🇷 Traduction',
    fill_blank: '✏️ Texte à trous',
    word_order: '🔀 Remise en ordre',
    matching: '🔗 Association',
    listening: '🎧 Écoute',
    dictation: '🎤 Dictée',
    pronunciation: '🔊 Prononciation',
    drag_drop: '↕️ Glisser-déposer',
  };
  return labels[type] ?? '📝 Exercice';
}

// ── STYLES PRINCIPAUX ────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  loadingText: { marginTop: SPACING.md, fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  errorEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  errorTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  errorDesc: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  backBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.full },
  backBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700' },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  livesRow: { flexDirection: 'row', gap: 2 },
  heart: { fontSize: 14 },
  heartEmpty: { opacity: 0.2 },

  exerciseWrap: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingTop: SPACING.xl },

  counter: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  typeLabel: {
    fontSize: 12, color: COLORS.primary, fontWeight: '700',
    letterSpacing: 0.5, marginBottom: SPACING.md,
  },
  question: {
    fontSize: 22, fontWeight: '800', color: COLORS.textPrimary,
    lineHeight: 30, marginBottom: SPACING.sm,
  },

  feedbackBar: {
    padding: SPACING.lg, paddingBottom: SPACING.xl,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    gap: SPACING.sm,
  },
  feedbackCorrect: { backgroundColor: COLORS.successLight },
  feedbackWrong: { backgroundColor: COLORS.errorLight },
  feedbackTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedbackIcon: { fontSize: 28 },
  feedbackTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  feedbackCorrectAnswer: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  feedbackExplanation: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  feedbackXP: { fontSize: 14, fontWeight: '800', color: COLORS.success },
  continueBtn: {
    backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  continueBtnWrong: { backgroundColor: COLORS.error },
  continueBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});