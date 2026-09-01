// ============================================================
// app/dictation/[id].tsx
// Écran de dictée — écouter et ordonner les mots
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
import * as Speech from 'expo-speech';
import { useGamification } from '@/hooks/useGamification';
import { getDictationById, DictationExercise, DictationSentence } from '@/content/dictations/dictations';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { shuffleArray } from '@/utils';

type DictationPhase = 'loading' | 'error' | 'intro' | 'listening' | 'writing' | 'feedback' | 'completed';

// Distracteurs génériques si on n'en a pas de spécifiques
const GENERIC_DISTRACTORS = ['jestem', 'bardzo', 'tutaj', 'teraz', 'dobrze', 'może'];

// ── Vérification de la réponse ────────────────────────────────
function verifyAnswer(userWords: string[], correctAnswer: string): {
  isCorrect: boolean;
  score: number;
} {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .trim();

  const userText = normalize(userWords.join(' '));
  const correctText = normalize(correctAnswer);

  const isCorrect = userText === correctText;
  const score = isCorrect ? 100 : 0; // Dans ce mode, c'est binaire ou presque

  return { isCorrect, score };
}

export default function DictationScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { awardXP } = useGamification();

  const [dictation, setDictation] = useState<DictationExercise | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<DictationPhase>('loading');

  // États pour le word-scramble
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [wordPool, setWordPool] = useState<string[]>([]);

  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState<Array<{
    sentence: DictationSentence;
    userAnswer: string;
    score: number;
    isCorrect: boolean;
  }>>([]);
  const [totalXP, setTotalXP] = useState(0);

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

  const current = dictation?.sentences[currentIndex];
  const maxPlays = 3;

  // Initialiser le pool de mots pour la phrase actuelle
  useEffect(() => {
    if (current && (phase === 'listening' || phase === 'writing')) {
      const cleanSentence = current.text.replace(/[.,!?;:]/g, '');
      const words = cleanSentence.split(/\s+/).filter(w => w.length > 0);

      if (words.length === 0) {
        setWordPool([]);
        setSelectedWords([]);
        return;
      }

      // Ajouter 2-3 distracteurs
      const distractorsCount = Math.floor(Math.random() * 2) + 2; // 2 ou 3
      const distractors = shuffleArray(GENERIC_DISTRACTORS).slice(0, distractorsCount);

      setWordPool(shuffleArray([...words, ...distractors]));
      setSelectedWords([]);
    }
  }, [currentIndex, phase, current]);

  const playSentence = useCallback(async (speed = 1.0) => {
    if (!current || isPlaying || playCount >= maxPlays) return;

    setIsPlaying(true);
    setPlayCount(prev => prev + 1);

    Speech.speak(current.text, {
      language: 'pl-PL',
      rate: speed,
      onDone: () => {
        setIsPlaying(false);
        if (phase === 'listening') setPhase('writing');
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

  const addWord = (word: string, poolIndex: number) => {
    if (phase !== 'writing') return;
    setSelectedWords([...selectedWords, word]);
    const newPool = [...wordPool];
    newPool.splice(poolIndex, 1);
    setWordPool(newPool);
  };

  const removeWord = (word: string, selectedIndex: number) => {
    if (phase !== 'writing') return;
    const newSelected = [...selectedWords];
    newSelected.splice(selectedIndex, 1);
    setSelectedWords(newSelected);
    setWordPool([...wordPool, word]);
  };

  const handleSubmit = () => {
    if (selectedWords.length === 0 || !current) return;

    const { isCorrect, score } = verifyAnswer(selectedWords, current.text);
    const result = { sentence: current, userAnswer: selectedWords.join(' '), score, isCorrect };
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
      awardXP(totalXP + (dictation?.xpReward ?? 0));
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
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'error' || !dictation) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <Text style={s.errorEmoji}>🛰️</Text>
          <Text style={s.errorTitle}>Dictée introuvable</Text>
          <TouchableOpacity style={s.backBtnFull} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Retourner apprendre</Text>
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
          <Text style={s.completedTitle}>Dictée terminée !</Text>
          <View style={s.completedStats}>
            <View style={s.completedStat}>
              <Text style={[s.completedStatVal, { color: COLORS.xpGold }]}>+{totalXP + dictation.xpReward}</Text>
              <Text style={s.completedStatLabel}>XP gagnés</Text>
            </View>
          </View>
          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={s.homeBtnTxt}>Retour à l'accueil →</Text>
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

      <ScrollView contentContainerStyle={s.exerciseWrap} showsVerticalScrollIndicator={false}>
        <Text style={s.phaseLabel}>
          {phase === 'listening' ? '🔊 Écoutez la phrase' :
           phase === 'writing' ? '🧩 Ordonnez les mots' :
           phase === 'feedback' ? (feedbackResult?.isCorrect ? '✅ Correct !' : '❌ Pas tout à fait...') : ''}
        </Text>

        {/* Boutons d'écoute */}
        <View style={s.playButtons}>
          <TouchableOpacity
            style={[s.playBtn, (isPlaying || playCount >= maxPlays) && s.playBtnDisabled]}
            onPress={() => playSentence(1.0)}
            disabled={isPlaying || playCount >= maxPlays || phase === 'feedback'}
          >
            {isPlaying ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.playBtnTxt}>🔊 Écouter ({playCount}/{maxPlays})</Text>}
          </TouchableOpacity>
        </View>

        {/* Zone de mots sélectionnés (Word Scramble Area) */}
        <Animated.View style={[s.selectedArea, { transform: [{ translateX: shakeAnim }] }]}>
          {selectedWords.length === 0 ? (
            <Text style={s.placeholderTxt}>Appuyez sur les mots ci-dessous...</Text>
          ) : (
            <View style={s.chipContainer}>
              {selectedWords.map((word, i) => (
                <TouchableOpacity key={`${word}-${i}`} style={s.wordChipSelected} onPress={() => removeWord(word, i)} disabled={phase === 'feedback'}>
                  <Text style={s.wordTextSelected}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Pool de mots (Word Pool Area) */}
        {phase === 'writing' && (
          <View style={s.poolArea}>
            <View style={s.chipContainer}>
              {wordPool.map((word, i) => (
                <TouchableOpacity key={`${word}-${i}`} style={s.wordChip} onPress={() => addWord(word, i)}>
                  <Text style={s.wordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Feedback détaillé */}
        {phase === 'feedback' && feedbackResult && (
          <Animated.View style={[s.feedbackBox, feedbackResult.isCorrect ? s.feedbackCorrect : s.feedbackWrong, { transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
            <Text style={s.feedbackLabel}>Phrase correcte :</Text>
            <Text style={s.feedbackText}>{feedbackResult.sentence.text}</Text>
            <Text style={s.feedbackTranslation}>{feedbackResult.sentence.translation}</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer fixe avec Safe Area */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        {phase === 'writing' && (
          <TouchableOpacity
            style={[s.submitBtn, selectedWords.length === 0 && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={selectedWords.length === 0}
          >
            <Text style={s.submitBtnTxt}>Vérifier →</Text>
          </TouchableOpacity>
        )}

        {phase === 'feedback' && (
          <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
            <Text style={s.nextBtnTxt}>{currentIndex + 1 >= dictation.sentences.length ? '🏁 Terminer' : 'Suivant →'}</Text>
          </TouchableOpacity>
        )}
      </View>
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

  selectedArea: {
    minHeight: 120, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, borderWidth: 2, borderColor: COLORS.surfaceAlt, borderStyle: 'dashed',
    justifyContent: 'center',
  },
  placeholderTxt: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14, fontStyle: 'italic' },

  poolArea: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: 'transparent',
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },

  wordChip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  wordText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },

  wordChipSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  wordTextSelected: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  feedbackBox: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: 6, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' },
  feedbackWrong: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '40' },
  feedbackLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  feedbackText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  feedbackTranslation: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },

  footer: { paddingHorizontal: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surfaceAlt },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  nextBtn: { backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
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
