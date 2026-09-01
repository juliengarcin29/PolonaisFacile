// ============================================================
// app/dictation/[id].tsx
// Écran de dictée — écouter et écrire en polonais
// Fonctionnalité Premium
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  Animated, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';
import { getDictationById, DictationExercise, DictationSentence } from '@/content/dictations/dictations';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

type DictationPhase = 'loading' | 'error' | 'intro' | 'listening' | 'writing' | 'feedback' | 'completed';

// ── Vérification de la réponse ────────────────────────────────
function checkAnswer(userAnswer: string, correctAnswer: string): {
  isCorrect: boolean;
  score: number;
  errors: Array<{ word: string; position: number; type: 'missing' | 'wrong' | 'extra' }>;
} {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .trim()
      .split(/\s+/);

  const userWords = normalize(userAnswer);
  const correctWords = normalize(correctAnswer);

  const errors: Array<{ word: string; position: number; type: 'missing' | 'wrong' | 'extra' }> = [];
  let correctCount = 0;

  correctWords.forEach((word, i) => {
    if (i < userWords.length) {
      if (userWords[i] === word) {
        correctCount++;
      } else {
        errors.push({ word, position: i, type: 'wrong' });
      }
    } else {
      errors.push({ word, position: i, type: 'missing' });
    }
  });

  userWords.forEach((word, i) => {
    if (i >= correctWords.length) {
      errors.push({ word, position: i, type: 'extra' });
    }
  });

  const score = Math.round((correctCount / correctWords.length) * 100);
  const isCorrect = score >= 85; // 85% de tolérance

  return { isCorrect, score, errors };
}

// ── Composant principal ──────────────────────────────────────
export default function DictationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { awardXP } = useGamification();

  const [dictation, setDictation] = useState<DictationExercise | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<DictationPhase>('loading');
  const [userInput, setUserInput] = useState('');
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState<Array<{
    sentence: DictationSentence;
    userAnswer: string;
    score: number;
    isCorrect: boolean;
  }>>([]);
  const [showHint, setShowHint] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

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

  const handleSubmit = () => {
    if (!userInput.trim() || !current) return;

    const { isCorrect, score } = checkAnswer(userInput, current.text);
    const result = { sentence: current, userAnswer: userInput.trim(), score, isCorrect };
    setResults(prev => [...prev, result]);

    const xpEarned = Math.round((score / 100) * 30);
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
    setUserInput('');
    setPlayCount(0);
    setShowHint(false);

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
          <Text style={s.loadingText}>Chargement de la dictée...</Text>
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
          <Text style={s.errorDesc}>Désolé, nous n'avons pas pu charger cette dictée.</Text>
          <TouchableOpacity style={s.backBtnFull} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Retourner apprendre</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'completed') {
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
    const perfectCount = results.filter(r => r.score === 100).length;

    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.completedWrap}>
          <Text style={s.completedEmoji}>{avgScore >= 90 ? '🏆' : avgScore >= 70 ? '⭐' : '💪'}</Text>
          <Text style={s.completedTitle}>Dictée terminée !</Text>
          <Text style={s.completedScore}>{avgScore}%</Text>
          <Text style={s.completedSub}>Score moyen</Text>

          <View style={s.completedStats}>
            <View style={s.completedStat}>
              <Text style={[s.completedStatVal, { color: COLORS.success }]}>{perfectCount}</Text>
              <Text style={s.completedStatLabel}>Parfaites</Text>
            </View>
            <View style={s.completedStat}>
              <Text style={[s.completedStatVal, { color: COLORS.xpGold }]}>+{totalXP + dictation.xpReward}</Text>
              <Text style={s.completedStatLabel}>XP gagnés</Text>
            </View>
            <View style={s.completedStat}>
              <Text style={[s.completedStatVal, { color: COLORS.primary }]}>{results.length}</Text>
              <Text style={s.completedStatLabel}>Phrases</Text>
            </View>
          </View>

          <Text style={s.detailTitle}>Détail des phrases</Text>
          {results.map((result, i) => (
            <View key={i} style={[s.resultRow, { borderLeftColor: result.isCorrect ? COLORS.success : COLORS.error }]}>
              <View style={s.resultHeader}>
                <Text style={s.resultNum}>Phrase {i + 1}</Text>
                <Text style={[s.resultScore, { color: result.isCorrect ? COLORS.success : COLORS.error }]}>{result.score}%</Text>
              </View>
              <Text style={s.resultCorrect}>{result.sentence.text}</Text>
              <Text style={s.resultUser}>Votre réponse : {result.userAnswer}</Text>
              <Text style={s.resultTranslation}>{result.sentence.translation}</Text>
            </View>
          ))}

          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={s.homeBtnTxt}>Retour à l'accueil →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.retryBtn} onPress={() => {
            setCurrentIndex(0);
            setPhase('intro');
            setResults([]);
            setTotalXP(0);
          }}>
            <Text style={s.retryBtnTxt}>🔄 Recommencer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const feedbackResult = phase === 'feedback' && results.length > 0 ? results[results.length - 1] : null;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.backTxt}>✕</Text></TouchableOpacity>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${((currentIndex) / dictation.sentences.length) * 100}%` }]} />
          </View>
          <Text style={s.progressTxt}>{currentIndex + 1}/{dictation.sentences.length}</Text>
        </View>

        <ScrollView contentContainerStyle={s.exerciseWrap}>
          <Text style={s.phaseLabel}>
            {phase === 'listening' ? '🔊 Écoutez la phrase' :
             phase === 'writing' ? '✍️ Écrivez ce que vous avez entendu' :
             phase === 'feedback' ? (feedbackResult?.isCorrect ? '✅ Correct !' : '❌ Pas tout à fait...') : ''}
          </Text>

          <View style={s.playCountRow}>
            {Array.from({ length: maxPlays }).map((_, i) => (
              <View key={i} style={[s.playDot, i < playCount && s.playDotUsed]} />
            ))}
            <Text style={s.playCountTxt}>{playCount}/{maxPlays} écoutes</Text>
          </View>

          <View style={s.playButtons}>
            <TouchableOpacity
              style={[s.playBtn, (isPlaying || playCount >= maxPlays) && s.playBtnDisabled]}
              onPress={() => playSentence(1.0)}
              disabled={isPlaying || playCount >= maxPlays || phase === 'feedback'}
            >
              {isPlaying ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.playBtnTxt}>🔊 Écouter</Text>}
            </TouchableOpacity>

            {playCount > 0 && phase === 'writing' && (
              <TouchableOpacity
                style={[s.playBtnSlow, isPlaying && s.playBtnDisabled]}
                onPress={() => playSentence(0.65)}
                disabled={isPlaying || playCount >= maxPlays}
              >
                <Text style={s.playBtnSlowTxt}>🐢 Lent</Text>
              </TouchableOpacity>
            )}
          </View>

          {phase === 'writing' && current && (
            <View style={s.hintWrap}>
              <TouchableOpacity style={s.hintBtn} onPress={() => setShowHint(true)}>
                <Text style={s.hintBtnTxt}>{showHint ? `💡 ${current.translation}` : '💡 Voir l\'indice (-5 XP)'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {(phase === 'writing' || phase === 'feedback') && (
            <Animated.View style={[s.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
              <TextInput
                ref={inputRef}
                style={[s.textInput, phase === 'feedback' && feedbackResult?.isCorrect && s.textInputCorrect, phase === 'feedback' && !feedbackResult?.isCorrect && s.textInputWrong]}
                value={userInput}
                onChangeText={setUserInput}
                placeholder="Écrivez la phrase en polonais..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                editable={phase === 'writing'}
                autoCapitalize="sentences"
                autoFocus={phase === 'writing'}
              />
            </Animated.View>
          )}

          {phase === 'feedback' && feedbackResult && (
            <Animated.View style={[s.feedbackBox, feedbackResult.isCorrect ? s.feedbackCorrect : s.feedbackWrong, { transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
              <Text style={s.feedbackScore}>Score : {feedbackResult.score}%</Text>
              <Text style={s.feedbackLabel}>Réponse correcte :</Text>
              <Text style={s.feedbackText}>{feedbackResult.sentence.text}</Text>
              <Text style={s.feedbackTranslation}>{feedbackResult.sentence.translation}</Text>
            </Animated.View>
          )}

          {phase === 'writing' && (
            <TouchableOpacity style={[s.submitBtn, !userInput.trim() && s.submitBtnDisabled]} onPress={handleSubmit} disabled={!userInput.trim()}>
              <Text style={s.submitBtnTxt}>Vérifier →</Text>
            </TouchableOpacity>
          )}

          {phase === 'feedback' && (
            <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
              <Text style={s.nextBtnTxt}>{currentIndex + 1 >= dictation.sentences.length ? '🏁 Voir les résultats' : 'Phrase suivante →'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  loadingText: { marginTop: SPACING.md, fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  errorEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  errorTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  errorDesc: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  backBtnFull: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.full },
  backBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  backTxt: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '700', width: 32 },
  progressTrack: { flex: 1, height: 8, backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  progressTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  introWrap: { flex: 1, alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  introEmoji: { fontSize: 64 },
  introTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  introDiff: { fontSize: 13, color: COLORS.textMuted },
  introRules: { width: '100%', gap: 10, marginVertical: SPACING.md },
  introRule: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surfaceAlt },
  introRuleTxt: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  startBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, paddingHorizontal: SPACING.xl, width: '100%', alignItems: 'center' },
  startBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  exerciseWrap: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 40 },
  phaseLabel: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  playCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  playDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.surfaceAlt, borderWidth: 1.5, borderColor: '#D1D5DB' },
  playDotUsed: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  playCountTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginLeft: 4 },
  playButtons: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  playBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 14, paddingHorizontal: SPACING.xl, minWidth: 140, alignItems: 'center', elevation: 4 },
  playBtnSlow: { backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full, paddingVertical: 14, paddingHorizontal: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.primary + '40' },
  playBtnDisabled: { opacity: 0.4 },
  playBtnTxt: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  playBtnSlowTxt: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  hintWrap: { alignItems: 'center' },
  hintBtn: { backgroundColor: COLORS.warningLight, borderRadius: BORDER_RADIUS.lg, paddingVertical: 10, paddingHorizontal: SPACING.lg, borderWidth: 1, borderColor: COLORS.warning + '40' },
  hintBtnTxt: { fontSize: 13, color: COLORS.warning, fontWeight: '600' },
  inputWrap: { width: '100%' },
  textInput: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, fontSize: 16, color: COLORS.textPrimary, minHeight: 100, textAlignVertical: 'top', borderWidth: 2, borderColor: COLORS.surfaceAlt },
  textInputCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  textInputWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  feedbackBox: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: 6, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' },
  feedbackWrong: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '40' },
  feedbackScore: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
  feedbackLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginTop: 4 },
  feedbackText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 24 },
  feedbackTranslation: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  nextBtn: { backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  nextBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  completedWrap: { padding: SPACING.xl, gap: SPACING.md, alignItems: 'center' },
  completedEmoji: { fontSize: 72 },
  completedTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary },
  completedScore: { fontSize: 56, fontWeight: '900', color: COLORS.primary },
  completedSub: { fontSize: 14, color: COLORS.textMuted },
  completedStats: { flexDirection: 'row', gap: 24, marginVertical: SPACING.md },
  completedStat: { alignItems: 'center', gap: 4 },
  completedStatVal: { fontSize: 32, fontWeight: '900' },
  completedStatLabel: { fontSize: 12, color: COLORS.textMuted },
  detailTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, alignSelf: 'flex-start', marginTop: SPACING.md },
  resultRow: { width: '100%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderLeftWidth: 4, gap: 4 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  resultNum: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  resultScore: { fontSize: 13, fontWeight: '800' },
  resultCorrect: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  resultUser: { fontSize: 13, color: COLORS.textSecondary },
  resultTranslation: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  homeBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, paddingHorizontal: SPACING.xl, width: '100%', alignItems: 'center', marginTop: SPACING.md },
  homeBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  retryBtn: { backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full, paddingVertical: 14, width: '100%', alignItems: 'center' },
  retryBtnTxt: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
