// ============================================================
// app/stats.tsx
// Statistiques avancées — graphiques, progression, analyses
// Fonctionnalité Premium
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - SPACING.lg * 2 - 32;

// ── Types ────────────────────────────────────────────────────
interface DailyActivity {
  date: string;      // 'YYYY-MM-DD'
  xp: number;
  lessonsCompleted: number;
  minutesSpent: number;
  streakDay: boolean;
}

interface WeeklyStats {
  totalXP: number;
  totalLessons: number;
  totalMinutes: number;
  avgDailyXP: number;
  bestDay: string;
  activeDays: number;
}

type StatsTab = 'semaine' | 'mois' | 'total';

// ── Génération de données de démo ────────────────────────────
function generateDemoActivity(days = 30): DailyActivity[] {
  const activity: DailyActivity[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Simuler une activité réaliste (pas tous les jours)
    const isActive = Math.random() > 0.25;
    activity.push({
      date: dateStr,
      xp: isActive ? Math.floor(Math.random() * 150) + 20 : 0,
      lessonsCompleted: isActive ? Math.floor(Math.random() * 4) + 1 : 0,
      minutesSpent: isActive ? Math.floor(Math.random() * 25) + 5 : 0,
      streakDay: isActive,
    });
  }
  return activity;
}

function computeWeeklyStats(activity: DailyActivity[]): WeeklyStats {
  const last7 = activity.slice(-7);
  const totalXP = last7.reduce((s, d) => s + d.xp, 0);
  const totalLessons = last7.reduce((s, d) => s + d.lessonsCompleted, 0);
  const totalMinutes = last7.reduce((s, d) => s + d.minutesSpent, 0);
  const activeDays = last7.filter(d => d.streakDay).length;
  const bestDay = last7.reduce((a, b) => (a.xp > b.xp ? a : b), last7[0]);

  return {
    totalXP,
    totalLessons,
    totalMinutes,
    avgDailyXP: Math.round(totalXP / 7),
    bestDay: bestDay?.date ?? '',
    activeDays,
  };
}

// ── Mini graphique à barres ──────────────────────────────────
function BarChart({
  data, maxVal, color = COLORS.primary, height = 80,
}: {
  data: number[];
  maxVal: number;
  color?: string;
  height?: number;
}) {
  const barWidth = (CHART_W - (data.length - 1) * 4) / data.length;
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: maxVal > 0 ? data[i] / maxVal : 0,
        duration: 600 + i * 40,
        useNativeDriver: false,
      })
    );
    Animated.stagger(40, animations).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
      {data.map((val, i) => (
        <Animated.View
          key={i}
          style={{
            width: barWidth,
            height: anims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [val === 0 ? 3 : 3, height],
            }),
            backgroundColor: val === 0 ? COLORS.surfaceAlt : color,
            borderRadius: 4,
            opacity: val === 0 ? 0.3 : 1,
          }}
        />
      ))}
    </View>
  );
}

// ── Graphique de streak (heatmap simplifié) ───────────────────
function StreakHeatmap({ activity }: { activity: DailyActivity[] }) {
  const last28 = activity.slice(-28);
  const weeks: DailyActivity[][] = [];
  for (let i = 0; i < last28.length; i += 7) {
    weeks.push(last28.slice(i, i + 7));
  }

  const maxXP = Math.max(...last28.map(d => d.xp), 1);

  const getColor = (xp: number) => {
    if (xp === 0) return COLORS.surfaceAlt;
    const intensity = xp / maxXP;
    if (intensity < 0.25) return COLORS.primary + '35';
    if (intensity < 0.5) return COLORS.primary + '65';
    if (intensity < 0.75) return COLORS.primary + '90';
    return COLORS.primary;
  };

  const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <View style={hm.container}>
      <View style={hm.labels}>
        {DAY_LABELS.map((l, i) => (
          <Text key={i} style={hm.dayLabel}>{l}</Text>
        ))}
      </View>
      <View style={hm.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={hm.week}>
            {week.map((day, di) => (
              <View
                key={di}
                style={[hm.cell, { backgroundColor: getColor(day.xp) }]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const hm = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6 },
  labels: { gap: 4, justifyContent: 'space-around', paddingTop: 2 },
  dayLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', width: 12, textAlign: 'center' },
  grid: { flex: 1, flexDirection: 'row', gap: 4 },
  week: { flex: 1, gap: 4 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 3, minHeight: 14 },
});

// ── Composant principal ──────────────────────────────────────
export default function StatsScreen() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<StatsTab>('semaine');
  const [activity] = useState<DailyActivity[]>(() => generateDemoActivity(30));
  const [weeklyStats] = useState<WeeklyStats>(() => computeWeeklyStats(activity));

  const last7XP = activity.slice(-7).map(d => d.xp);
  const last7Lessons = activity.slice(-7).map(d => d.lessonsCompleted);
  const last7Minutes = activity.slice(-7).map(d => d.minutesSpent);
  const maxXP = Math.max(...last7XP, 1);
  const maxLessons = Math.max(...last7Lessons, 1);

  const DAYS_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const todayIdx = new Date().getDay();
  const reorderedLabels = [
    ...DAYS_LABELS.slice(todayIdx),
    ...DAYS_LABELS.slice(0, todayIdx),
  ].slice(0, 7);

  const formatMinutes = (min: number) => {
    if (min < 60) return `${min} min`;
    return `${Math.floor(min / 60)}h ${min % 60}min`;
  };

  const completionRate = Math.round(
    (user?.progress.totalLessonsCompleted ?? 0) / 50 * 100
  );

  const masteredWords = user?.progress.masteredFlashcards.length ?? 0;
  const totalWords = 500;
  const vocabRate = Math.round((masteredWords / totalWords) * 100);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backTxt}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📊 Mes statistiques</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Onglets de période ── */}
        <View style={s.tabs}>
          {(['semaine', 'mois', 'total'] as StatsTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── KPIs principaux ── */}
        <View style={s.kpiGrid}>
          <View style={s.kpiCard}>
            <Text style={[s.kpiVal, { color: COLORS.xpGold }]}>{weeklyStats.totalXP}</Text>
            <Text style={s.kpiLabel}>XP cette semaine</Text>
            <Text style={s.kpiSub}>~{weeklyStats.avgDailyXP} XP/jour</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={[s.kpiVal, { color: COLORS.success }]}>{weeklyStats.totalLessons}</Text>
            <Text style={s.kpiLabel}>Leçons terminées</Text>
            <Text style={s.kpiSub}>7 derniers jours</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={[s.kpiVal, { color: COLORS.primary }]}>{weeklyStats.activeDays}/7</Text>
            <Text style={s.kpiLabel}>Jours actifs</Text>
            <Text style={s.kpiSub}>Cette semaine</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={[s.kpiVal, { color: COLORS.info }]}>
              {formatMinutes(weeklyStats.totalMinutes)}
            </Text>
            <Text style={s.kpiLabel}>Temps d'étude</Text>
            <Text style={s.kpiSub}>Cette semaine</Text>
          </View>
        </View>

        {/* ── Graphique XP ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>⭐ XP par jour</Text>
          <BarChart data={last7XP} maxVal={maxXP} color={COLORS.xpGold} height={100} />
          <View style={s.chartLabels}>
            {reorderedLabels.map((l, i) => (
              <Text key={i} style={s.chartLabel}>{l}</Text>
            ))}
          </View>
          <View style={s.chartFooter}>
            <Text style={s.chartFooterTxt}>
              Max cette semaine : <Text style={{ color: COLORS.xpGold, fontWeight: '800' }}>
                {Math.max(...last7XP)} XP
              </Text>
            </Text>
          </View>
        </View>

        {/* ── Graphique Leçons ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>📚 Leçons par jour</Text>
          <BarChart data={last7Lessons} maxVal={maxLessons} color={COLORS.success} height={80} />
          <View style={s.chartLabels}>
            {reorderedLabels.map((l, i) => (
              <Text key={i} style={s.chartLabel}>{l}</Text>
            ))}
          </View>
        </View>

        {/* ── Heatmap d'activité ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>🔥 Activité — 28 derniers jours</Text>
          <StreakHeatmap activity={activity} />
          <View style={s.heatmapLegend}>
            <Text style={s.legendTxt}>Moins</Text>
            {[0.1, 0.35, 0.65, 0.9, 1].map((op, i) => (
              <View
                key={i}
                style={[s.legendDot, {
                  backgroundColor: op < 0.2 ? COLORS.surfaceAlt : `${COLORS.primary}${Math.round(op * 255).toString(16).padStart(2, '0')}`,
                }]}
              />
            ))}
            <Text style={s.legendTxt}>Plus</Text>
          </View>
        </View>

        {/* ── Progression du contenu ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>📈 Progression du contenu</Text>

          <View style={s.progressItem}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>📚 Leçons</Text>
              <Text style={s.progressPct}>{completionRate}%</Text>
            </View>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, {
                width: `${completionRate}%`, backgroundColor: COLORS.primary,
              }]} />
            </View>
            <Text style={s.progressSub}>
              {user?.progress.totalLessonsCompleted ?? 0} / 50 leçons
            </Text>
          </View>

          <View style={s.progressItem}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>🃏 Vocabulaire</Text>
              <Text style={s.progressPct}>{vocabRate}%</Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, {
                width: `${vocabRate}%`, backgroundColor: COLORS.success,
              }]} />
            </View>
            <Text style={s.progressSub}>{masteredWords} / {totalWords} mots maîtrisés</Text>
          </View>

          <View style={s.progressItem}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>🔥 Série actuelle</Text>
              <Text style={[s.progressPct, { color: COLORS.streakOrange ?? '#FF6B35' }]}>
                {user?.streak ?? 0} jours
              </Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, {
                width: `${Math.min(100, ((user?.streak ?? 0) / 30) * 100)}%`,
                backgroundColor: COLORS.streakOrange ?? '#FF6B35',
              }]} />
            </View>
            <Text style={s.progressSub}>
              Record : {user?.longestStreak ?? 0} jours
            </Text>
          </View>
        </View>

        {/* ── Statistiques globales ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>🏆 Statistiques globales</Text>
          <View style={s.globalGrid}>
            {[
              { label: 'XP total', value: user?.xp ?? 0, emoji: '⭐', color: COLORS.xpGold },
              { label: 'Niveau', value: user?.level ?? 1, emoji: '🎯', color: COLORS.primary },
              { label: 'Leçons', value: user?.progress.totalLessonsCompleted ?? 0, emoji: '📚', color: COLORS.success },
              { label: 'Badges', value: user?.achievements.length ?? 0, emoji: '🏅', color: COLORS.info },
              { label: 'Mots appris', value: masteredWords, emoji: '🧠', color: COLORS.green ?? '#2d7a4f' },
              { label: 'Plus long streak', value: user?.longestStreak ?? 0, emoji: '🔥', color: '#FF6B35' },
            ].map((stat) => (
              <View key={stat.label} style={s.globalStat}>
                <Text style={s.globalStatEmoji}>{stat.emoji}</Text>
                <Text style={[s.globalStatVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.globalStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Insights personnalisés ── */}
        <View style={s.insightsCard}>
          <Text style={s.insightsTitle}>💡 Conseils personnalisés</Text>
          {generateInsights(user, weeklyStats).map((insight, i) => (
            <View key={i} style={s.insightRow}>
              <Text style={s.insightEmoji}>{insight.emoji}</Text>
              <View style={s.insightBody}>
                <Text style={s.insightTitle}>{insight.title}</Text>
                <Text style={s.insightDesc}>{insight.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Génération d'insights ────────────────────────────────────
function generateInsights(
  user: any,
  weeklyStats: WeeklyStats,
): Array<{ emoji: string; title: string; desc: string }> {
  const insights = [];

  if (weeklyStats.activeDays < 4) {
    insights.push({
      emoji: '📅',
      title: 'Augmentez votre régularité',
      desc: `Vous avez été actif ${weeklyStats.activeDays} jours cette semaine. Essayez d'atteindre 5 jours !`,
    });
  } else {
    insights.push({
      emoji: '🎉',
      title: 'Excellente régularité !',
      desc: `${weeklyStats.activeDays} jours actifs cette semaine. Continuez sur cette lancée !`,
    });
  }

  if (weeklyStats.avgDailyXP < 50) {
    insights.push({
      emoji: '⚡',
      title: 'Boostez vos sessions',
      desc: 'Essayez de faire 2 leçons par session pour doubler votre XP quotidien.',
    });
  }

  if ((user?.streak ?? 0) >= 7) {
    insights.push({
      emoji: '🔥',
      title: 'Série impressionnante !',
      desc: `${user?.streak} jours consécutifs ! Le prochain palier est à 30 jours.`,
    });
  }

  if ((user?.progress.masteredFlashcards.length ?? 0) < 20) {
    insights.push({
      emoji: '🃏',
      title: 'Pratiquez les flashcards',
      desc: 'Revisitez vos flashcards chaque jour pour ancrer le vocabulaire dans la mémoire long terme.',
    });
  }

  return insights.slice(0, 3);
}

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SPACING.lg, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },

  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, padding: 4,
    borderWidth: 1, borderColor: COLORS.surfaceAlt,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BORDER_RADIUS.lg },
  tabActive: { backgroundColor: COLORS.primary },
  tabTxt: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  tabTxtActive: { color: COLORS.white },

  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    padding: SPACING.lg,
  },
  kpiCard: {
    width: '47%', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  kpiVal: { fontSize: 28, fontWeight: '900' },
  kpiLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  kpiSub: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },

  chartCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    padding: SPACING.lg, gap: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  chartTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', flex: 1, textAlign: 'center' },
  chartFooter: { alignItems: 'center' },
  chartFooterTxt: { fontSize: 12, color: COLORS.textSecondary },

  heatmapLegend: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end',
  },
  legendTxt: { fontSize: 10, color: COLORS.textMuted },
  legendDot: { width: 12, height: 12, borderRadius: 3 },

  progressItem: { gap: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  progressPct: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  progressTrack: {
    height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: BORDER_RADIUS.full },
  progressSub: { fontSize: 11, color: COLORS.textMuted },

  globalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  globalStat: {
    width: '30%', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  globalStatEmoji: { fontSize: 22 },
  globalStatVal: { fontSize: 22, fontWeight: '900' },
  globalStatLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },

  insightsCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    padding: SPACING.lg, gap: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  insightsTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  insightRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  insightEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  insightBody: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  insightDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
});
