// ============================================================
// app/flashcard/[moduleId].tsx
// Écran flashcards — retournement animé + SRS SM-2
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { FLASHCARDS } from '@/content/flashcards/flashcards';
import { useFlashcards } from '@/hooks/useFlashcards';

const { width } = Dimensions.get('window');

type FlashcardPhase = 'intro' | 'card' | 'completed';

export default function FlashcardScreen() {
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
          <Text style={s.introTitle}>Révision Flashcards</Text>
          <Text style={s.introDesc}>
            {moduleId === 'all' ? 'Toutes vos cartes' : `Thème : ${initialCards[0]?.tags[0] || 'Général'}`}
          </Text>
          <View style={s.introStats}>
            <View style={s.introStat}>
              <Text style={s.introStatVal}>{initialCards.length}</Text>
              <Text style={s.introStatLabel}>Cartes totales</Text>
            </View>
          </View>
          <TouchableOpacity style={s.startBtn} onPress={handleStart}>
            <Text style={s.startBtnTxt}>Commencer la révision →</Text>
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
          <Text style={s.completedTitle}>Session terminée !</Text>
          <Text style={s.completedSub}>Vous avez révisé {sessionCards.length} cartes.</Text>
          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={s.homeBtnTxt}>Retour à l'accueil</Text>
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
            {mastery === 'mastered' ? '✅ Maîtrisé' : mastery === 'learning' ? '🔄 En cours' : '🆕 Nouveau'}
          </Text>
        </View>
      </View>

      {/* Card */}
      <Animated.View style={[s.cardWrap, { transform: [{ translateX: slideAnim }], opacity: opacityAnim }]}>
        <Animated.View style={[s.card, s.cardFront, { transform: [{ rotateY: frontRotate }], opacity: frontOpacity }]}>
          <Text style={s.cardHint}>🇵🇱 Polonais</Text>
          <Text style={s.cardWord}>{current.front}</Text>
          <Text style={s.cardPhonetic}>{current.phonetic}</Text>
          <View style={s.cardDivider} />
          <Text style={s.cardExample}>{current.examplePl}</Text>
          <TouchableOpacity style={s.tapHint} onPress={handleFlip}>
            <Text style={s.tapHintText}>Appuyez pour révéler →</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[s.card, s.cardBack, { transform: [{ rotateY: backRotate }], opacity: backOpacity }]}>
          <Text style={s.cardHint}>🇫🇷 Français</Text>
          <Text style={s.cardWordBack}>{current.back}</Text>
          <View style={s.cardDivider} />
          <Text style={s.cardWordSmall}>{current.front}</Text>
          <Text style={s.cardExample}>{current.exampleFr}</Text>
        </Animated.View>
      </Animated.View>

      {/* Footer Area */}
      <View style={{ paddingBottom: insets.bottom + 16 }}>
        {!showRating ? (
          <TouchableOpacity style={s.flipBtn} onPress={handleFlip}>
            <Text style={s.flipBtnText}>🔄 Retourner la carte</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.ratingWrap}>
            <Text style={s.ratingLabel}>Connaissiez-vous ce mot ?</Text>
            <View style={s.ratingRow}>
              <RatingBtn emoji="😔" label="Non" sub="Bientôt" color={COLORS.error} onPress={() => handleRate(0)} />
              <RatingBtn emoji="🤔" label="Moyen" sub="Quelques jours" color={COLORS.warning} onPress={() => handleRate(3)} />
              <RatingBtn emoji="😄" label="Oui !" sub="Longtemps" color={COLORS.success} onPress={() => handleRate(5)} />
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

  cardWrap: { flex: 1, marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  card: { position: 'absolute', inset: 0, backgroundColor: COLORS.white, borderRadius: 24, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 6, backfaceVisibility: 'hidden', gap: SPACING.sm },
  cardFront: { borderTopWidth: 4, borderTopColor: COLORS.primary },
  cardBack: { borderTopWidth: 4, borderTopColor: COLORS.success },
  cardHint: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  cardWord: { fontSize: 36, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  cardWordBack: { fontSize: 32, fontWeight: '900', color: COLORS.success, textAlign: 'center' },
  cardWordSmall: { fontSize: 18, color: COLORS.textMuted, fontWeight: '600' },
  cardPhonetic: { fontSize: 16, color: COLORS.textMuted, fontStyle: 'italic' },
  cardDivider: { width: '40%', height: 1, backgroundColor: COLORS.surfaceAlt, marginVertical: 4 },
  cardExample: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  tapHint: { marginTop: SPACING.md, backgroundColor: COLORS.primary + '15', paddingHorizontal: 16, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  tapHintText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

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
