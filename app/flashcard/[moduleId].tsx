// ============================================================
// app/flashcard/[moduleId].tsx
// Écran flashcards — retournement animé + SRS SM-2
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { FLASHCARDS } from '@/content/flashcards/flashcards';
import { useFlashcards } from '@/hooks/useFlashcards';

const { width } = Dimensions.get('window');

type FlashcardPhase = 'intro' | 'card' | 'completed';

export default function FlashcardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();

  // Filtrer les cartes initiales pour ce module
  const initialCards = useMemo(() => {
    return moduleId === 'all'
      ? FLASHCARDS
      : FLASHCARDS.filter(f => f.moduleId === moduleId);
  }, [moduleId]);

  // Hook SRS centralisé
  const {
    current, currentIndex, isFlipped, sessionCards,
    sessionProgress, startSession, flip, rateCard,
    getCardMastery, isLoading,
  } = useFlashcards(initialCards);

  const [phase, setPhase] = useState<FlashcardPhase>('intro');
  const [showRating, setShowRating] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Animation flip
  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue, useNativeDriver: true, friction: 8, tension: 40,
    }).start();
    flip();
    if (!isFlipped) setShowRating(true);
  };

  // Passer à la suivante avec animation slide
  const handleRate = async (rating: 0 | 3 | 5) => {
    setShowRating(false);
    const result = await rateCard(rating);

    const direction = rating >= 3 ? -width : width;

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: direction, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      if (result === 'completed') {
        setPhase('completed');
      } else {
        slideAnim.setValue(-direction);
        flipAnim.setValue(0);

        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    });
  };

  const handleStart = () => {
    startSession();
    setPhase('card');
  };

  const playAudio = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: 'pl-PL', rate: 0.85 });
  };

  // Interpolations flip
  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [1, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [0, 1] });

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── PHASE 1 : INTRO ──────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={s.safe}>
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.introWrap, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={s.introEmoji}>🧠</Text>
          <Text style={s.introTitle}>{t('flashcards.intro.title')}</Text>
          <Text style={s.introDesc}>
            {moduleId === 'all' ? t('flashcards.intro.all_cards') : t('flashcards.intro.theme_label', { theme: initialCards[0]?.tags[0] || 'Général' })}
          </Text>
          <View style={s.introStats}>
            <View style={s.introStat}>
              <Text style={s.introStatVal}>{initialCards.length}</Text>
              <Text style={s.introStatLabel}>{t('flashcards.intro.total_label')}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.startBtn} onPress={handleStart}>
            <Text style={s.startBtnTxt}>{t('flashcards.intro.start_btn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PHASE 3 : COMPLETED ───────────────────────────────────
  if (phase === 'completed') {
    return (
      <View style={s.safe}>
        <View style={[s.completedWrap, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
          <Text style={s.completedEmoji}>🎉</Text>
          <Text style={s.completedTitle}>{t('flashcards.completed.title')}</Text>
          <Text style={s.completedSub}>{t('flashcards.completed.summary', { count: sessionCards.length })}</Text>
          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={s.homeBtnTxt}>{t('flashcards.completed.btn_home')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!current) return null;
  const mastery = getCardMastery(current.id);

  return (
    <View style={s.safe}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>✕</Text>
        </TouchableOpacity>
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${sessionProgress}%` }]} />
          </View>
          <Text style={s.progressText}>{currentIndex + 1} / {sessionCards.length}</Text>
        </View>
      </View>

      {/* Mastery Badge */}
      <View style={s.masteryRow}>
        <View style={[s.masteryBadge, { backgroundColor: mastery === 'mastered' ? COLORS.successLight : mastery === 'learning' ? COLORS.warningLight : COLORS.surfaceAlt }]}>
          <Text style={s.masteryText}>
            {mastery === 'mastered' ? t('flashcards.badge.mastered') : mastery === 'learning' ? t('flashcards.badge.learning') : t('flashcards.badge.new')}
          </Text>
        </View>
      </View>

      {/* Card Container */}
      <View style={s.cardTouchable}>
        <Animated.View style={[s.cardWrap, { transform: [{ translateX: slideAnim }], opacity: opacityAnim }]}>
          {/* Face avant (polonais) */}
          <Animated.View style={[s.card, s.cardFront, { transform: [{ rotateY: frontRotate }], opacity: frontOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleFlip} />
            <Text style={s.cardHint} pointerEvents="none">{t('flashcards.card.pl_hint', { tag: current.tags[0] })}</Text>
            <View style={s.wordRow}>
              <Text style={s.cardWord} pointerEvents="none">{current.front}</Text>
              {/* Le bouton audio a été déplacé dans un calque stable pour corriger le bug Android de rotation 3D */}
              <View style={[s.audioBtnSmall, { opacity: 0 }]} pointerEvents="none">
                <Text style={{ fontSize: 24 }}>🔊</Text>
              </View>
            </View>
            <Text style={s.cardPhonetic} pointerEvents="none">{current.phonetic}</Text>
            <View style={s.cardDivider} pointerEvents="none" />
            <Text style={s.tapHintText} pointerEvents="none">{t('flashcards.card.tap_hint')}</Text>
          </Animated.View>

          {/* Face arrière (français + détails) */}
          <Animated.View style={[s.card, s.cardBack, { transform: [{ rotateY: backRotate }], opacity: backOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleFlip} />
            <Text style={s.cardHint} pointerEvents="none">{t('flashcards.card.fr_hint')}</Text>
            <Text style={s.cardWordBack} pointerEvents="none">{current.back}</Text>
            <View style={s.cardDivider} pointerEvents="none" />

            <View style={s.backDetails}>
              <View style={s.wordRowSmall}>
                <Text style={s.cardWordSmall} pointerEvents="none">{current.front}</Text>
                <TouchableOpacity
                  onPress={() => playAudio(current.front)}
                >
                  <Text style={{ fontSize: 18 }}>🔊</Text>
                </TouchableOpacity>
              </View>

              <View style={s.exampleBox}>
                <View style={s.wordRowSmall}>
                  <Text style={s.cardExamplePl} pointerEvents="none">{current.examplePl}</Text>
                  <TouchableOpacity
                    onPress={() => playAudio(current.examplePl)}
                  >
                    <Text style={{ fontSize: 18 }}>🔊</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.cardExampleFr} pointerEvents="none">{current.exampleFr}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Calque AUDIO stable (Hors zone de rotation) */}
          {!isFlipped && (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="box-none">
              <View style={[s.card, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, borderTopWidth: 0 }]} pointerEvents="box-none">
                <View style={[s.wordRow, { marginTop: -45 }]} pointerEvents="box-none">
                   {/* On simule la position du texte pour aligner le bouton à sa droite */}
                   <Text style={[s.cardWord, { opacity: 0 }]} pointerEvents="none">{current.front}</Text>
                   <TouchableOpacity
                    onPress={() => playAudio(current.front)}
                    style={s.audioBtnSmall}
                  >
                    <Text style={{ fontSize: 24 }}>🔊</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Footer Area */}
      <View style={{ paddingBottom: insets.bottom + 16 }}>
        {!showRating ? (
          <TouchableOpacity style={s.flipBtn} onPress={handleFlip}>
            <Text style={s.flipBtnText}>{t('flashcards.card.flip_btn')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.ratingWrap}>
            <Text style={s.ratingLabel}>{t('flashcards.rating.question')}</Text>
            <View style={s.ratingRow}>
              <RatingBtn emoji="😔" label={t('flashcards.rating.no')} sub={t('flashcards.rating.no_sub')} color={COLORS.error} onPress={() => handleRate(0)} />
              <RatingBtn emoji="🤔" label={t('flashcards.rating.mid')} sub={t('flashcards.rating.mid_sub')} color={COLORS.warning} onPress={() => handleRate(3)} />
              <RatingBtn emoji="😄" label={t('flashcards.rating.yes')} sub={t('flashcards.rating.yes_sub')} color={COLORS.success} onPress={() => handleRate(5)} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function RatingBtn({ emoji, label, sub, color, onPress }: any) {
  return (
    <TouchableOpacity style={[s.ratingBtn, { borderColor: color + '40' }]} onPress={onPress}>
      <Text style={s.ratingBtnEmoji}>{emoji}</Text>
      <Text style={[s.ratingBtnText, { color }]}>{label}</Text>
      <Text style={s.ratingBtnSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
  progressWrap: { flex: 1, gap: 6 },
  progressTrack: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  progressText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  introWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  introEmoji: { fontSize: 72 },
  introTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  introDesc: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
  introStats: { marginVertical: SPACING.lg },
  introStat: { alignItems: 'center' },
  introStatVal: { fontSize: 48, fontWeight: '900', color: COLORS.primary },
  introStatLabel: { fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  startBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, paddingHorizontal: SPACING.xxl, width: '100%', alignItems: 'center' },
  startBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  completedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  completedEmoji: { fontSize: 72 },
  completedTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary },
  completedSub: { fontSize: 16, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  homeBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, paddingHorizontal: SPACING.xxl, width: '100%', alignItems: 'center' },
  homeBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  masteryRow: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  masteryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, alignSelf: 'flex-start' },
  masteryText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },

  cardTouchable: { flex: 1 },
  cardWrap: { flex: 1, marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  card: { position: 'absolute', inset: 0, backgroundColor: COLORS.white, borderRadius: 24, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 6, backfaceVisibility: 'hidden', gap: SPACING.sm },
  cardFront: { borderTopWidth: 4, borderTopColor: COLORS.primary },
  cardBack: { borderTopWidth: 4, borderTopColor: COLORS.success },

  cardHint: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  wordRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  cardWord: { fontSize: 36, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  cardWordBack: { fontSize: 32, fontWeight: '900', color: COLORS.success, textAlign: 'center' },
  cardPhonetic: { fontSize: 18, color: COLORS.textMuted, fontStyle: 'italic' },
  cardDivider: { width: '40%', height: 1, backgroundColor: COLORS.surfaceAlt, marginVertical: 12 },

  backDetails: { width: '100%', gap: 16, alignItems: 'center' },
  cardWordSmall: { fontSize: 20, color: COLORS.textPrimary, fontWeight: '700' },
  exampleBox: { backgroundColor: COLORS.surfaceAlt, padding: 12, borderRadius: 16, width: '100%', gap: 4 },
  cardExamplePl: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600', textAlign: 'center' },
  cardExampleFr: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },

  tapHintText: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 12 },
  audioBtnSmall: {
    padding: 10,
    zIndex: 10,
    elevation: 10,
  },

  flipBtn: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  flipBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  ratingWrap: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  ratingLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center', marginBottom: SPACING.md },
  ratingRow: { flexDirection: 'row', gap: 10 },
  ratingBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, borderWidth: 2, gap: 4, backgroundColor: COLORS.white },
  ratingBtnEmoji: { fontSize: 24 },
  ratingBtnText: { fontSize: 13, fontWeight: '800' },
  ratingBtnSub: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
});
