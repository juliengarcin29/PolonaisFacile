// ============================================================
// app/dialogue/[id].tsx
// Écran de dialogue — conversations interactives polonaises
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useGamification } from '@/hooks/useGamification';
import { getDialogueById, DialogueLine, Dialogue } from '@/content/dialogues/dialogues';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

type DialogueMode = 'loading' | 'error' | 'read' | 'quiz' | 'completed';

// ── Composant principal ──────────────────────────────────────
export default function DialogueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { awardXP } = useGamification();

  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [mode, setMode] = useState<DialogueMode>('loading');
  const [revealedLines, setRevealedLines] = useState<number>(0);
  const [showTranslations, setShowTranslations] = useState(true);
  const [showPhonetics, setShowPhonetics] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  const scrollRef = useRef<ScrollView>(null);

  // Charger le dialogue
  useEffect(() => {
    if (id) {
      const data = getDialogueById(id);
      if (data) {
        setDialogue(data);
        setMode('read');
        // Générer les questions du quiz une fois les données chargées
        setQuizQuestions(data.lines.slice(0, 4).map(line => {
          const wrongAnswers = data.lines
            .filter(l => l.id !== line.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(l => l.translation);
          const options = [...wrongAnswers, line.translation]
            .sort(() => Math.random() - 0.5);
          return { line, options };
        }));
      } else {
        setMode('error');
      }
    }
  }, [id]);

  // Scroll automatique quand une nouvelle ligne est révélée
  useEffect(() => {
    if (revealedLines > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [revealedLines]);

  // Lire une ligne
  const playLine = (line: DialogueLine) => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      setPlayingLineId(null);
      return;
    }
    setIsPlaying(true);
    setPlayingLineId(line.id);
    Speech.speak(line.text, {
      language: 'pl-PL',
      rate: 0.85,
      onDone: () => { setIsPlaying(false); setPlayingLineId(null); },
      onError: () => { setIsPlaying(false); setPlayingLineId(null); },
    });
  };

  // Lire tout le dialogue
  const playAll = async () => {
    if (!dialogue) return;
    if (isPlaying) { Speech.stop(); setIsPlaying(false); return; }
    setIsPlaying(true);

    for (const line of dialogue.lines.slice(0, revealedLines)) {
      setPlayingLineId(line.id);
      await new Promise<void>((resolve) => {
        Speech.speak(line.text, {
          language: 'pl-PL',
          rate: 0.85,
          onDone: () => { setTimeout(resolve, 500); },
          onError: () => resolve(),
        });
      });
    }
    setIsPlaying(false);
    setPlayingLineId(null);
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer || !dialogue) return;
    setSelectedAnswer(answer);
    if (answer === quizQuestions[quizIndex].line.translation) {
      setQuizScore(prev => prev + 1);
    }
    setTimeout(() => {
      if (quizIndex + 1 >= quizQuestions.length) {
        setMode('completed');
        awardXP(dialogue.xpReward + quizScore * 10);
      } else {
        setQuizIndex(prev => prev + 1);
        setSelectedAnswer(null);
      }
    }, 1200);
  };

  if (mode === 'loading') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>Chargement du dialogue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'error' || !dialogue) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <Text style={s.errorEmoji}>🛰️</Text>
          <Text style={s.errorTitle}>Dialogue introuvable</Text>
          <Text style={s.errorDesc}>Désolé, nous n'avons pas pu charger ce dialogue.</Text>
          <TouchableOpacity style={s.backBtnFull} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Retourner apprendre</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Mode lecture ─────────────────────────────────────────
  if (mode === 'read') {
    return (
      <SafeAreaView style={s.safe}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.backTxt}>✕</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{dialogue.emoji} {dialogue.title}</Text>
            <Text style={s.headerSub}>{dialogue.difficulty} · {dialogue.lines.length} répliques</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => setShowTranslations(!showTranslations)}
            >
              <Text style={s.iconBtnTxt}>{showTranslations ? '🇫🇷' : '🇵🇱'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => setShowPhonetics(!showPhonetics)}
            >
              <Text style={s.iconBtnTxt}>🔤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contexte */}
        <View style={s.contextBanner}>
          <Text style={s.contextTxt}>📍 {dialogue.context}</Text>
        </View>

        {/* Vocabulaire clé */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.vocabScroll}
          contentContainerStyle={s.vocabContent}
        >
          {dialogue.vocabulary.map((v) => (
            <View key={v.pl} style={s.vocabChip}>
              <Text style={s.vocabPl}>{v.pl}</Text>
              <Text style={s.vocabFr}>{v.fr}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dialogue */}
        <ScrollView ref={scrollRef} style={s.dialogueScroll} showsVerticalScrollIndicator={false}>
          <View style={s.dialogueContent}>
            {dialogue.lines.slice(0, revealedLines).map((line) => (
              <DialogueBubble
                key={line.id}
                line={line}
                isPlaying={playingLineId === line.id}
                showTranslation={showTranslations}
                showPhonetic={showPhonetics}
                onPlay={() => playLine(line)}
              />
            ))}

            {/* Bouton révéler ligne suivante */}
            {revealedLines < dialogue.lines.length && (
              <TouchableOpacity
                style={s.revealBtn}
                onPress={() => setRevealedLines(prev => prev + 1)}
              >
                <Text style={s.revealBtnTxt}>
                  {revealedLines === 0
                    ? '▶ Commencer le dialogue'
                    : '▶ Ligne suivante'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Dialogue complet — actions */}
            {revealedLines >= dialogue.lines.length && (
              <View style={s.completedActions}>
                <TouchableOpacity style={s.playAllBtn} onPress={playAll}>
                  <Text style={s.playAllBtnTxt}>
                    {isPlaying ? '⏹ Arrêter' : '🔊 Écouter tout'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.quizBtn}
                  onPress={() => setMode('quiz')}
                >
                  <Text style={s.quizBtnTxt}>🎯 Tester sa compréhension →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Mode quiz ────────────────────────────────────────────
  if (mode === 'quiz') {
    const question = quizQuestions[quizIndex];
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setMode('read')}>
            <Text style={s.backTxt}>← Retour</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Quiz de compréhension</Text>
          <Text style={s.quizProgress}>{quizIndex + 1}/{quizQuestions.length}</Text>
        </View>

        <View style={s.quizContent}>
          <Text style={s.quizInstruction}>Quelle est la traduction de cette phrase ?</Text>

          {/* Phrase polonaise */}
          <View style={s.quizLineBox}>
            <Text style={s.quizSpeaker}>{question.line.speakerName} :</Text>
            <Text style={s.quizLineText}>{question.line.text}</Text>
            <TouchableOpacity onPress={() => playLine(question.line)} style={s.quizPlayBtn}>
              <Text style={s.quizPlayBtnTxt}>🔊</Text>
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={s.quizOptions}>
            {question.options.map((option: string) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.line.translation;
              const showResult = selectedAnswer !== null;

              let bg = COLORS.white;
              let border = '#E5E7EB';
              let textCol = COLORS.textPrimary;

              if (showResult && isCorrect) { bg = COLORS.successLight; border = COLORS.success; textCol = COLORS.success; }
              else if (showResult && isSelected && !isCorrect) { bg = COLORS.errorLight; border = COLORS.error; textCol = COLORS.error; }
              else if (isSelected) { border = COLORS.primary; bg = '#FFF0F3'; }

              return (
                <TouchableOpacity
                  key={option}
                  style={[s.quizOption, { backgroundColor: bg, borderColor: border }]}
                  onPress={() => handleQuizAnswer(option)}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={[s.quizOptionTxt, { color: textCol }]}>{option}</Text>
                  {showResult && isCorrect && <Text>✓</Text>}
                  {showResult && isSelected && !isCorrect && <Text>✗</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Mode résultat ────────────────────────────────────────
  const finalScore = Math.round((quizScore / quizQuestions.length) * 100);
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.completedScreen}>
        <Text style={s.completedEmoji}>
          {finalScore >= 75 ? '🏆' : finalScore >= 50 ? '⭐' : '💪'}
        </Text>
        <Text style={s.completedTitle}>Dialogue maîtrisé !</Text>
        <View style={s.completedStats}>
          <View style={s.completedStat}>
            <Text style={[s.completedVal, { color: COLORS.success }]}>{quizScore}/{quizQuestions.length}</Text>
            <Text style={s.completedLabel}>Bonnes réponses</Text>
          </View>
          <View style={s.completedStat}>
            <Text style={[s.completedVal, { color: COLORS.xpGold }]}>+{dialogue.xpReward + quizScore * 10}</Text>
            <Text style={s.completedLabel}>XP gagnés</Text>
          </View>
        </View>
        <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={s.homeBtnTxt}>Retour à l'accueil →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.retryBtn} onPress={() => {
          setMode('read');
          setRevealedLines(0);
          setQuizIndex(0);
          setQuizScore(0);
          setSelectedAnswer(null);
        }}>
          <Text style={s.retryBtnTxt}>🔄 Recommencer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Bulle de dialogue ─────────────────────────────────────────
function DialogueBubble({
  line, isPlaying, showTranslation, showPhonetic, onPlay,
}: {
  line: DialogueLine;
  isPlaying: boolean;
  showTranslation: boolean;
  showPhonetic: boolean;
  onPlay: () => void;
}) {
  const isA = line.speaker === 'A';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[db.wrap, isA ? db.wrapLeft : db.wrapRight, { opacity: fadeAnim }]}>
      <View style={[db.avatar, { backgroundColor: isA ? COLORS.primary + '20' : COLORS.success + '20' }]}>
        <Text style={db.avatarTxt}>{line.speakerName[0]}</Text>
      </View>
      <View style={[db.bubble, isA ? db.bubbleLeft : db.bubbleRight]}>
        <Text style={db.speaker}>{line.speakerName}</Text>
        <Text style={db.text}>{line.text}</Text>
        {showPhonetic && line.phonetic && (
          <Text style={db.phonetic}>{line.phonetic}</Text>
        )}
        {showTranslation && (
          <Text style={db.translation}>{line.translation}</Text>
        )}
        <TouchableOpacity style={db.playBtn} onPress={onPlay}>
          <Text style={db.playBtnTxt}>{isPlaying ? '⏸' : '🔊'}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const db = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
  wrapLeft: {},
  wrapRight: { flexDirection: 'row-reverse' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarTxt: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  bubble: {
    maxWidth: '78%', borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bubbleLeft: { backgroundColor: COLORS.white, borderTopLeftRadius: 4 },
  bubbleRight: { backgroundColor: COLORS.primary + '15', borderTopRightRadius: 4 },
  speaker: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 2 },
  text: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22, fontWeight: '500' },
  phonetic: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 2 },
  translation: {
    fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic',
    borderTopWidth: 1, borderTopColor: COLORS.surfaceAlt, paddingTop: 4, marginTop: 2,
  },
  playBtn: {
    alignSelf: 'flex-end', marginTop: 4,
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  playBtnTxt: { fontSize: 12 },
});

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
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnTxt: { fontSize: 16 },
  contextBanner: {
    backgroundColor: COLORS.primary + '10', padding: SPACING.sm,
    paddingHorizontal: SPACING.lg, borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '20',
  },
  contextTxt: { fontSize: 12, color: COLORS.primary, fontWeight: '600', fontStyle: 'italic' },
  vocabScroll: { maxHeight: 72, backgroundColor: COLORS.white },
  vocabContent: { paddingHorizontal: SPACING.lg, paddingVertical: 10, gap: 8 },
  vocabChip: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  vocabPl: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  vocabFr: { fontSize: 11, color: COLORS.textMuted },
  dialogueScroll: { flex: 1 },
  dialogueContent: { padding: SPACING.lg },
  revealBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  revealBtnTxt: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  completedActions: { gap: 12, marginTop: 16 },
  playAllBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  playAllBtnTxt: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  quizBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, alignItems: 'center',
  },
  quizBtnTxt: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  quizProgress: { fontSize: 13, color: COLORS.textMuted, fontWeight: '700' },
  quizContent: { flex: 1, padding: SPACING.lg, gap: SPACING.lg },
  quizInstruction: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  quizLineBox: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, gap: 8, borderWidth: 1, borderColor: COLORS.surfaceAlt,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  quizSpeaker: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  quizLineText: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 26 },
  quizPlayBtn: {
    alignSelf: 'flex-start', backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  quizPlayBtnTxt: { fontSize: 14 },
  quizOptions: { gap: 12 },
  quizOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2, backgroundColor: COLORS.white,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  quizOptionTxt: { fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
  completedScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.md,
  },
  completedEmoji: { fontSize: 72 },
  completedTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary },
  completedStats: { flexDirection: 'row', gap: 32, marginVertical: SPACING.md },
  completedStat: { alignItems: 'center', gap: 4 },
  completedVal: { fontSize: 32, fontWeight: '900' },
  completedLabel: { fontSize: 12, color: COLORS.textMuted },
  homeBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, paddingHorizontal: SPACING.xxl,
    width: '100%', alignItems: 'center',
  },
  homeBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  retryBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, width: '100%', alignItems: 'center',
  },
  retryBtnTxt: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
