// ============================================================
// app/(tabs)/review.tsx — Onglet Réviser (SRS)
// ============================================================
import { useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { useFlashcards } from '@/hooks/useFlashcards';
import { FLASHCARDS } from '@/content/flashcards/flashcards';

export default function ReviewScreen() {
  const { getSessionStats, isLoading, reviews } = useFlashcards(FLASHCARDS);
  const [stats, setStats] = useState({ dueCount: 0, newCount: 0, reviewCount: 0 });

  // Rafraîchir les stats quand l'onglet gagne le focus
  useFocusEffect(
    useCallback(() => {
      const s = getSessionStats();
      setStats({
        dueCount: s.dueCount,
        newCount: s.newCount,
        reviewCount: s.reviewCount
      });
    }, [getSessionStats, reviews])
  );

  // Calculer les compteurs demandés
  const masteredCount = Object.values(reviews).filter(r => r.repetitions >= 5).length;
  const inProgressCount = Object.values(reviews).filter(r => r.repetitions > 0 && r.repetitions < 5).length;
  const toReviewCount = stats.dueCount;

  // Flashcards récentes (5 dernières révisées)
  const recentCards = Object.values(reviews)
    .sort((a, b) => new Date(b.lastReviewDate).getTime() - new Date(a.lastReviewDate).getTime())
    .slice(0, 5)
    .map(r => FLASHCARDS.find(f => f.id === r.flashcardId))
    .filter(Boolean);

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Réviser</Text>
          <Text style={s.subtitle}>Répétition espacée intelligente (SM-2)</Text>
        </View>

        <View style={s.dueCard}>
          <Text style={s.dueEmoji}>🧠</Text>
          <Text style={s.dueCount}>{toReviewCount}</Text>
          <Text style={s.dueLabel}>cartes à réviser aujourd'hui</Text>
          <TouchableOpacity
            style={[s.startBtn, toReviewCount === 0 && s.startBtnDisabled]}
            onPress={() => toReviewCount > 0 && router.push('/flashcard/all')}
            disabled={toReviewCount === 0}
          >
            <Text style={s.startBtnText}>
              {toReviewCount > 0 ? 'Commencer la révision →' : 'Tout est à jour !'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          {[
            { label: 'Apprises', value: masteredCount, emoji: '✅', color: COLORS.success },
            { label: 'En cours', value: inProgressCount, emoji: '🔄', color: COLORS.warning },
            { label: 'À revoir', value: toReviewCount, emoji: '⚠️', color: COLORS.error },
          ].map((stat) => (
            <View key={stat.label} style={[s.statBox, { borderTopColor: stat.color }]}>
              <Text style={s.statEmoji}>{stat.emoji}</Text>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {recentCards.length > 0 && (
          <>
            <Text style={s.sectionTitle}>📋 Flashcards récentes</Text>
            {recentCards.map((card: any) => (
              <View key={card.id} style={s.flashRow}>
                <View style={s.flashLeft}>
                  <Text style={s.flashPl}>{card.front}</Text>
                  <Text style={s.flashPhonetic}>{card.phonetic}</Text>
                </View>
                <Text style={s.flashFr}>{card.back}</Text>
                <View style={[s.flashStatus, { backgroundColor: COLORS.success + '22' }]}>
                  <Text style={{ fontSize: 14 }}>✅</Text>
                </View>
              </View>
            ))}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  dueCard: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl,
    margin: SPACING.lg, padding: SPACING.xl, alignItems: 'center', gap: 8,
  },
  dueEmoji: { fontSize: 48 },
  dueCount: { fontSize: 56, fontWeight: '900', color: COLORS.white, lineHeight: 64 },
  dueLabel: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  startBtn: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 13, paddingHorizontal: SPACING.xl,
  },
  startBtnDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.surfaceAlt,
  },
  startBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  statBox: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', gap: 4, borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: COLORS.textPrimary,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  flashRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: 8,
  },
  flashLeft: { flex: 1 },
  flashPl: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  flashPhonetic: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 2 },
  flashFr: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },
  flashStatus: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
