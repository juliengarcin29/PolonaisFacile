// ============================================================
// app/lesson/[id].tsx
// Écran de leçon — moteur d'exercices complet
// ============================================================

import { BORDER_RADIUS, COLORS, GAMIFICATION, SPACING } from '@/constants';
import { useUserStore } from '@/store/userStore';
import { getLessonById } from '@/content/lessons';
import type { Exercise, ExerciseAnswer, Lesson } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView, Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

const { width } = Dimensions.get('window');

type LessonPhase = 'loading' | 'error' | 'exercise' | 'feedback_correct' | 'feedback_wrong' | 'completed';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addXP, user } = useUserStore();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<LessonPhase>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answers, setAnswers] = useState<ExerciseAnswer[]>([]);
  const [lives, setLives] = useState(user?.hearts ?? 5);
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
      duration: 300,
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
    feedbackAnim.setValue(0);
    setSelectedAnswer('');
    setMatchSelected({});

    if (currentIndex + 1 >= exercises.length) {
      setPhase('completed');
      addXP(xpEarned);
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
          <Text style={styles.loadingText}>Chargement de la leçon...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'error' || !current) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🛰️</Text>
          <Text style={styles.errorTitle}>Leçon introuvable</Text>
          <Text style={styles.errorDesc}>Désolé, nous n'avons pas pu charger le contenu de cette leçon.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retourner aux modules</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'completed') {
    return <CompletedScreen score={score} total={exercises.length} xpEarned={xpEarned} lessonId={id} />;
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header : progression + vies + fermer */}
        <View style={styles.header}>
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
            <Text style={styles.typeLabel}>{getTypeLabel(current.type)}</Text>

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
              phase === 'feedback_correct' ? styles.feedbackCorrect : styles.feedbackWrong,
              { transform: [{ scale: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] },
            ]}
          >
            <View style={styles.feedbackTop}>
              <Text style={styles.feedbackIcon}>{phase === 'feedback_correct' ? '✅' : '❌'}</Text>
              <View>
                <Text style={styles.feedbackTitle}>
                  {phase === 'feedback_correct' ? 'Correct !' : 'Pas tout à fait...'}
                </Text>
                {phase === 'feedback_wrong' && (
                  <Text style={styles.feedbackCorrectAnswer}>
                    Bonne réponse : {current.correctAnswer}
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
                {currentIndex + 1 >= exercises.length ? 'Terminer la leçon →' : 'Continuer →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── COMPOSANT : QCM ──────────────────────────────────────────
function MultipleChoiceExercise({
  exercise, selectedAnswer, phase, onAnswer,
}: {
  exercise: Exercise;
  selectedAnswer: string;
  phase: LessonPhase;
  onAnswer: (answer: string) => void;
}) {
  const options = exercise.options ?? [];

  return (
    <View style={mc.container}>
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === exercise.correctAnswer;
        const showResult = phase !== 'exercise';

        let bgColor = COLORS.white;
        let borderColor = COLORS.surfaceAlt;
        let textColor = COLORS.textPrimary;

        if (showResult && isCorrect) {
          bgColor = COLORS.successLight;
          borderColor = COLORS.success;
          textColor = COLORS.success;
        } else if (showResult && isSelected && !isCorrect) {
          bgColor = COLORS.errorLight;
          borderColor = COLORS.error;
          textColor = COLORS.error;
        } else if (isSelected) {
          borderColor = COLORS.primary;
        }

        return (
          <TouchableOpacity
            key={`${option}_${index}`}
            style={[mc.option, { backgroundColor: bgColor, borderColor }]}
            onPress={() => phase === 'exercise' && onAnswer(option)}
            disabled={phase !== 'exercise'}
          >
            <Text style={[mc.optionText, { color: textColor }]}>{option}</Text>
            {showResult && isCorrect && <Text style={mc.tick}>✓</Text>}
            {showResult && isSelected && !isCorrect && <Text style={mc.cross}>✗</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const mc = StyleSheet.create({
  container: { gap: 12, marginTop: SPACING.lg },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2, borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)' },
      default: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    }),
  },
  optionText: { fontSize: 16, fontWeight: '600', flex: 1 },
  tick: { fontSize: 18, color: COLORS.success },
  cross: { fontSize: 18, color: COLORS.error },
});

// ── COMPOSANT : ASSOCIATION ──────────────────────────────────
function MatchingExercise({
  exercise, matchSelected, setMatchSelected, matchedPairs, setMatchedPairs, onComplete,
}: {
  exercise: Exercise;
  matchSelected: { left?: string; right?: string };
  setMatchSelected: (v: { left?: string; right?: string }) => void;
  matchedPairs: string[];
  setMatchedPairs: (v: string[]) => void;
  onComplete: () => void;
}) {
  const pairs = exercise.pairs ?? [];

  const handleLeft = (item: string) => {
    if (matchedPairs.includes(item)) return;
    setMatchSelected({ ...matchSelected, left: item });
    tryMatch({ ...matchSelected, left: item });
  };

  const handleRight = (item: string) => {
    if (matchedPairs.some(p => p.includes(item))) return;
    setMatchSelected({ ...matchSelected, right: item });
    tryMatch({ ...matchSelected, right: item });
  };

  const tryMatch = (sel: { left?: string; right?: string }) => {
    if (!sel.left || !sel.right) return;
    const pair = pairs.find(p => p.left === sel.left && p.right === sel.right);
    if (pair) {
      const newMatched = [...matchedPairs, sel.left, sel.right];
      setMatchedPairs(newMatched);
      setMatchSelected({});
      if (newMatched.length === pairs.length * 2) {
        setTimeout(onComplete, 400);
      }
    } else {
      setMatchSelected({});
    }
  };

  const lefts = pairs.map(p => p.left);
  const rights = pairs.map(p => p.right).sort(() => Math.random() - 0.5);

  return (
    <View style={mat.container}>
      <View style={mat.columns}>
        <View style={mat.col}>
          {lefts.map((item, i) => {
            const matched = matchedPairs.includes(item);
            const selected = matchSelected.left === item;
            return (
              <TouchableOpacity
                key={`left_${item}_${i}`}
                style={[mat.chip, selected && mat.chipSelected, matched && mat.chipMatched]}
                onPress={() => handleLeft(item)}
                disabled={matched}
              >
                <Text style={[mat.chipText, matched && mat.chipTextMatched]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={mat.col}>
          {rights.map((item, i) => {
            const matched = matchedPairs.includes(item);
            const selected = matchSelected.right === item;
            return (
              <TouchableOpacity
                key={`right_${item}_${i}`}
                style={[mat.chip, selected && mat.chipSelected, matched && mat.chipMatched]}
                onPress={() => handleRight(item)}
                disabled={matched}
              >
                <Text style={[mat.chipText, matched && mat.chipTextMatched]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Text style={mat.hint}>Associez chaque mot à sa traduction</Text>
    </View>
  );
}

const mat = StyleSheet.create({
  container: { marginTop: SPACING.lg },
  columns: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 10 },
  chip: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E5E7EB', minHeight: 52,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' },
      default: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    }),
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF0F3' },
  chipMatched: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  chipTextMatched: { color: COLORS.success },
  hint: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.md },
});

// ── COMPOSANT : REMISE EN ORDRE ──────────────────────────────
function WordOrderExercise({
  exercise, wordOrderAnswer, setWordOrderAnswer,
  availableWords, setAvailableWords, onSubmit, phase,
}: {
  exercise: Exercise;
  wordOrderAnswer: string[];
  setWordOrderAnswer: (v: string[]) => void;
  availableWords: string[];
  setAvailableWords: (v: string[]) => void;
  onSubmit: (answer: string) => void;
  phase: LessonPhase;
}) {
  const addWord = (word: string, index: number) => {
    if (phase !== 'exercise') return;
    setWordOrderAnswer([...wordOrderAnswer, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const removeWord = (index: number) => {
    if (phase !== 'exercise') return;
    const word = wordOrderAnswer[index];
    setAvailableWords([...availableWords, word]);
    setWordOrderAnswer(wordOrderAnswer.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit(wordOrderAnswer.join(' '));
  };

  return (
    <View style={wo.container}>
      {/* Zone de réponse */}
      <View style={wo.answerZone}>
        {wordOrderAnswer.length === 0 ? (
          <Text style={wo.placeholder}>Placez les mots ici</Text>
        ) : (
          <View style={wo.wordRow}>
            {wordOrderAnswer.map((word, i) => (
              <TouchableOpacity key={`ans_${word}_${i}`} style={wo.wordChipAnswer} onPress={() => removeWord(i)}>
                <Text style={wo.wordChipAnswerText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Mots disponibles */}
      <View style={wo.wordBank}>
        {availableWords.map((word, i) => (
          <TouchableOpacity key={`avail_${word}_${i}`} style={wo.wordChip} onPress={() => addWord(word, i)}>
            <Text style={wo.wordChipText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bouton valider */}
      {wordOrderAnswer.length === (exercise.words?.length ?? 0) && phase === 'exercise' && (
        <TouchableOpacity style={wo.submitBtn} onPress={handleSubmit}>
          <Text style={wo.submitBtnText}>Vérifier →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const wo = StyleSheet.create({
  container: { marginTop: SPACING.lg },
  answerZone: {
    minHeight: 64, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
    marginBottom: SPACING.lg, justifyContent: 'center',
  },
  placeholder: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChipAnswer: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  wordChipAnswerText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  wordChip: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 2, borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.05)' },
      default: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    }),
  },
  wordChipText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

// ── ÉCRAN RÉSULTAT ───────────────────────────────────────────
function CompletedScreen({ score, total, xpEarned, lessonId }: { score: number; total: number; xpEarned: number; lessonId: string }) {
  const percentage = Math.round((score / total) * 100);
  const isPerfect = score === total;

  return (
    <SafeAreaView style={res.safe}>
      <View style={res.container}>
        <Text style={res.emoji}>{isPerfect ? '🏆' : percentage >= 70 ? '⭐' : '💪'}</Text>
        <Text style={res.title}>
          {isPerfect ? 'Parfait !' : percentage >= 70 ? 'Bien joué !' : 'Continue !'}
        </Text>

        <View style={res.statsRow}>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.success }]}>{score}/{total}</Text>
            <Text style={res.statLabel}>Bonnes réponses</Text>
          </View>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.xpGold }]}>+{xpEarned}</Text>
            <Text style={res.statLabel}>XP gagnés</Text>
          </View>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.primary }]}>{percentage}%</Text>
            <Text style={res.statLabel}>Score</Text>
          </View>
        </View>

        {isPerfect && (
          <View style={res.bonusBox}>
            <Text style={res.bonusText}>🎉 Bonus Parfait ! +{GAMIFICATION.XP_PER_PERFECT} XP supplémentaires</Text>
          </View>
        )}

        <TouchableOpacity style={res.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={res.homeBtnText}>Retour à l'accueil →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={res.replayBtn} onPress={() => router.replace(`/lesson/${lessonId}`)}>
          <Text style={res.replayBtnText}>Rejouer la leçon</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const res = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 72, marginBottom: SPACING.md },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.xl },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: SPACING.xl },
  statBox: {
    flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  bonusBox: {
    backgroundColor: '#FEF3C7', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.xl,
  },
  bonusText: { fontSize: 14, fontWeight: '700', color: '#92400E', textAlign: 'center' },
  homeBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, paddingHorizontal: SPACING.xxl,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  homeBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  replayBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, width: '100%', alignItems: 'center',
  },
  replayBtnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});

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