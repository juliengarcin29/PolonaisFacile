// ============================================================
// app/dictation/[id].tsx
// Écran de dictée — écouter et écrire le texte
// Fonctionnalité Premium
// ============================================================

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  Animated, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { useGamification } from '@/hooks/useGamification';
import { getDictationById, DictationExercise, DictationSentence } from '@/content/dictations/dictations';
import WordOrderExercise from '@/components/exercises/WordOrderExercise';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

type DictationPhase = 'loading' | 'error' | 'intro' | 'listening' | 'writing' | 'feedback' | 'completed';

// ── Vérification de la réponse ────────────────────────────────
function verifyAnswer(userInput: string, correctAnswer: string): {
  isCorrect: boolean;
  score: number;
} {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .trim();

  const isCorrect = normalize(userInput) === normalize(correctAnswer);
  const score = isCorrect ? 100 : 0;

  return { isCorrect, score };
}

export default function DictationScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { awardXP, recordDailyActivity } = useGamification();

  const [dictation, setDictation] = useState<DictationExercise | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<DictationPhase>('loading');

  const [wordOrderAnswer, setWordOrderAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState<Array<{
    sentence: DictationSentence;
    userAnswer: string;
    score: number;
    isCorrect: boolean;
  }>>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [startTime] = useState(Date.now());

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Charger la dictée
  useEffect(() => {
    if (id) {
      const data = getDictationById(id);
      if (data) {
        setDictation(data);
        setPhase('intro');
      } else {
        setPhase('error');
      }
    }
  }, [id]);

  // Reset input when moving to a new exercise
  useEffect(() => {
    setWordOrderAnswer([]);
  }, [currentIndex]);

  const current = dictation?.sentences[currentIndex];

  // ── Mots et Intrus ───────────────────────────────────────
  // Liste globale de mots polonais plausibles extraits du Module 1
  const GLOBAL_PO_WORDS = [
    'Dzień', 'dobry', 'Cześć', 'Tak', 'Nie', 'Proszę', 'Dziękuję', 'Przepraszam',
    'Jestem', 'nazywam', 'się', 'Jak', 'masz', 'na', 'imię', 'Bardzo', 'mi', 'miło',
    'Co', 'słychać', 'Dobrze', 'źle', 'nauczyciel', 'uczeń', 'kobieta', 'mężczyzna'
  ];

  const { wordsData, requiredCount } = useMemo(() => {
    if (!current) return { wordsData: [], requiredCount: 0 };

    // 1. Nettoyer et découper la phrase correcte
    const realWords = current.text.replace(/[.,!?;:]/g, "").split(" ").filter(w => w.length > 0);

    // 2. Choisir 3 intrus dans la banque globale qui ne sont pas dans la phrase
    const intruders = GLOBAL_PO_WORDS
      .filter(w => !realWords.some(rw => rw.toLowerCase() === w.toLowerCase()))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // 3. Mélanger le tout
    const allWords = [...realWords, ...intruders].sort(() => Math.random() - 0.5);

    return {
      wordsData: allWords,
      requiredCount: realWords.length
    };
  }, [current?.text]);

  useEffect(() => {
    if (phase === 'listening' || phase === 'intro' || phase === 'writing') {
      setAvailableWords(wordsData);
      setWordOrderAnswer([]);
    }
  }, [wordsData]);

  const maxPlays = 3;

  const playSentence = useCallback(async (speed = 1.0) => {
    if (!current || isPlaying || playCount >= maxPlays) return;

    setIsPlaying(true);
    setPlayCount(prev => prev + 1);

    Speech.speak(current.text, {
      language: 'pl-PL',
      rate: speed,
      onDone: () => {
        setIsPlaying(false);
        if (phase === 'listening' || phase === 'intro') setPhase('writing');
      },
      onError: () => setIsPlaying(false),
    });
  }, [current, isPlaying, playCount, phase]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = (answer?: string) => {
    if (!current) return;

    // Si answer est fourni (par WordOrderExercise), on l'utilise, sinon on prend le state
    const finalAnswer = answer || wordOrderAnswer.join(' ');
    if (!finalAnswer.trim()) return;

    const { isCorrect, score } = verifyAnswer(finalAnswer, current.text);
    const result = { sentence: current, userAnswer: finalAnswer.trim(), score, isCorrect };
    setResults(prev => [...prev, result]);

    const xpEarned = isCorrect ? 30 : 5;
    setTotalXP(prev => prev + xpEarned);

    if (isCorrect) {
      Animated.spring(successAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    } else {
      shake();
    }
    setPhase('feedback');
  };

  const handleNext = () => {
    successAnim.setValue(0);
    setPlayCount(0);

    if (currentIndex + 1 >= (dictation?.sentences.length ?? 0)) {
      const finalXP = totalXP + (dictation?.xpReward ?? 0);
      awardXP(finalXP, '🎤 Dictée terminée !');
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      recordDailyActivity(Math.round(timeSpent / 60));
      setPhase('completed');
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('listening');
    }
  };

  if (phase === 'loading') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>{t('dictation_screen.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'error' || !dictation) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <Text style={s.errorEmoji}>🛰️</Text>
          <Text style={s.errorTitle}>{t('dictation_screen.error_title')}</Text>
          <TouchableOpacity style={s.backBtnFull} onPress={() => router.back()}>
            <Text style={s.backBtnText}>{t('dictation_screen.error_btn')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'completed') {
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.completedWrap}>
          <Text style={s.completedEmoji}>{avgScore >= 70 ? '🏆' : '💪'}</Text>
          <Text style={s.completedTitle}>{t('dictation_screen.completed_title')}</Text>
          <View style={s.completedStats}>
            <View style={s.completedStat}>
              <Text style={[s.completedStatVal, { color: COLORS.xpGold }]}>+{totalXP + dictation.xpReward}</Text>
              <Text style={s.completedStatLabel}>{t('dictation_screen.stat_xp')}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={s.homeBtnTxt}>{t('dictation_screen.btn_home')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const feedbackResult = phase === 'feedback' && results.length > 0 ? results[results.length - 1] : null;

  return (
    <View style={s.safe}>
      {/* Header avec Safe Area */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${((currentIndex) / dictation.sentences.length) * 100}%` }]} />
        </View>
        <Text style={s.progressTxt}>{currentIndex + 1}/{dictation.sentences.length}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.exerciseWrap, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.phaseLabel}>
            {phase === 'listening' || phase === 'intro' ? t('dictation_screen.phase_listening') :
             phase === 'writing' ? t('dictation_screen.phase_writing') :
             phase === 'feedback' ? (feedbackResult?.isCorrect ? t('dictation_screen.feedback_correct') : t('dictation_screen.feedback_wrong')) : ''}
          </Text>

          {/* Boutons d'écoute */}
          <View style={s.playButtons}>
            <TouchableOpacity
              style={[s.playBtn, (isPlaying || playCount >= maxPlays) && s.playBtnDisabled]}
              onPress={() => playSentence(1.0)}
              disabled={isPlaying || playCount >= maxPlays || phase === 'feedback'}
            >
              {isPlaying ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.playBtnTxt}>{t('dictation_screen.btn_listen', { done: playCount, total: maxPlays })}</Text>}
            </TouchableOpacity>
          </View>

          {/* Saisie par remise en ordre (Remplace le TextInput) */}
          {(phase === 'writing' || phase === 'feedback') && (
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <WordOrderExercise
                exercise={{
                   id: current?.text || '',
                   type: 'word_order',
                   question: '',
                   correctAnswer: current?.text.replace(/[.,!?;:]/g, "") || '',
                   words: wordsData,
                   xpReward: 30
                } as any}
                wordOrderAnswer={wordOrderAnswer}
                setWordOrderAnswer={setWordOrderAnswer}
                availableWords={availableWords}
                setAvailableWords={setAvailableWords}
                onSubmit={handleSubmit}
                phase={phase === 'feedback' ? 'feedback_correct' : 'exercise'}
                requiredCount={requiredCount}
              />
            </Animated.View>
          )}

          {/* Feedback détaillé */}
          {phase === 'feedback' && feedbackResult && (
            <Animated.View style={[s.feedbackBox, feedbackResult.isCorrect ? s.feedbackCorrect : s.feedbackWrong, { transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
              <Text style={s.feedbackLabel}>{t('dictation_screen.correct_label')}</Text>
              <Text style={s.feedbackText}>{feedbackResult.sentence.text}</Text>
              <Text style={s.feedbackTranslation}>{feedbackResult.sentence.translation}</Text>
            </Animated.View>
          )}

          {/* Boutons d'action — Le bouton de validation est maintenant géré par WordOrderExercise */}
          <View style={s.actionArea}>
            {phase === 'feedback' && (
              <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
                <Text style={s.nextBtnTxt}>{currentIndex + 1 >= dictation.sentences.length ? t('dictation_screen.btn_finish') : t('dictation_screen.btn_next')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  progressTrack: { flex: 1, height: 8, backgroundColor: COLORS.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  progressTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  exerciseWrap: { padding: SPACING.lg, gap: SPACING.xl },
  phaseLabel: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: COLORS.textPrimary },

  playButtons: { alignItems: 'center' },
  playBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 14, paddingHorizontal: SPACING.xl, minWidth: 180, alignItems: 'center', elevation: 2 },
  playBtnDisabled: { opacity: 0.5 },
  playBtnTxt: { color: COLORS.white, fontSize: 15, fontWeight: '800' },

  textInput: {
    minHeight: 100,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  textInputCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  textInputWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },

  feedbackBox: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: 6, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' },
  feedbackWrong: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '40' },
  feedbackLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  feedbackText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  feedbackTranslation: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },

  actionArea: { marginTop: SPACING.md },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  nextBtn: { backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  nextBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  completedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  completedEmoji: { fontSize: 72 },
  completedTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  completedStats: { marginVertical: SPACING.lg },
  completedStat: { alignItems: 'center' },
  completedStatVal: { fontSize: 40, fontWeight: '900' },
  completedStatLabel: { fontSize: 12, color: COLORS.textMuted },
  homeBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, paddingHorizontal: SPACING.xxl, width: '100%', alignItems: 'center' },
  homeBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  errorEmoji: { fontSize: 64, marginBottom: SPACING.md },
  errorTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  backBtnFull: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.full, marginTop: 20 },
  backBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
