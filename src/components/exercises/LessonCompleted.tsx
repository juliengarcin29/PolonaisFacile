import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, BORDER_RADIUS, SPACING, GAMIFICATION } from '@/constants';

interface LessonCompletedProps {
  score: number;
  total: number;
  xpEarned: number;
  lessonId: string;
}

export default function LessonCompleted({ score, total, xpEarned, lessonId }: LessonCompletedProps) {
  const percentage = Math.round((score / total) * 100);
  const isPerfect = score === total;

  return (
    <SafeAreaView style={res.safe}>
      <View style={res.container}>
        <Text style={res.emoji}>{isPerfect ? '🏆' : percentage >= 70 ? '⭐' : '💪'}</Text>
        <Text style={res.title}>
          {isPerfect ? 'Parfait !' : percentage >= 70 ? 'Bien joué !' : 'Continue !'}
        </Text>

        <View style={res.statsRow}>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.success }]}>{score}/{total}</Text>
            <Text style={res.statLabel}>Bonnes réponses</Text>
          </View>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.xpGold }]}>+{xpEarned}</Text>
            <Text style={res.statLabel}>XP gagnés</Text>
          </View>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.primary }]}>{percentage}%</Text>
            <Text style={res.statLabel}>Score</Text>
          </View>
        </View>

        {isPerfect && (
          <View style={res.bonusBox}>
            <Text style={res.bonusText}>🎉 Bonus Parfait ! +{GAMIFICATION.XP_PER_PERFECT} XP supplémentaires</Text>
          </View>
        )}

        <TouchableOpacity style={res.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={res.homeBtnText}>Retour à l'accueil →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={res.replayBtn} onPress={() => router.replace(`/lesson/${lessonId}`)}>
          <Text style={res.replayBtnText}>Rejouer la leçon</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const res = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 72, marginBottom: SPACING.md },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.xl },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: SPACING.xl },
  statBox: {
    flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  bonusBox: {
    backgroundColor: '#FEF3C7', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.xl,
  },
  bonusText: { fontSize: 14, fontWeight: '700', color: '#92400E', textAlign: 'center' },
  homeBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, paddingHorizontal: SPACING.xxl,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  homeBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  replayBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, width: '100%', alignItems: 'center',
  },
  replayBtnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
