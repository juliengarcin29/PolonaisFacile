// ============================================================
// app/(tabs)/index.tsx — VERSION FINALE
// Écran Accueil — tableau de bord complet
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useGamification } from '@/hooks/useGamification';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import { useSync } from '@/hooks/useSync';
import { DailyGoalWidget } from '@/components/ui/DailyGoalWidget';
import { WeeklyReviewModal } from '@/components/ui/WeeklyReviewModal';
import { XPBar } from '@/components/ui/components';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { getStreakEmoji, formatNumber, getXPProgress } from '@/utils';

// ── Mot du jour (rotatif) ─────────────────────────────────────
const WORDS_OF_DAY = [
  { pl: 'Dziękuję', fr: 'Merci', phonetic: '[dʑɛŋkujɛ]', example: 'Bardzo dziękuję!', exampleFr: 'Merci beaucoup !' },
  { pl: 'Przepraszam', fr: 'Pardon', phonetic: '[pʂɛpraʂam]', example: 'Przepraszam, où est...?', exampleFr: 'Excusez-moi, où est... ?' },
  { pl: 'Proszę', fr: 'S\'il vous plaît', phonetic: '[prɔʂɛ]', example: 'Poproszę kawę.', exampleFr: 'Un café, s\'il vous plaît.' },
  { pl: 'Dobrze', fr: 'Bien / D\'accord', phonetic: '[dɔbʐɛ]', example: 'Dobrze, rozumiem.', exampleFr: 'Bien, je comprends.' },
  { pl: 'Tak', fr: 'Oui', phonetic: '[tak]', example: 'Tak, oczywiście!', exampleFr: 'Oui, bien sûr !' },
  { pl: 'Nie', fr: 'Non', phonetic: '[ɲɛ]', example: 'Nie, dziękuję.', exampleFr: 'Non, merci.' },
  { pl: 'Cześć', fr: 'Salut', phonetic: '[tʂɛɕtɕ]', example: 'Cześć, co słychać?', exampleFr: 'Salut, quoi de neuf ?' },
];

function getTodayWord() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return WORDS_OF_DAY[dayOfYear % WORDS_OF_DAY.length];
}

// ── Composant principal ──────────────────────────────────────
export default function HomeScreen() {
  const { user } = useUserStore();
  const { isPremium } = usePremiumGate();
  const { checkAndUpdateStreak, getDailyProgress } = useGamification();
  const { weeklyData, recommendations, showReviewModal, dismissReview } = useWeeklyReview();
  const { triggerSync, isSyncing } = useSync();
  const [refreshing, setRefreshing] = useState(false);
  const [wordOfDay] = useState(getTodayWord);
  const [showWordDetail, setShowWordDetail] = useState(false);

  const xpProgress = getXPProgress(user?.xp ?? 0);

  // Vérifier streak au montage
  useEffect(() => {
    checkAndUpdateStreak();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await triggerSync();
    setRefreshing(false);
  }, []);

  const QUICK_ACTIONS = [
    {
      emoji: '📚',
      label: 'Leçon',
      sublabel: 'Apprendre',
      color: COLORS.primary,
      route: '/(tabs)/learn',
    },
    {
      emoji: '🃏',
      label: 'Révision',
      sublabel: 'Flashcards',
      color: '#3B82F6',
      route: '/(tabs)/review',
    },
    {
      emoji: '🎯',
      label: 'Quiz',
      sublabel: 'S\'évaluer',
      color: '#22C55E',
      route: '/quiz/quiz_salutations_01',
    },
    {
      emoji: '🤖',
      label: 'Parler',
      sublabel: 'IA',
      color: '#8B5CF6',
      route: isPremium ? '/conversation' : '/paywall?reason=default',
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>
              {getGreeting()}, {user?.displayName?.split(' ')[0] ?? 'Apprenant'} 👋
            </Text>
            <Text style={s.subtitle}>
              {user?.streak && user.streak > 0
                ? `${getStreakEmoji(user.streak)} ${user.streak} jour${user.streak > 1 ? 's' : ''} de série !`
                : 'Commencez votre apprentissage !'}
            </Text>
          </View>
          <TouchableOpacity
            style={s.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={s.avatarEmoji}>
              {isPremium ? '👑' : '👤'}
            </Text>
            {isPremium && (
              <View style={s.premiumDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── XP Bar ── */}
        <View style={s.xpWrap}>
          <View style={s.xpRow}>
            <Text style={s.xpLevel}>Niveau {xpProgress.level}</Text>
            <Text style={s.xpValue}>⭐ {formatNumber(user?.xp ?? 0)} XP</Text>
          </View>
          <View style={s.xpTrack}>
            <View style={[s.xpFill, { width: `${xpProgress.percentage}%` }]} />
          </View>
          <Text style={s.xpNext}>
            {xpProgress.xpForNextLevel - (user?.xp ?? 0)} XP pour le niveau {xpProgress.level + 1}
          </Text>
        </View>

        {/* ── Objectif quotidien ── */}
        <View style={s.section}>
          <DailyGoalWidget />
        </View>

        {/* ── Actions rapides ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Que voulez-vous faire ?</Text>
        </View>
        <View style={s.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[s.quickAction, { borderTopColor: action.color }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <View style={[s.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                <Text style={s.quickActionEmoji}>{action.emoji}</Text>
              </View>
              <Text style={s.quickActionLabel}>{action.label}</Text>
              <Text style={s.quickActionSub}>{action.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Mot du jour ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📖 Mot du jour</Text>
          <Text style={s.sectionSub}>Nouveau chaque jour</Text>
        </View>
        <TouchableOpacity
          style={s.wordCard}
          onPress={() => setShowWordDetail(!showWordDetail)}
          activeOpacity={0.9}
        >
          <View style={s.wordCardHeader}>
            <View>
              <Text style={s.wordPl}>{wordOfDay.pl}</Text>
              <Text style={s.wordPhonetic}>{wordOfDay.phonetic}</Text>
            </View>
            <View style={s.wordFrWrap}>
              <Text style={s.wordFr}>{wordOfDay.fr}</Text>
            </View>
          </View>

          {showWordDetail && (
            <View style={s.wordDetail}>
              <View style={s.wordDivider} />
              <Text style={s.wordExample}>{wordOfDay.example}</Text>
              <Text style={s.wordExampleFr}>{wordOfDay.exampleFr}</Text>
            </View>
          )}

          <Text style={s.wordTapHint}>
            {showWordDetail ? '▲ Réduire' : '▼ Voir un exemple'}
          </Text>
        </TouchableOpacity>

        {/* ── Modules récents / Continue ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>🚀 Par où commencer ?</Text>
        </View>
        <View style={s.modulesList}>
          {STARTER_MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={s.moduleRow}
              onPress={() => router.push('/(tabs)/learn')}
              activeOpacity={0.8}
            >
              <View style={[s.moduleIcon, { backgroundColor: mod.color + '18' }]}>
                <Text style={s.moduleEmoji}>{mod.emoji}</Text>
              </View>
              <View style={s.moduleInfo}>
                <Text style={s.moduleName}>{mod.title}</Text>
                <Text style={s.moduleMeta}>{mod.meta}</Text>
              </View>
              <View style={[s.moduleTag, { backgroundColor: mod.color + '15' }]}>
                <Text style={[s.moduleTagTxt, { color: mod.color }]}>{mod.tag}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Upsell Premium (si pas Premium) ── */}
        {!isPremium && (
          <TouchableOpacity
            style={s.premiumBanner}
            onPress={() => router.push('/paywall?reason=default')}
            activeOpacity={0.9}
          >
            <View style={s.premiumBannerLeft}>
              <Text style={s.premiumBannerEmoji}>⭐</Text>
            </View>
            <View style={s.premiumBannerBody}>
              <Text style={s.premiumBannerTitle}>Essayer Premium 7 jours gratuits</Text>
              <Text style={s.premiumBannerDesc}>
                Dialogues, dictées, IA conversationnelle et plus
              </Text>
            </View>
            <Text style={s.premiumBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Stats rapides ── */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statEmoji}>🔥</Text>
            <Text style={s.statVal}>{user?.streak ?? 0}</Text>
            <Text style={s.statLabel}>Série</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statEmoji}>📚</Text>
            <Text style={s.statVal}>{user?.progress.totalLessonsCompleted ?? 0}</Text>
            <Text style={s.statLabel}>Leçons</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statEmoji}>🧠</Text>
            <Text style={s.statVal}>{user?.progress.masteredFlashcards.length ?? 0}</Text>
            <Text style={s.statLabel}>Mots</Text>
          </View>
          <TouchableOpacity
            style={[s.statBox, s.statBoxLink]}
            onPress={() => router.push('/stats')}
          >
            <Text style={s.statEmoji}>📊</Text>
            <Text style={[s.statVal, { color: COLORS.primary }]}>Tout</Text>
            <Text style={s.statLabel}>Voir stats</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* ── Bilan hebdomadaire ── */}
      <WeeklyReviewModal
        visible={showReviewModal}
        data={weeklyData}
        recommendations={recommendations}
        onClose={dismissReview}
      />
    </SafeAreaView>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Dzień dobry';
  if (h < 18) return 'Dzień dobry';
  return 'Dobry wieczór';
}

const STARTER_MODULES = [
  { id: 'm1', emoji: '🔤', title: 'Alphabet & Prononciation', meta: '3 leçons · A1', color: COLORS.primary, tag: 'Commencer' },
  { id: 'm2', emoji: '👋', title: 'Salutations essentielles', meta: '4 leçons · A1', color: '#3B82F6', tag: 'Populaire' },
  { id: 'm3', emoji: '🔢', title: 'Chiffres et nombres', meta: '3 leçons · A1', color: '#22C55E', tag: 'Facile' },
];

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },
  greeting: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  subtitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    position: 'relative',
  },
  avatarEmoji: { fontSize: 22 },
  premiumDot: {
    position: 'absolute', top: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#D4AF37', borderWidth: 2, borderColor: COLORS.white,
  },

  xpWrap: {
    marginHorizontal: SPACING.lg, backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    marginBottom: SPACING.md,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLevel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  xpValue: { fontSize: 13, fontWeight: '700', color: COLORS.xpGold },
  xpTrack: {
    height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  xpFill: {
    height: '100%', backgroundColor: COLORS.xpGold,
    borderRadius: BORDER_RADIUS.full, minWidth: 8,
  },
  xpNext: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  sectionSub: { fontSize: 12, color: COLORS.textMuted },

  quickActions: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg,
    gap: 10, marginBottom: SPACING.lg,
  },
  quickAction: {
    flex: 1, backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl, padding: 12,
    alignItems: 'center', gap: 4, borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: BORDER_RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  quickActionSub: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },

  wordCard: {
    marginHorizontal: SPACING.lg, backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderTopWidth: 3, borderTopColor: COLORS.primary,
  },
  wordCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wordPl: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  wordPhonetic: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 2 },
  wordFrWrap: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  wordFr: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  wordDetail: { marginTop: SPACING.sm },
  wordDivider: { height: 1, backgroundColor: COLORS.surfaceAlt, marginBottom: SPACING.sm },
  wordExample: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  wordExampleFr: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  wordTapHint: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },

  modulesList: { paddingHorizontal: SPACING.lg, gap: 10, marginBottom: SPACING.lg },
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  moduleIcon: {
    width: 48, height: 48, borderRadius: BORDER_RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  moduleEmoji: { fontSize: 24 },
  moduleInfo: { flex: 1 },
  moduleName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  moduleMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  moduleTag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.full,
  },
  moduleTagTxt: { fontSize: 10, fontWeight: '800' },

  premiumBanner: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.textPrimary, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    shadowColor: COLORS.textPrimary, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  premiumBannerLeft: {
    width: 44, height: 44, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumBannerEmoji: { fontSize: 22 },
  premiumBannerBody: { flex: 1 },
  premiumBannerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  premiumBannerDesc: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  premiumBannerArrow: { fontSize: 22, color: 'rgba(255,255,255,0.5)' },

  statsRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: 10, marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm, alignItems: 'center', gap: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  statBoxLink: { borderWidth: 1, borderColor: COLORS.primary + '30' },
  statEmoji: { fontSize: 18 },
  statVal: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
});
