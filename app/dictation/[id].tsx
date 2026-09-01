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
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

// ── Contenu des dictées ──────────────────────────────────────
interface DictationExercise {
  id: string;
  title: string;
  difficulty: 'A1' | 'A2' | 'B1';
  sentences: DictationSentence[];
  xpReward: number;
}

interface DictationSentence {
  id: string;
  text: string;           // Texte polonais à dicter
  translation: string;    // Traduction française (indice)
  hint?: string;          // Indice optionnel
}

const DICTATIONS: DictationExercise[] = [
  {
    id: 'dictation_01',
    title: 'Salutations du quotidien',
    difficulty: 'A1',
    xpReward: 100,
    sentences: [
      {
        id: 'd01_s1',
        text: 'Dzień dobry, jak się pan miewa?',
        translation: 'Bonjour, comment allez-vous ?',
        hint: 'Formule de politesse formelle',
      },
      {
        id: 'd01_s2',
        text: 'Dziękuję bardzo za pomoc.',
        translation: 'Merci beaucoup pour l\'aide.',
        hint: 'Expression de gratitude',
      },
      {
        id: 'd01_s3',
        text: 'Przepraszam, gdzie jest toaleta?',
        translation: 'Excusez-moi, où sont les toilettes ?',
        hint: 'Demander son chemin',
      },
      {
        id: 'd01_s4',
        text: 'Do widzenia, do zobaczenia jutro!',
        translation: 'Au revoir, à demain !',
        hint: 'Formule d\'adieu',
      },
      {
        id: 'd01_s5',
        text: 'Miło mi pana poznać.',
        translation: 'Enchanté de faire votre connaissance.',
        hint: 'Formule de présentation',
      },
    ],
  },
  {
    id: 'dictation_02',
    title: 'Au café polonais',
    difficulty: 'A1',
    xpReward: 120,
    sentences: [
      {
        id: 'd02_s1',
        text: 'Poproszę jedną kawę z mlekiem.',
        translation: 'Un café au lait, s\'il vous plaît.',
        hint: 'Commander au café',
      },
      {
        id: 'd02_s2',
        text: 'Ile to kosztuje?',
        translation: 'Combien ça coûte ?',
        hint: 'Demander le prix',
      },
      {
        id: 'd02_s3',
        text: 'Poproszę rachunek, proszę.',
        translation: 'L\'addition, s\'il vous plaît.',
        hint: 'Demander l\'addition',
      },
      {
        id: 'd02_s4',
        text: 'Czy jest tu wolne miejsce?',
        translation: 'Est-ce qu\'il y a une place libre ici ?',
        hint: 'Chercher une table',
      },
    ],
  },
  {
    id: 'dictation_03',
    title: 'Se présenter',
    difficulty: 'A1',
    xpReward: 150,
    sentences: [
      {
        id: 'd03_s1',
        text: 'Nazywam się Marie Dupont.',
        translation: 'Je m\'appelle Marie Dupont.',
        hint: 'Donner son nom',
      },
      {
        id: 'd03_s2',
        text: 'Jestem z Francji, z Paryża.',
        translation: 'Je suis de France, de Paris.',
        hint: 'Dire d\'où on vient',
      },
      {
        id: 'd03_s3',
        text: 'Uczę się polskiego od trzech miesięcy.',
        translation: 'J\'apprends le polonais depuis trois mois.',
        hint: 'Parler de son apprentissage',
      },
      {
        id: 'd03_s4',
        text: 'Mój mąż jest Polakiem.',
        translation: 'Mon mari est polonais.',
        hint: 'Parler de sa famille',
      },
    ],
  },
];

type DictationPhase = 'intro' | 'listening' | 'writing' | 'feedback' | 'completed';

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

  const dictation = DICTATIONS.find(d => d.id === id) ?? DICTATIONS[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<DictationPhase>('intro');
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

  const current = dictation.sentences[currentIndex];
  const maxPlays = 3; // Maximum 3 écoutes par phrase

  // Lire la phrase en TTS
  const playSentence = useCallback(async (speed = 1.0) => {
    if (isPlaying || playCount >= maxPlays) return;

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
    if (!userInput.trim()) return;

    const { isCorrect, score, errors } = checkAnswer(userInput, current.text);

    const result = {
      sentence: current,
      userAnswer: userInput.trim(),
      score,
      isCorrect,
    };

    setResults(prev => [...prev, result]);

    // XP selon le score
    const xpEarned = Math.round((score / 100) * 30);
    setTotalXP(prev => prev + xpEarned);

    if (isCorrect) {
      Animated.spring(successAnim, {
        toValue: 1, friction: 5, useNativeDriver: true,
      }).start();
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

    if (currentIndex + 1 >= dictation.sentences.length) {
      awardXP(totalXP + dictation.xpReward);
      setPhase('completed');
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('listening');
    }
  };

  // ── Écran d'intro ──────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.backTxt}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={s.introWrap}>
          <Text style={s.introEmoji}>🎤</Text>
          <Text style={s.introTitle}>{dictation.title}</Text>
          <Text style={s.introDiff}>{dictation.difficulty} · {dictation.sentences.length} phrases</Text>
          <View style={s.introRules}>
            {[
              '🔊 Écoutez la phrase en polonais',
              '✍️ Écrivez ce que vous entendez',
              `🔁 Maximum ${maxPlays} écoutes par phrase`,
              '💡 Un indice disponible si besoin',
              `⭐ Jusqu\'à ${dictation.xpReward} XP à gagner`,
            ].map((rule) => (
              <View key={rule} style={s.introRule}>
                <Text style={s.introRuleTxt}>{rule}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={s.startBtn}
            onPress={() => setPhase('listening')}
          >
            <Text style={s.startBtnTxt}>Commencer la dictée →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Écran résultats ────────────────────────────────────────
  if (phase === 'completed') {
    const avgScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    );
    const perfectCount = results.filter(r => r.score === 100).length;

    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.completedWrap}>
          <Text style={s.completedEmoji}>
            {avgScore >= 90 ? '🏆' : avgScore >= 70 ? '⭐' : '💪'}
          </Text>
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

          {/* Détail par phrase */}
          <Text style={s.detailTitle}>Détail des phrases</Text>
          {results.map((result, i) => (
            <View key={i} style={[s.resultRow, { borderLeftColor: result.isCorrect ? COLORS.success : COLORS.error }]}>
              <View style={s.resultHeader}>
                <Text style={s.resultNum}>Phrase {i + 1}</Text>
                <Text style={[s.resultScore, { color: result.isCorrect ? COLORS.success : COLORS.error }]}>
                  {result.score}%
                </Text>
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

  // ── Exercice principal ─────────────────────────────────────
  const feedbackResult = phase === 'feedback' && results.length > 0
    ? results[results.length - 1]
    : null;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.backTxt}>✕</Text>
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, {
              width: `${((currentIndex) / dictation.sentences.length) * 100}%`,
            }]} />
          </View>
          <Text style={s.progressTxt}>{currentIndex + 1}/{dictation.sentences.length}</Text>
        </View>

        <ScrollView contentContainerStyle={s.exerciseWrap}>
          <Text style={s.phaseLabel}>
            {phase === 'listening' ? '🔊 Écoutez la phrase' :
             phase === 'writing' ? '✍️ Écrivez ce que vous avez entendu' :
             phase === 'feedback' ? (feedbackResult?.isCorrect ? '✅ Correct !' : '❌ Pas tout à fait...') : ''}
          </Text>

          {/* Compteur d'écoutes */}
          <View style={s.playCountRow}>
            {Array.from({ length: maxPlays }).map((_, i) => (
              <View
                key={i}
                style={[s.playDot, i < playCount && s.playDotUsed]}
              />
            ))}
            <Text style={s.playCountTxt}>{playCount}/{maxPlays} écoutes</Text>
          </View>

          {/* Boutons d'écoute */}
          <View style={s.playButtons}>
            <TouchableOpacity
              style={[s.playBtn, (isPlaying || playCount >= maxPlays) && s.playBtnDisabled]}
              onPress={() => playSentence(1.0)}
              disabled={isPlaying || playCount >= maxPlays || phase === 'feedback'}
            >
              {isPlaying
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={s.playBtnTxt}>🔊 Écouter</Text>
              }
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

          {/* Indice */}
          {phase === 'writing' && (
            <View style={s.hintWrap}>
              <TouchableOpacity
                style={s.hintBtn}
                onPress={() => setShowHint(true)}
              >
                <Text style={s.hintBtnTxt}>
                  {showHint ? `💡 ${current.translation}` : '💡 Voir l\'indice (-5 XP)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Zone de saisie */}
          {(phase === 'writing' || phase === 'feedback') && (
            <Animated.View style={[s.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
              <TextInput
                ref={inputRef}
                style={[
                  s.textInput,
                  phase === 'feedback' && feedbackResult?.isCorrect && s.textInputCorrect,
                  phase === 'feedback' && !feedbackResult?.isCorrect && s.textInputWrong,
                ]}
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

          {/* Feedback */}
          {phase === 'feedback' && feedbackResult && (
            <Animated.View style={[
              s.feedbackBox,
              feedbackResult.isCorrect ? s.feedbackCorrect : s.feedbackWrong,
              { transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] },
            ]}>
              <Text style={s.feedbackScore}>Score : {feedbackResult.score}%</Text>
              <Text style={s.feedbackLabel}>Réponse correcte :</Text>
              <Text style={s.feedbackText}>{feedbackResult.sentence.text}</Text>
              <Text style={s.feedbackTranslation}>{feedbackResult.sentence.translation}</Text>
            </Animated.View>
          )}

          {/* Bouton valider / continuer */}
          {phase === 'writing' && (
            <TouchableOpacity
              style={[s.submitBtn, !userInput.trim() && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!userInput.trim()}
            >
              <Text style={s.submitBtnTxt}>Vérifier →</Text>
            </TouchableOpacity>
          )}

          {phase === 'feedback' && (
            <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
              <Text style={s.nextBtnTxt}>
                {currentIndex + 1 >= dictation.sentences.length
                  ? '🏁 Voir les résultats'
                  : 'Phrase suivante →'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  backTxt: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '700', width: 32 },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  progressTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  introWrap: { flex: 1, alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  introEmoji: { fontSize: 64 },
  introTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  introDiff: { fontSize: 13, color: COLORS.textMuted },
  introRules: { width: '100%', gap: 10, marginVertical: SPACING.md },
  introRule: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surfaceAlt,
  },
  introRuleTxt: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  startBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, paddingHorizontal: SPACING.xl, width: '100%', alignItems: 'center',
  },
  startBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  exerciseWrap: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 40 },
  phaseLabel: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },

  playCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  playDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1.5, borderColor: '#D1D5DB',
  },
  playDotUsed: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  playCountTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginLeft: 4 },

  playButtons: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  playBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, paddingHorizontal: SPACING.xl,
    minWidth: 140, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  playBtnSlow: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, paddingHorizontal: SPACING.lg,
    borderWidth: 1.5, borderColor: COLORS.primary + '40',
  },
  playBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  playBtnTxt: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  playBtnSlowTxt: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },

  hintWrap: { alignItems: 'center' },
  hintBtn: {
    backgroundColor: COLORS.warningLight, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 10, paddingHorizontal: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.warning + '40',
  },
  hintBtnTxt: { fontSize: 13, color: COLORS.warning, fontWeight: '600' },

  inputWrap: { width: '100%' },
  textInput: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, fontSize: 16, color: COLORS.textPrimary,
    minHeight: 100, textAlignVertical: 'top', lineHeight: 24,
    borderWidth: 2, borderColor: COLORS.surfaceAlt,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  textInputCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  textInputWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },

  feedbackBox: {
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: 6,
    borderWidth: 1,
  },
  feedbackCorrect: { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' },
  feedbackWrong: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '40' },
  feedbackScore: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
  feedbackLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginTop: 4 },
  feedbackText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 24 },
  feedbackTranslation: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },

  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  nextBtn: {
    backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, alignItems: 'center',
  },
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
  detailTitle: {
    fontSize: 17, fontWeight: '800', color: COLORS.textPrimary,
    alignSelf: 'flex-start', marginTop: SPACING.md,
  },
  resultRow: {
    width: '100%', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    borderLeftWidth: 4, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  resultNum: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  resultScore: { fontSize: 13, fontWeight: '800' },
  resultCorrect: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  resultUser: { fontSize: 13, color: COLORS.textSecondary },
  resultTranslation: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  homeBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, paddingHorizontal: SPACING.xl,
    width: '100%', alignItems: 'center', marginTop: SPACING.md,
  },
  homeBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  retryBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, width: '100%', alignItems: 'center',
  },
  retryBtnTxt: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
