// ============================================================
// app/(tabs)/index.tsx — VERSION STREAMLINED (Duolingo-style)
// Écran Accueil — Focus sur la progression et l'action
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/store/userStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useProgress } from '@/hooks/useProgress';
import { useSync } from '@/hooks/useSync';
import { useFlashcardAudio } from '@/hooks/useAudio';
import { getAudioUrl } from '@/utils/media';
import { ALL_LOCAL_LESSONS } from '@/content/lessons';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { formatNumber } from '@/utils';
import type { VocabItem } from '@/types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const { isPremium } = usePremiumGate();
  const {
    streakDays, todayKey, totalXp, dailyMinutes, targetMinutes, dailyPercentage,
    refreshDailyStats
  } = useProgress();
  const { triggerSync } = useSync();
  const { playCard, isPlaying } = useFlashcardAudio();

  const [refreshing, setRefreshing] = useState(false);

  const wordOfDay = useMemo<VocabItem | null>(() => {
    const completedIds = user?.progress?.completedLessons ?? [];
    const completedLessons = ALL_LOCAL_LESSONS.filter(
      l => completedIds.includes(l.id) && l.discoveryItems && l.discoveryItems.length > 0
    );

    let candidateItems: VocabItem[] = [];

    if (completedLessons.length > 0) {
      candidateItems = completedLessons
        .flatMap(l => l.discoveryItems ?? [])
        .filter(i => i.itemType !== 'sound');
    }

    // Repli : première leçon dans ALL_LOCAL_LESSONS ayant au moins un item hors 'sound' (ex: 2.1)
    if (candidateItems.length === 0) {
      const firstLessonWithVocab = ALL_LOCAL_LESSONS.find(
        l => l.discoveryItems && l.discoveryItems.some(i => i.itemType !== 'sound')
      );
      if (firstLessonWithVocab?.discoveryItems) {
        candidateItems = firstLessonWithVocab.discoveryItems.filter(i => i.itemType !== 'sound');
      }
    }

    if (candidateItems.length === 0) return null;

    const [year, month, day] = todayKey.split('-').map(Number);
    const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
    const candidateIndex = dayNumber % candidateItems.length;

    return candidateItems[candidateIndex] ?? null;
  }, [user?.progress?.completedLessons, todayKey]);

  // Rafraîchir les stats quand l'écran gagne le focus
  useFocusEffect(
    useCallback(() => {
      refreshDailyStats();
    }, [refreshDailyStats])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await triggerSync();
    setRefreshing(false);
  }, []);

  // Déterminer la prochaine leçon
  const nextLesson = useMemo(() => {
    const completed = user?.progress.completedLessons ?? [];
    return ALL_LOCAL_LESSONS.find(l => !completed.includes(l.id)) || ALL_LOCAL_LESSONS[0];
  }, [user?.progress.completedLessons]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── HEADER SECTION (Compact) ── */}
      <View style={s.header}>
        <Text style={s.greeting}>Dzień dobry! 👋</Text>
        <View style={s.headerBadges}>
          <View style={s.badge}>
            <Text style={s.badgeTxt}>🔥 {streakDays}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[s.badgeTxt, { color: '#D97706' }]}>⭐ {formatNumber(totalXp)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── DAILY GOAL INDICATOR (Compact) ── */}
        <View style={s.dailyGoalMini}>
          <View style={s.goalTrack}>
            <View style={[s.goalFill, { width: `${Math.min(dailyPercentage, 100)}%` }]} />
          </View>
          <Text style={s.goalTxt}>{t('home.daily_goal', { done: dailyMinutes, goal: targetMinutes })}</Text>
        </View>

        {/* ── MAIN CALL-TO-ACTION CARD (Hero) ── */}
        <TouchableOpacity
          style={s.heroCard}
          onPress={() => router.push(`/lesson/${nextLesson.id}`)}
          activeOpacity={0.9}
        >
          <View style={s.heroTop}>
            <View style={s.heroInfo}>
              <Text style={s.heroLabel}>{t('home.continue_learning_label')}</Text>
              <Text style={s.heroTitle}>{nextLesson.title}</Text>
              <Text style={s.heroSub}>
                Module {nextLesson.moduleId.split('_')[1]} • {t(`modules.${nextLesson.moduleId}` as any)}
              </Text>
            </View>
            <View style={s.heroIconBox}>
              <Text style={s.heroIcon}>📚</Text>
            </View>
          </View>

          <View style={s.heroBtn}>
            <Text style={s.heroBtnTxt}>{t('home.continue_learning_btn')}</Text>
          </View>
        </TouchableOpacity>

        {/* ── QUICK ACTIONS (Secondary) ── */}
        <View style={s.quickActionsRow}>
          <TouchableOpacity
            style={s.actionChip}
            onPress={() => router.push('/(tabs)/review')}
          >
            <Text style={s.actionEmoji}>🔄</Text>
            <Text style={s.actionLabel}>{t('home.quick_review')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionChip}
            onPress={() => router.push('/quiz/quiz_salutations_01')}
          >
            <Text style={s.actionEmoji}>🎯</Text>
            <Text style={s.actionLabel}>{t('home.daily_quiz')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── MOT DU JOUR (Bottom) ── */}
        {wordOfDay && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>📖 {t('home.word_of_day')}</Text>
            </View>
            <View style={s.wordCard}>
              <View style={s.wordMain}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.wordPl}>{wordOfDay.front}</Text>
                    {wordOfDay.emoji && <Text style={{ fontSize: 18 }}>{wordOfDay.emoji}</Text>}
                  </View>
                  <Text style={s.wordFr}>{wordOfDay.back}</Text>
                </View>
                <TouchableOpacity
                  style={s.audioBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    playCard(wordOfDay.audioUrl || getAudioUrl(wordOfDay.id), wordOfDay.ttsText ?? wordOfDay.front);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20 }}>{isPlaying ? '🔊' : '🔈'}</Text>
                </TouchableOpacity>
              </View>
              {wordOfDay.phonetic && <Text style={s.wordPhonetic}>{wordOfDay.phonetic}</Text>}
            </View>
          </>
        )}

        {/* Spacer pour le tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  greeting: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  headerBadges: { flexDirection: 'row', gap: 8 },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeTxt: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  scrollContent: { padding: SPACING.lg },

  dailyGoalMini: { marginBottom: SPACING.xl, gap: 6 },
  goalTrack: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 5 },
  goalTxt: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'right' },

  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: SPACING.xl,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  heroInfo: { flex: 1, gap: 4 },
  heroLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroIconBox: {
    width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  heroIcon: { fontSize: 28 },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  heroBtnTxt: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },

  quickActionsRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.xxl },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.lg,
    padding: 12,
  },
  actionEmoji: { fontSize: 18 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  wordCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  wordMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordPl: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  wordFr: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  wordPhonetic: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  audioBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
