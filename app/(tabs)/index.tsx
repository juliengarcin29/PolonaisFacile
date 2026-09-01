// ============================================================
// app/(tabs)/index.tsx — VERSION STREAMLINED (Duolingo-style)
// Écran Accueil — Focus sur la progression et l'action
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useGamification } from '@/hooks/useGamification';
import { useSync } from '@/hooks/useSync';
import { ALL_LOCAL_LESSONS } from '@/content/lessons';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { getStreakEmoji, formatNumber } from '@/utils';

// ── Mot du jour (rotatif) ─────────────────────────────────────
const WORDS_OF_DAY = [
  { pl: 'Dziękuję', fr: 'Merci', phonetic: '[dʑɛŋkujɛ]' },
  { pl: 'Przepraszam', fr: 'Pardon', phonetic: '[pʂɛpraʂam]' },
  { pl: 'Proszę', fr: 'S\'il vous plaît', phonetic: '[prɔʂɛ]' },
  { pl: 'Dobrze', fr: 'Bien / D\'accord', phonetic: '[dɔbʐɛ]' },
  { pl: 'Tak', fr: 'Oui', phonetic: '[tak]' },
  { pl: 'Nie', fr: 'Non', phonetic: '[ɲɛ]' },
  { pl: 'Cześć', fr: 'Salut', phonetic: '[tʂɛɕtɕ]' },
];

function getTodayWord() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return WORDS_OF_DAY[dayOfYear % WORDS_OF_DAY.length];
}

export default function HomeScreen() {
  const { user } = useUserStore();
  const { isPremium } = usePremiumGate();
  const { checkAndUpdateStreak, getDailyProgress } = useGamification();
  const { triggerSync } = useSync();

  const [refreshing, setRefreshing] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({ done: 0, goal: 10, percentage: 0 });
  const wordOfDay = useMemo(() => getTodayWord(), []);

  // Charger la progression au montage
  useEffect(() => {
    checkAndUpdateStreak();
    getDailyProgress().then(setDailyProgress);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await triggerSync();
    const p = await getDailyProgress();
    setDailyProgress(p);
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
            <Text style={s.badgeTxt}>🔥 {user?.streak ?? 0}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[s.badgeTxt, { color: '#D97706' }]}>⭐ {formatNumber(user?.xp ?? 0)}</Text>
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
            <View style={[s.goalFill, { width: `${Math.min(dailyProgress.percentage, 100)}%` }]} />
          </View>
          <Text style={s.goalTxt}>Objectif : {dailyProgress.done}/{dailyProgress.goal} min</Text>
        </View>

        {/* ── MAIN CALL-TO-ACTION CARD (Hero) ── */}
        <TouchableOpacity
          style={s.heroCard}
          onPress={() => router.push(`/lesson/${nextLesson.id}`)}
          activeOpacity={0.9}
        >
          <View style={s.heroTop}>
            <View style={s.heroInfo}>
              <Text style={s.heroLabel}>CONTINUER L'APPRENTISSAGE</Text>
              <Text style={s.heroTitle}>{nextLesson.title}</Text>
              <Text style={s.heroSub}>Module {nextLesson.moduleId.split('_')[1]}</Text>
            </View>
            <View style={s.heroIconBox}>
              <Text style={s.heroIcon}>📚</Text>
            </View>
          </View>

          <View style={s.heroBtn}>
            <Text style={s.heroBtnTxt}>Continuer le cours →</Text>
          </View>
        </TouchableOpacity>

        {/* ── QUICK ACTIONS (Secondary) ── */}
        <View style={s.quickActionsRow}>
          <TouchableOpacity
            style={s.actionChip}
            onPress={() => router.push('/(tabs)/review')}
          >
            <Text style={s.actionEmoji}>🔄</Text>
            <Text style={s.actionLabel}>Révision rapide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionChip}
            onPress={() => router.push('/quiz/quiz_salutations_01')}
          >
            <Text style={s.actionEmoji}>🎯</Text>
            <Text style={s.actionLabel}>Quiz du jour</Text>
          </TouchableOpacity>
        </View>

        {/* ── MOT DU JOUR (Bottom) ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📖 Mot du jour</Text>
        </View>
        <View style={s.wordCard}>
          <View style={s.wordMain}>
            <Text style={s.wordPl}>{wordOfDay.pl}</Text>
            <Text style={s.wordFr}>{wordOfDay.fr}</Text>
          </View>
          <Text style={s.wordPhonetic}>{wordOfDay.phonetic}</Text>
        </View>

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
});
