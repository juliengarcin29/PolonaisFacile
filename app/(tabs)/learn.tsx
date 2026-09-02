// ============================================================
// app/(tabs)/learn.tsx
// Onglet Apprendre — modules + contenu Premium enrichi
// ============================================================

import { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { getLessonsByModule, ALL_LOCAL_LESSONS } from '@/content/lessons';
import { DIALOGUES as DIALOGUE_DATA } from '@/content/dialogues/dialogues';
import { DICTATIONS as DICTATION_DATA } from '@/content/dictations/dictations';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import type { DifficultyLevel } from '@/types';

// ── Types ────────────────────────────────────────────────────
type LearnTab = 'modules' | 'dialogues' | 'dictees';

// ── Configuration des Modules (Metadata) ─────────────────────
const MODULE_METADATA = [
  { id: 'module_1', emoji: '🔤', title: 'Alphabet & Prononciation', color: COLORS.primary, free: true },
  { id: 'module_2', emoji: '👋', title: 'Salutations essentielles', color: '#3B82F6', free: true },
  { id: 'module_3', emoji: '🔢', title: 'Chiffres et nombres', color: '#22C55E', free: true },
  { id: 'module_4', emoji: '👨‍👩‍👧', title: 'La famille', color: '#F59E0B', free: true },
  { id: 'module_5', emoji: '🍕', title: 'Nourriture & Boissons', color: '#8B5CF6', free: true },
  { id: 'module_6', emoji: '🏙️', title: 'Ville & Transport', color: '#06B6D4', free: false },
  { id: 'module_7', emoji: '⏰', title: 'Temps & Dates', color: '#EC4899', free: false },
];

// ── Dialogues ────────────────────────────────────────────────
const DIALOGUES = [
  { id: 'dialogue_01', emoji: '🤝', title: 'Première rencontre', difficulty: 'A1', duration: '3 min', free: true },
  { id: 'dialogue_02', emoji: '🍽️', title: 'Au restaurant', difficulty: 'A1', duration: '4 min', free: true },
  { id: 'dialogue_03', emoji: '🚌', title: 'Dans le bus', difficulty: 'A2', duration: '4 min', free: false },
  { id: 'dialogue_04', emoji: '🏨', title: 'À l\'hôtel', difficulty: 'A2', duration: '5 min', free: false },
];

// ── Dictées ──────────────────────────────────────────────────
const DICTEES = [
  { id: 'dictation_01', emoji: '👋', title: 'Salutations du quotidien', difficulty: 'A1', sentences: 5, free: true },
  { id: 'dictation_02', emoji: '☕', title: 'Au café polonais', difficulty: 'A1', sentences: 4, free: true },
  { id: 'dictation_03', emoji: '👤', title: 'Se présenter', difficulty: 'A1', sentences: 4, free: false },
];

export default function LearnScreen() {
  const [activeTab, setActiveTab] = useState<LearnTab>('modules');
  const { user } = useUserStore();
  const { isPremium } = usePremiumGate();

  // Dériver les modules avec leurs stats réelles
  const modules = useMemo(() => {
    return MODULE_METADATA.map(meta => {
      const lessons = getLessonsByModule(meta.id);
      const completedCount = lessons.filter(l => user?.progress.completedLessons.includes(l.id)).length;
      const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

      return {
        ...meta,
        lessonCount: lessons.length,
        progress,
        difficulty: lessons[0]?.difficulty || 'A1' as DifficultyLevel,
      };
    });
  }, [user?.progress.completedLessons]);

  const totalLessons = ALL_LOCAL_LESSONS.length;
  const totalCompleted = user?.progress.completedLessons.length || 0;
  const globalProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  // Filtrer uniquement les dialogues et dictées qui ont du contenu réel
  const availableDialogues = useMemo(() => {
    return DIALOGUES.filter(d => DIALOGUE_DATA.some(data => data.id === d.id));
  }, []);

  const availableDictations = useMemo(() => {
    return DICTEES.filter(d => DICTATION_DATA.some(data => data.id === d.id));
  }, []);

  const TABS: Array<{ id: LearnTab; label: string; emoji: string }> = [
    { id: 'modules', label: 'Leçons', emoji: '📚' },
    { id: 'dialogues', label: 'Dialogues', emoji: '💬' },
    { id: 'dictees', label: 'Dictées', emoji: '🎤' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Apprendre</Text>
        <TouchableOpacity
          style={s.statsBtn}
          onPress={() => router.push('/stats')}
        >
          <Text style={s.statsBtnTxt}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Navigation */}
      <View style={s.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* ── MODULES PATH ── */}
        {activeTab === 'modules' && (
          <View style={s.content}>
            {/* Progression globale */}
            <View style={s.progressCard}>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>Progression globale</Text>
                <Text style={s.progressPct}>{globalProgress}%</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${globalProgress}%` }]} />
              </View>
              <Text style={s.progressSub}>{totalCompleted} / {totalLessons} leçons terminées</Text>
            </View>

            {modules.map((mod, index) => {
              const isLocked = !mod.free && !isPremium;
              return (
                <TouchableOpacity
                  key={mod.id}
                  style={s.moduleCard}
                  onPress={() => {
                    if (isLocked) {
                      router.push('/paywall?reason=lesson');
                    } else {
                      router.push(`/module/${mod.id}`);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[s.moduleIcon, { backgroundColor: mod.color + '18' }]}>
                    <Text style={s.moduleEmoji}>{mod.emoji}</Text>
                    <View style={s.moduleNum}>
                      <Text style={s.moduleNumTxt}>{index + 1}</Text>
                    </View>
                  </View>

                  <View style={s.moduleBody}>
                    <Text style={s.moduleName}>{mod.title}</Text>
                    <View style={s.moduleMetaRow}>
                      <Text style={s.moduleMeta}>{mod.lessonCount} leçons • {mod.difficulty}</Text>
                    </View>

                    {/* Barre de progression du module */}
                    <View style={s.moduleProgressTrack}>
                      <View style={[s.moduleProgressFill, {
                        width: `${mod.progress}%`,
                        backgroundColor: mod.color
                      }]} />
                    </View>
                  </View>

                  {isLocked ? (
                    <Text style={s.lockIcon}>🔒</Text>
                  ) : (
                    <Text style={s.arrowIcon}>›</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── DIALOGUES ── */}
        {activeTab === 'dialogues' && (
          <View style={s.content}>
            {availableDialogues.map((dlg) => (
              <TouchableOpacity
                key={dlg.id}
                style={s.contentCard}
                onPress={() => {
                  if (!dlg.free && !isPremium) {
                    router.push('/paywall?reason=lesson');
                  } else {
                    router.push(`/dialogue/${dlg.id}`);
                  }
                }}
              >
                <View style={s.contentCardLeft}>
                  <Text style={s.contentEmoji}>{dlg.emoji}</Text>
                </View>
                <View style={s.contentCardBody}>
                  <Text style={s.contentTitle}>{dlg.title}</Text>
                  <Text style={s.contentMetaTxt}>{dlg.difficulty} • {dlg.duration}</Text>
                </View>
                {!dlg.free && !isPremium ? <Text style={s.lockIcon}>🔒</Text> : <Text style={s.arrowIcon}>›</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── DICTÉES ── */}
        {activeTab === 'dictees' && (
          <View style={s.content}>
            {availableDictations.map((dict) => (
              <TouchableOpacity
                key={dict.id}
                style={s.contentCard}
                onPress={() => {
                  if (!dict.free && !isPremium) {
                    router.push('/paywall?reason=dictation');
                  } else {
                    router.push(`/dictation/${dict.id}`);
                  }
                }}
              >
                <View style={s.contentCardLeft}>
                  <Text style={s.contentEmoji}>{dict.emoji}</Text>
                </View>
                <View style={s.contentCardBody}>
                  <Text style={s.contentTitle}>{dict.title}</Text>
                  <Text style={s.contentMetaTxt}>{dict.difficulty} • {dict.sentences} phrases</Text>
                </View>
                {!dict.free && !isPremium ? <Text style={s.lockIcon}>🔒</Text> : <Text style={s.arrowIcon}>›</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  statsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  statsBtnTxt: { fontSize: 20 },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.primary },

  scrollContent: { paddingTop: SPACING.md },
  content: { paddingHorizontal: SPACING.lg, gap: 16 },

  progressCard: {
    backgroundColor: '#F9FAFB', borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, gap: 8, marginBottom: 8,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  progressPct: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  progressTrack: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 5 },
  progressSub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  moduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl,
    padding: 16, borderWidth: 2, borderColor: '#F3F4F6',
  },
  moduleIcon: {
    width: 60, height: 60, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  moduleEmoji: { fontSize: 30 },
  moduleNum: {
    position: 'absolute', top: -6, left: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.textPrimary, alignItems: 'center', justifyContent: 'center',
  },
  moduleNumTxt: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  moduleBody: { flex: 1, gap: 6 },
  moduleName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  moduleMetaRow: { flexDirection: 'row', alignItems: 'center' },
  moduleMeta: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  moduleProgressTrack: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginTop: 4 },
  moduleProgressFill: { height: '100%', borderRadius: 2 },

  lockIcon: { fontSize: 18, opacity: 0.5 },
  arrowIcon: { fontSize: 24, color: '#D1D5DB' },

  contentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.lg,
    padding: 14, borderWidth: 2, borderColor: '#F3F4F6',
  },
  contentCardLeft: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  contentEmoji: { fontSize: 24 },
  contentCardBody: { flex: 1, gap: 2 },
  contentTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  contentMetaTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
});
