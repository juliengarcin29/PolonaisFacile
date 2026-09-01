// ============================================================
// app/flashcard/[moduleId].tsx
// Écran flashcards — retournement animé + SRS SM-2
// ============================================================

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Animated, Dimensions, PanResponder,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { calculateNextReview, getDefaultReview } from '@/utils/srs';
import { FLASHCARDS } from '@/content/flashcards/flashcards';
import type { FlashcardReview, Flashcard } from '@/types';

const { width, height } = Dimensions.get('window');
const STORAGE_KEY = 'flashcard_reviews';

type SRSRating = 0 | 3 | 5;

export default function FlashcardScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();

  const cards = moduleId === 'all'
    ? FLASHCARDS
    : FLASHCARDS.filter(f => f.moduleId === moduleId);

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviews, setReviews] = useState<Record<string, FlashcardReview>>({});
  const [sessionDone, setSessionDone] = useState<string[]>([]);
  const [phase, setPhase] = useState<'card' | 'rating' | 'completed'>('card');

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const current = cards[index];

  // Charger les révisions sauvegardées
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) setReviews(JSON.parse(data));
    });
  }, []);

  // Sauvegarder les révisions
  const saveReviews = async (updated: Record<string, FlashcardReview>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Animation flip
  const flip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue, useNativeDriver: true, friction: 8, tension: 40,
    }).start();
    setIsFlipped(!isFlipped);
    if (!isFlipped) setPhase('rating');
  };

  // Animation slide-out puis slide-in
  const slideToNext = (direction: 'left' | 'right') => {
    const dir = direction === 'left' ? -width : width;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: dir, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(direction === 'left' ? width : -width);
      flipAnim.setValue(0);
      setIsFlipped(false);
      setPhase('card');

      if (index + 1 >= cards.length) {
        setPhase('completed');
      } else {
        setIndex(prev => prev + 1);
      }

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  // Notation SRS
  const rateCard = async (rating: SRSRating) => {
    const existing = reviews[current.id] ?? getDefaultReview(current.id, 'local');
    const updated = calculateNextReview(existing, rating);
    const newReview: FlashcardReview = {
      ...existing, ...updated,
      lastReviewDate: new Date(),
      totalReviews: (existing.totalReviews ?? 0) + 1,
      correctReviews: rating >= 3 ? (existing.correctReviews ?? 0) + 1 : (existing.correctReviews ?? 0),
    };
    const newReviews = { ...reviews, [current.id]: newReview };
    setReviews(newReviews);
    await saveReviews(newReviews);
    setSessionDone(prev => [...prev, current.id]);
    slideToNext(rating >= 3 ? 'left' : 'right');
  };

  // Interpolations flip
  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [1, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [0, 1] });

  if (phase === 'completed' || index >= cards.length) {
    return <CompletedView total={cards.length} done={sessionDone.length} onBack={() => router.back()} />;
  }

  if (!current) return null;

  const reviewData = reviews[current.id];
  const masteryLevel = reviewData
    ? reviewData.repetitions >= 5 ? 'maîtrisé' : reviewData.repetitions >= 2 ? 'en cours' : 'nouveau'
    : 'nouveau';

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index) / cards.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{index + 1} / {cards.length}</Text>
        </View>
      </View>

      {/* Badge maîtrise */}
      <View style={styles.masteryRow}>
        <View style={[styles.masteryBadge, {
          backgroundColor: masteryLevel === 'maîtrisé' ? COLORS.successLight
            : masteryLevel === 'en cours' ? COLORS.warningLight : COLORS.surfaceAlt,
        }]}>
          <Text style={styles.masteryText}>
            {masteryLevel === 'maîtrisé' ? '✅' : masteryLevel === 'en cours' ? '🔄' : '🆕'} {masteryLevel}
          </Text>
        </View>
        {reviewData && (
          <Text style={styles.nextReview}>
            Prochaine révision : {new Date(reviewData.nextReviewDate).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </View>

      {/* Carte flip */}
      <Animated.View style={[styles.cardWrap, {
        transform: [{ translateX: slideAnim }],
        opacity: opacityAnim,
      }]}>
        {/* Face avant (polonais) */}
        <Animated.View style={[styles.card, styles.cardFront, {
          transform: [{ rotateY: frontRotate }],
          opacity: frontOpacity,
        }]}>
          <Text style={styles.cardHint}>🇵🇱 Polonais</Text>
          <Text style={styles.cardWord}>{current.front}</Text>
          <Text style={styles.cardPhonetic}>{current.phonetic}</Text>
          <View style={styles.cardDivider} />
          <Text style={styles.cardExample} numberOfLines={2}>{current.examplePl}</Text>
          <TouchableOpacity style={styles.tapHint} onPress={flip}>
            <Text style={styles.tapHintText}>Appuyez pour révéler →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Face arrière (français) */}
        <Animated.View style={[styles.card, styles.cardBack, {
          transform: [{ rotateY: backRotate }],
          opacity: backOpacity,
        }]}>
          <Text style={styles.cardHint}>🇫🇷 Français</Text>
          <Text style={styles.cardWordBack}>{current.back}</Text>
          <View style={styles.cardDivider} />
          <Text style={styles.cardWord} numberOfLines={1}>{current.front}</Text>
          <Text style={styles.cardPhonetic}>{current.phonetic}</Text>
          <Text style={styles.cardExample} numberOfLines={2}>{current.exampleFr}</Text>
        </Animated.View>
      </Animated.View>

      {/* Bouton retourner (si pas encore retourné) */}
      {phase === 'card' && (
        <TouchableOpacity style={styles.flipBtn} onPress={flip}>
          <Text style={styles.flipBtnText}>🔄 Retourner la carte</Text>
        </TouchableOpacity>
      )}

      {/* Boutons de notation SRS (après retournement) */}
      {phase === 'rating' && (
        <View style={styles.ratingWrap}>
          <Text style={styles.ratingLabel}>Vous connaissiez ce mot ?</Text>
          <View style={styles.ratingRow}>
            <TouchableOpacity
              style={[styles.ratingBtn, styles.ratingBtnNo]}
              onPress={() => rateCard(0)}
            >
              <Text style={styles.ratingBtnEmoji}>😔</Text>
              <Text style={[styles.ratingBtnText, { color: COLORS.error }]}>Non</Text>
              <Text style={styles.ratingBtnSub}>Revoir bientôt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingBtn, styles.ratingBtnAlmost]}
              onPress={() => rateCard(3)}
            >
              <Text style={styles.ratingBtnEmoji}>🤔</Text>
              <Text style={[styles.ratingBtnText, { color: COLORS.warning }]}>À peu près</Text>
              <Text style={styles.ratingBtnSub}>Dans quelques jours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingBtn, styles.ratingBtnYes]}
              onPress={() => rateCard(5)}
            >
              <Text style={styles.ratingBtnEmoji}>😄</Text>
              <Text style={[styles.ratingBtnText, { color: COLORS.success }]}>Oui !</Text>
              <Text style={styles.ratingBtnSub}>Dans longtemps</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── ÉCRAN FIN DE SESSION ─────────────────────────────────────
function CompletedView({ total, done, onBack }: { total: number; done: number; onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={comp.container}>
        <Text style={comp.emoji}>🎉</Text>
        <Text style={comp.title}>Session terminée !</Text>
        <Text style={comp.sub}>{done} cartes révisées sur {total}</Text>
        <View style={comp.statsRow}>
          <View style={comp.stat}>
            <Text style={[comp.statVal, { color: COLORS.success }]}>{done}</Text>
            <Text style={comp.statLabel}>Révisées</Text>
          </View>
          <View style={comp.stat}>
            <Text style={[comp.statVal, { color: COLORS.primary }]}>{total - done}</Text>
            <Text style={comp.statLabel}>Restantes</Text>
          </View>
        </View>
        <TouchableOpacity style={comp.btn} onPress={onBack}>
          <Text style={comp.btnText}>Retour →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const comp = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 72, marginBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8 },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: SPACING.xl },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 36, fontWeight: '900' },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, paddingHorizontal: SPACING.xxl,
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SPACING.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
  progressWrap: { flex: 1, gap: 6 },
  progressTrack: {
    height: 6, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  progressText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  masteryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  masteryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  masteryText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  nextReview: { fontSize: 11, color: COLORS.textMuted },

  cardWrap: {
    flex: 1, marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },

  card: {
    position: 'absolute', inset: 0,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
    backfaceVisibility: 'hidden',
    gap: SPACING.sm,
  },
  cardFront: { borderTopWidth: 4, borderTopColor: COLORS.primary },
  cardBack: { borderTopWidth: 4, borderTopColor: COLORS.success },

  cardHint: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  cardWord: { fontSize: 36, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  cardWordBack: { fontSize: 32, fontWeight: '900', color: COLORS.success, textAlign: 'center' },
  cardPhonetic: { fontSize: 16, color: COLORS.textMuted, fontStyle: 'italic' },
  cardDivider: { width: '40%', height: 1, backgroundColor: COLORS.surfaceAlt, marginVertical: 4 },
  cardExample: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  tapHint: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  tapHintText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  flipBtn: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, alignItems: 'center',
  },
  flipBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  ratingWrap: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  ratingLabel: {
    fontSize: 14, color: COLORS.textSecondary, fontWeight: '600',
    textAlign: 'center', marginBottom: SPACING.md,
  },
  ratingRow: { flexDirection: 'row', gap: 10 },
  ratingBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.md, borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2, gap: 4,
  },
  ratingBtnNo: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '40' },
  ratingBtnAlmost: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning + '40' },
  ratingBtnYes: { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' },
  ratingBtnEmoji: { fontSize: 24 },
  ratingBtnText: { fontSize: 13, fontWeight: '800' },
  ratingBtnSub: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
});
