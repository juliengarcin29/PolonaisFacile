// ============================================================
// app/quiz/[id].tsx
// Écran Quiz — timer, scoring, résultats animés
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { QUIZZES } from '@/content/quizzes/quizzes';
import type { QuizQuestion } from '@/types';

const { width } = Dimensions.get('window');

type QuizPhase = 'question' | 'feedback' | 'completed';

interface QuizState {
  score: number;
  correctCount: number;
  wrongCount: number;
  xpEarned: number;
  timeSpent: number;
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addXP } = useUserStore();

  // Trouver le quiz ou utiliser le premier par défaut
  const quiz = QUIZZES.find(q => q.id === id) ?? QUIZZES[0];
  const questions = quiz.questions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>('question');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [state, setState] = useState<QuizState>({
    score: 0, correctCount: 0, wrongCount: 0, xpEarned: 0, timeSpent: 0,
  });
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ?? 0);
  const [totalTime, setTotalTime] = useState(0);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = questions[currentIndex];

  // Timer total
  useEffect(() => {
    totalTimerRef.current = setInterval(() => {
      setTotalTime(prev => prev + 1);
    }, 1000);
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, []);

  // Timer par question (si activé)
  useEffect(() => {
    if (!quiz.timeLimit || phase !== 'question') return;
    setTimeLeft(quiz.timeLimit);

    Animated.timing(timerAnim, {
      toValue: 0,
      duration: quiz.timeLimit * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer('__timeout__');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, phase]);

  // Progression
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ((currentIndex) / questions.length) * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleAnswer = useCallback((answer: string) => {
    if (phase !== 'question') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = answer === current.correctAnswer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setPhase('feedback');

    if (!correct) shake();

    setState(prev => ({
      ...prev,
      score: correct ? prev.score + current.points : prev.score,
      correctCount: correct ? prev.correctCount + 1 : prev.correctCount,
      wrongCount: !correct ? prev.wrongCount + 1 : prev.wrongCount,
      xpEarned: correct ? prev.xpEarned + current.points : prev.xpEarned,
    }));

    Animated.spring(feedbackScale, {
      toValue: 1, friction: 5, tension: 100, useNativeDriver: true,
    }).start();
  }, [phase, current]);

  const nextQuestion = () => {
    feedbackScale.setValue(0);
    timerAnim.setValue(1);

    // Slide out et in
    Animated.timing(cardSlide, {
      toValue: -width, duration: 220, useNativeDriver: true,
    }).start(() => {
      setSelectedAnswer('');
      cardSlide.setValue(width);

      if (currentIndex + 1 >= questions.length) {
        if (totalTimerRef.current) clearInterval(totalTimerRef.current);
        setState(prev => ({ ...prev, timeSpent: totalTime }));
        addXP(state.xpEarned);
        setPhase('completed');
      } else {
        setCurrentIndex(prev => prev + 1);
        setPhase('question');
      }

      Animated.spring(cardSlide, {
        toValue: 0, friction: 8, useNativeDriver: true,
      }).start();
    });
  };

  if (phase === 'completed') {
    return (
      <QuizResults
        quiz={quiz}
        state={{ ...state, timeSpent: totalTime }}
        total={questions.length}
        onReplay={() => {
          setCurrentIndex(0);
          setPhase('question');
          setState({ score: 0, correctCount: 0, wrongCount: 0, xpEarned: 0, timeSpent: 0 });
          setTotalTime(0);
        }}
        onHome={() => router.replace('/(tabs)')}
      />
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100], outputRange: ['0%', '100%'],
  });

  const timerColor = timeLeft <= 5 ? COLORS.error : timeLeft <= 10 ? COLORS.warning : COLORS.primary;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressWidth }]} />
        </View>
        <View style={s.scoreChip}>
          <Text style={s.scoreTxt}>⭐ {state.score}</Text>
        </View>
      </View>

      {/* Timer (si activé) */}
      {quiz.timeLimit !== undefined && phase === 'question' && (
        <View style={s.timerWrap}>
          <Text style={[s.timerText, { color: timerColor }]}>{timeLeft}s</Text>
          <View style={s.timerTrack}>
            <Animated.View style={[
              s.timerFill,
              { backgroundColor: timerColor },
              { width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]} />
          </View>
        </View>
      )}

      {/* Question */}
      <Animated.View style={[s.cardWrap, {
        transform: [{ translateX: cardSlide }, { translateX: shakeAnim }],
      }]}>
        {/* Numéro */}
        <Text style={s.questionNum}>Question {currentIndex + 1}/{questions.length}</Text>

        {/* Type */}
        <Text style={s.questionType}>{getQuestionTypeLabel(current.type)}</Text>

        {/* Énoncé */}
        <Text style={s.questionText}>{current.question}</Text>

        {/* Options */}
        <View style={s.optionsWrap}>
          {(current.options ?? []).map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const correct = option === current.correctAnswer;
            const showResult = phase === 'feedback';

            let bg = COLORS.white;
            let border = '#E5E7EB';
            let textCol = COLORS.textPrimary;
            let icon = '';

            if (showResult && correct) {
              bg = COLORS.successLight; border = COLORS.success; textCol = COLORS.success; icon = ' ✓';
            } else if (showResult && isSelected && !correct) {
              bg = COLORS.errorLight; border = COLORS.error; textCol = COLORS.error; icon = ' ✗';
            } else if (isSelected && !showResult) {
              border = COLORS.primary; bg = '#FFF0F3';
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(option)}
                disabled={phase !== 'question'}
                activeOpacity={0.75}
              >
                <View style={[s.optionLetter, { borderColor: border }]}>
                  <Text style={[s.optionLetterTxt, { color: showResult && correct ? COLORS.success : COLORS.textMuted }]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[s.optionText, { color: textCol }]}>{option}{icon}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Feedback bar */}
      {phase === 'feedback' && (
        <Animated.View style={[
          s.feedbackBar,
          isCorrect ? s.feedbackOk : s.feedbackKo,
          { transform: [{ scale: feedbackScale }] },
        ]}>
          <View style={s.feedbackRow}>
            <Text style={s.feedbackEmoji}>{isCorrect ? '✅' : '❌'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.feedbackTitle}>
                {isCorrect ? 'Correct !' : 'Pas tout à fait...'}
              </Text>
              {!isCorrect && (
                <Text style={s.feedbackAnswer}>Réponse : {current.correctAnswer}</Text>
              )}
            </View>
            {isCorrect && (
              <Text style={s.feedbackXP}>+{current.points} pts</Text>
            )}
          </View>
          {current.explanation && (
            <Text style={s.feedbackExpl}>{current.explanation}</Text>
          )}
          <TouchableOpacity
            style={[s.nextBtn, !isCorrect && s.nextBtnKo]}
            onPress={nextQuestion}
          >
            <Text style={s.nextBtnTxt}>
              {currentIndex + 1 >= questions.length ? '🏁 Voir les résultats' : 'Question suivante →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ── ÉCRAN RÉSULTATS ──────────────────────────────────────────
function QuizResults({
  quiz, state, total, onReplay, onHome,
}: {
  quiz: typeof QUIZZES[0];
  state: QuizState;
  total: number;
  onReplay: () => void;
  onHome: () => void;
}) {
  const percentage = Math.round((state.correctCount / total) * 100);
  const passed = percentage >= quiz.passingScore;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const GRADE =
    percentage >= 90 ? { emoji: '🏆', label: 'Excellent !', color: '#D4AF37' } :
    percentage >= 75 ? { emoji: '⭐', label: 'Bien joué !', color: COLORS.success } :
    percentage >= 60 ? { emoji: '👍', label: 'Pas mal !', color: COLORS.info } :
                       { emoji: '💪', label: 'Continue !', color: COLORS.warning };

  return (
    <SafeAreaView style={r.safe}>
      <Animated.View style={[r.container, { transform: [{ scale: scaleAnim }] }]}>

        {/* Score circulaire simulé */}
        <View style={[r.scoreBadge, { borderColor: GRADE.color }]}>
          <Text style={r.scoreEmoji}>{GRADE.emoji}</Text>
          <Text style={[r.scorePct, { color: GRADE.color }]}>{percentage}%</Text>
        </View>

        <Text style={r.title}>{GRADE.label}</Text>
        <Text style={r.quizTitle}>{quiz.title}</Text>

        {/* Statut */}
        <View style={[r.statusBadge, { backgroundColor: passed ? COLORS.successLight : COLORS.errorLight }]}>
          <Text style={[r.statusText, { color: passed ? COLORS.success : COLORS.error }]}>
            {passed ? '✅ Quiz réussi !' : '❌ Pas encore réussi'}
          </Text>
        </View>

        {/* Stats détaillées */}
        <View style={r.statsGrid}>
          <View style={r.statBox}>
            <Text style={[r.statVal, { color: COLORS.success }]}>{state.correctCount}</Text>
            <Text style={r.statLabel}>✅ Correctes</Text>
          </View>
          <View style={r.statBox}>
            <Text style={[r.statVal, { color: COLORS.error }]}>{state.wrongCount}</Text>
            <Text style={r.statLabel}>❌ Incorrectes</Text>
          </View>
          <View style={r.statBox}>
            <Text style={[r.statVal, { color: COLORS.xpGold }]}>+{state.xpEarned}</Text>
            <Text style={r.statLabel}>⭐ XP gagnés</Text>
          </View>
          <View style={r.statBox}>
            <Text style={[r.statVal, { color: COLORS.info }]}>{formatTime(state.timeSpent)}</Text>
            <Text style={r.statLabel}>⏱ Temps</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={r.btnWrap}>
          <TouchableOpacity style={r.btnPrimary} onPress={onHome}>
            <Text style={r.btnPrimaryTxt}>Retour à l'accueil →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={r.btnSecondary} onPress={onReplay}>
            <Text style={r.btnSecondaryTxt}>🔄 Rejouer</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

// ── HELPERS ──────────────────────────────────────────────────
function getQuestionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    multiple_choice: '📝 Choix multiple',
    translation_fr_pl: '🇫🇷→🇵🇱 Traduction',
    translation_pl_fr: '🇵🇱→🇫🇷 Traduction',
    fill_blank: '✏️ Complétez',
    word_order: '🔀 Remise en ordre',
    matching: '🔗 Association',
    listening: '🎧 Écoute',
    dictation: '🎤 Dictée',
  };
  return map[type] ?? '📝 Question';
}

// ── STYLES ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  scoreChip: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  scoreTxt: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },

  timerWrap: { paddingHorizontal: SPACING.lg, paddingVertical: 8, alignItems: 'center', gap: 4 },
  timerText: { fontSize: 18, fontWeight: '900' },
  timerTrack: {
    width: '100%', height: 4, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: BORDER_RADIUS.full },

  cardWrap: { flex: 1, padding: SPACING.lg },
  questionNum: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  questionType: { fontSize: 12, color: COLORS.primary, fontWeight: '700', letterSpacing: 0.3, marginBottom: SPACING.md },
  questionText: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 30, marginBottom: SPACING.xl },

  optionsWrap: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2, backgroundColor: COLORS.white,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  optionLetter: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  optionLetterTxt: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },

  feedbackBar: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, paddingBottom: SPACING.xl, gap: 10,
  },
  feedbackOk: { backgroundColor: COLORS.successLight },
  feedbackKo: { backgroundColor: COLORS.errorLight },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedbackEmoji: { fontSize: 26 },
  feedbackTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  feedbackAnswer: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  feedbackXP: { fontSize: 16, fontWeight: '900', color: COLORS.success },
  feedbackExpl: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  nextBtn: {
    backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
  },
  nextBtnKo: { backgroundColor: COLORS.error },
  nextBtnTxt: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
});

const r = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.md,
  },
  scoreBadge: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    gap: 4,
  },
  scoreEmoji: { fontSize: 40 },
  scorePct: { fontSize: 32, fontWeight: '900' },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary },
  quizTitle: { fontSize: 14, color: COLORS.textSecondary },
  statusBadge: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: { fontSize: 14, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    width: '100%', justifyContent: 'center',
  },
  statBox: {
    width: '44%', backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    alignItems: 'center', gap: 4,
  },
  statVal: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  btnWrap: { width: '100%', gap: 10 },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  btnSecondary: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
  },
  btnSecondaryTxt: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
