import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { COLORS, BORDER_RADIUS, SPACING, GAMIFICATION } from '@/constants';

interface LessonCompletedProps {
  score: number;
  total: number;
  xpEarned: number;
  lessonId: string;
}

export default function LessonCompleted({ score, total, xpEarned, lessonId }: LessonCompletedProps) {
  const { t } = useTranslation();
  const percentage = Math.round((score / total) * 100);
  const isPerfect = score === total;

  return (
    <SafeAreaView style={res.safe} edges={['top', 'bottom']}>
      <View style={res.container}>
        <Text style={res.emoji}>{isPerfect ? '🏆' : percentage >= 70 ? '⭐' : '💪'}</Text>
        <Text style={res.title}>
          {isPerfect ? t('lesson.completed.perfect') : percentage >= 70 ? t('lesson.completed.great') : t('lesson.completed.good')}
        </Text>

        <View style={res.statsRow}>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.success }]}>{score}/{total}</Text>
            <Text style={res.statLabel}>{t('lesson.completed.stats.correct')}</Text>
          </View>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.xpGold }]}>+{xpEarned}</Text>
            <Text style={res.statLabel}>{t('lesson.completed.stats.xp')}</Text>
          </View>
          <View style={res.statBox}>
            <Text style={[res.statValue, { color: COLORS.primary }]}>{percentage}%</Text>
            <Text style={res.statLabel}>{t('lesson.completed.stats.score')}</Text>
          </View>
        </View>

        {isPerfect && (
          <View style={res.bonusBox}>
            <Text style={res.bonusText}>{t('lesson.completed.bonus_perfect', { count: GAMIFICATION.XP_PER_PERFECT })}</Text>
          </View>
        )}

        <TouchableOpacity style={res.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={res.homeBtnText}>{t('lesson.completed.btn_home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={res.replayBtn} onPress={() => router.replace(`/lesson/${lessonId}`)}>
          <Text style={res.replayBtnText}>{t('lesson.completed.btn_replay')}</Text>
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
