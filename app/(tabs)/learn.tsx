// ============================================================
// app/(tabs)/learn_v2.tsx — VERSION MISE À JOUR
// Remplace app/(tabs)/learn.tsx
// Onglet Apprendre — modules + contenu Premium enrichi
// ============================================================

import { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

// ── Types ────────────────────────────────────────────────────
type LearnTab = 'modules' | 'dialogues' | 'dictees' | 'conversation';

// ── Modules de leçons ────────────────────────────────────────
const MODULES = [
  { id: 'module_1', emoji: '🔤', title: 'Alphabet & Prononciation', lessons: 3, color: COLORS.primary, free: true, progress: 0 },
  { id: 'module_2', emoji: '👋', title: 'Salutations', lessons: 4, color: '#3B82F6', free: true, progress: 0 },
  { id: 'module_3', emoji: '🔢', title: 'Chiffres', lessons: 3, color: '#22C55E', free: true, progress: 0 },
  { id: 'module_4', emoji: '👨‍👩‍👧', title: 'Famille', lessons: 5, color: '#F59E0B', free: false, progress: 0 },
  { id: 'module_5', emoji: '🍕', title: 'Nourriture & Boissons', lessons: 6, color: '#8B5CF6', free: false, progress: 0 },
  { id: 'module_6', emoji: '🏙️', title: 'Ville & Transport', lessons: 7, color: '#06B6D4', free: false, progress: 0 },
  { id: 'module_7', emoji: '⏰', title: 'Temps & Dates', lessons: 5, color: '#EC4899', free: false, progress: 0 },
  { id: 'module_8', emoji: '🧠', title: 'Les 7 cas polonais', lessons: 10, color: '#6366F1', free: false, progress: 0 },
  { id: 'module_9', emoji: '🔄', title: 'Conjugaison & Aspects', lessons: 8, color: '#14B8A6', free: false, progress: 0 },
  { id: 'module_10', emoji: '🎭', title: 'Culture & Expressions', lessons: 6, color: '#F97316', free: false, progress: 0 },
];

// ── Dialogues ────────────────────────────────────────────────
const DIALOGUES = [
  { id: 'dialogue_01', emoji: '🤝', title: 'Première rencontre', difficulty: 'A1', duration: '3 min', free: true },
  { id: 'dialogue_02', emoji: '🍽️', title: 'Au restaurant', difficulty: 'A1', duration: '4 min', free: true },
  { id: 'dialogue_03', emoji: '🚌', title: 'Dans le bus', difficulty: 'A2', duration: '4 min', free: false },
  { id: 'dialogue_04', emoji: '🏨', title: 'À l\'hôtel', difficulty: 'A2', duration: '5 min', free: false },
  { id: 'dialogue_05', emoji: '🛒', title: 'Au supermarché', difficulty: 'A1', duration: '3 min', free: false },
  { id: 'dialogue_06', emoji: '👨‍⚕️', title: 'Chez le médecin', difficulty: 'B1', duration: '6 min', free: false },
  { id: 'dialogue_07', emoji: '💼', title: 'Entretien d\'embauche', difficulty: 'B1', duration: '7 min', free: false },
  { id: 'dialogue_08', emoji: '🎉', title: 'Une fête polonaise', difficulty: 'A2', duration: '5 min', free: false },
];

// ── Dictées ──────────────────────────────────────────────────
const DICTEES = [
  { id: 'dictation_01', emoji: '👋', title: 'Salutations du quotidien', difficulty: 'A1', sentences: 5, free: true },
  { id: 'dictation_02', emoji: '☕', title: 'Au café polonais', difficulty: 'A1', sentences: 4, free: true },
  { id: 'dictation_03', emoji: '👤', title: 'Se présenter', difficulty: 'A1', sentences: 4, free: false },
  { id: 'dictation_04', emoji: '🔢', title: 'Les nombres', difficulty: 'A1', sentences: 5, free: false },
  { id: 'dictation_05', emoji: '🏙️', title: 'Dans la ville', difficulty: 'A2', sentences: 5, free: false },
  { id: 'dictation_06', emoji: '🍽️', title: 'À table', difficulty: 'A2', sentences: 6, free: false },
  { id: 'dictation_07', emoji: '🗓️', title: 'Jours et mois', difficulty: 'A2', sentences: 6, free: false },
  { id: 'dictation_08', emoji: '🧠', title: 'Phrases complexes', difficulty: 'B1', sentences: 5, free: false },
];

// ── Scénarios de conversation IA ──────────────────────────────
const CONVERSATION_SCENARIOS = [
  { id: 'cafe', emoji: '☕', title: 'Au café', difficulty: 'A1', desc: 'Commander et discuter', free: false },
  { id: 'market', emoji: '🛒', title: 'Au marché', difficulty: 'A1', desc: 'Acheter des produits', free: false },
  { id: 'directions', emoji: '🗺️', title: 'Demander son chemin', difficulty: 'A2', desc: 'Se repérer en ville', free: false },
  { id: 'family', emoji: '👨‍👩‍👧', title: 'Parler de sa famille', difficulty: 'A1', desc: 'Présenter sa famille', free: false },
  { id: 'free', emoji: '💬', title: 'Conversation libre', difficulty: 'B1', desc: 'Discuter librement', free: false },
];

// ── Composant principal ──────────────────────────────────────
export default function LearnScreen() {
  const [activeTab, setActiveTab] = useState<LearnTab>('modules');
  const { isPremium } = usePremiumGate();

  const TABS: Array<{ id: LearnTab; label: string; emoji: string }> = [
    { id: 'modules', label: 'Leçons', emoji: '📚' },
    { id: 'dialogues', label: 'Dialogues', emoji: '💬' },
    { id: 'dictees', label: 'Dictées', emoji: '🎤' },
    { id: 'conversation', label: 'IA', emoji: '🤖' },
  ];

  return (
    <SafeAreaView style={s.safe}>
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

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={s.tabEmoji}>{tab.emoji}</Text>
            <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu selon l'onglet */}
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── MODULES ── */}
        {activeTab === 'modules' && (
          <View style={s.content}>
            {/* Progression globale */}
            <View style={s.progressCard}>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>Progression globale</Text>
                <Text style={s.progressPct}>0%</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: '0%' }]} />
              </View>
              <Text style={s.progressSub}>0 / 50 leçons terminées</Text>
            </View>

            {MODULES.map((mod, index) => (
              <TouchableOpacity
                key={mod.id}
                style={s.moduleCard}
                onPress={() => {
                  if (!mod.free && !isPremium) {
                    router.push('/paywall?reason=lesson');
                  } else {
                    router.push(`/lesson/${mod.id}_lesson_1`);
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
                  <Text style={s.moduleMeta}>{mod.lessons} leçons</Text>
                  <View style={s.moduleProgress}>
                    <View style={[s.moduleProgressFill, {
                      width: `${mod.progress}%`,
                      backgroundColor: mod.color,
                    }]} />
                  </View>
                </View>
                {!mod.free && !isPremium
                  ? <Text style={s.lockIcon}>🔒</Text>
                  : <Text style={s.arrowIcon}>›</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── DIALOGUES ── */}
        {activeTab === 'dialogues' && (
          <View style={s.content}>
            <View style={s.sectionBanner}>
              <Text style={s.sectionBannerEmoji}>💬</Text>
              <View>
                <Text style={s.sectionBannerTitle}>Dialogues authentiques</Text>
                <Text style={s.sectionBannerDesc}>
                  Écoutez et apprenez avec des conversations réelles
                </Text>
              </View>
            </View>
            {DIALOGUES.map((dlg) => (
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
                  <View style={s.contentMeta}>
                    <DiffBadge level={dlg.difficulty as any} />
                    <Text style={s.contentMetaTxt}>⏱ {dlg.duration}</Text>
                  </View>
                </View>
                {!dlg.free && !isPremium
                  ? <Text style={s.lockIcon}>🔒</Text>
                  : <Text style={s.arrowIcon}>›</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── DICTÉES ── */}
        {activeTab === 'dictees' && (
          <View style={s.content}>
            <View style={s.sectionBanner}>
              <Text style={s.sectionBannerEmoji}>🎤</Text>
              <View>
                <Text style={s.sectionBannerTitle}>Entraînement à l'écoute</Text>
                <Text style={s.sectionBannerDesc}>
                  Écoutez et écrivez pour ancrer la prononciation
                </Text>
              </View>
            </View>
            {DICTEES.map((dict) => (
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
                  <View style={s.contentMeta}>
                    <DiffBadge level={dict.difficulty as any} />
                    <Text style={s.contentMetaTxt}>📝 {dict.sentences} phrases</Text>
                  </View>
                </View>
                {!dict.free && !isPremium
                  ? <Text style={s.lockIcon}>🔒</Text>
                  : <Text style={s.arrowIcon}>›</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── CONVERSATION IA ── */}
        {activeTab === 'conversation' && (
          <View style={s.content}>
            {!isPremium && (
              <View style={s.premiumBanner}>
                <Text style={s.premiumBannerEmoji}>🤖</Text>
                <View style={s.premiumBannerBody}>
                  <Text style={s.premiumBannerTitle}>Conversation IA — Premium</Text>
                  <Text style={s.premiumBannerDesc}>
                    Pratiquez le polonais en situation réelle avec notre IA
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.premiumBannerBtn}
                  onPress={() => router.push('/paywall?reason=default')}
                >
                  <Text style={s.premiumBannerBtnTxt}>Essayer</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.sectionBanner}>
              <Text style={s.sectionBannerEmoji}>🎭</Text>
              <View>
                <Text style={s.sectionBannerTitle}>Mises en situation</Text>
                <Text style={s.sectionBannerDesc}>
                  L'IA joue un rôle et vous répond en polonais
                </Text>
              </View>
            </View>

            {CONVERSATION_SCENARIOS.map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                style={s.contentCard}
                onPress={() => {
                  if (!isPremium) {
                    router.push('/paywall?reason=default');
                  } else {
                    router.push('/conversation');
                  }
                }}
              >
                <View style={s.contentCardLeft}>
                  <Text style={s.contentEmoji}>{scenario.emoji}</Text>
                </View>
                <View style={s.contentCardBody}>
                  <Text style={s.contentTitle}>{scenario.title}</Text>
                  <View style={s.contentMeta}>
                    <DiffBadge level={scenario.difficulty as any} />
                    <Text style={s.contentMetaTxt}>{scenario.desc}</Text>
                  </View>
                </View>
                {!isPremium
                  ? <Text style={s.lockIcon}>🔒</Text>
                  : <Text style={s.arrowIcon}>›</Text>
                }
              </TouchableOpacity>
            ))}

            {/* Fonctionnalités IA */}
            <View style={s.aiFeaturesCard}>
              <Text style={s.aiFeaturesTitle}>🤖 Ce que fait notre IA</Text>
              {[
                { emoji: '✅', text: 'Corrige vos erreurs grammaticales' },
                { emoji: '🇫🇷', text: 'Traduit ses réponses en français' },
                { emoji: '🎯', text: 'Adapte le niveau à votre progression' },
                { emoji: '💡', text: 'Suggère des formules naturelles' },
              ].map((f) => (
                <View key={f.text} style={s.aiFeatureRow}>
                  <Text style={s.aiFeatureEmoji}>{f.emoji}</Text>
                  <Text style={s.aiFeatureTxt}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Badge de difficulté ───────────────────────────────────────
function DiffBadge({ level }: { level: 'A1' | 'A2' | 'B1' | 'B2' }) {
  const colors: Record<string, { bg: string; text: string }> = {
    A1: { bg: COLORS.successLight, text: COLORS.success },
    A2: { bg: COLORS.warningLight, text: COLORS.warning },
    B1: { bg: COLORS.infoLight ?? '#DBEAFE', text: COLORS.info },
    B2: { bg: COLORS.errorLight, text: COLORS.error },
  };
  const c = colors[level] ?? colors.A1;
  return (
    <View style={[db2.badge, { backgroundColor: c.bg }]}>
      <Text style={[db2.txt, { color: c.text }]}>{level}</Text>
    </View>
  );
}

const db2 = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  txt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  statsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statsBtnTxt: { fontSize: 20 },

  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg, gap: 2,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.white },

  content: { paddingHorizontal: SPACING.lg, gap: 12 },

  progressCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, gap: 6, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  progressPct: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  progressTrack: {
    height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  progressSub: { fontSize: 11, color: COLORS.textMuted },

  moduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  moduleIcon: {
    width: 56, height: 56, borderRadius: BORDER_RADIUS.md,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  moduleEmoji: { fontSize: 26 },
  moduleNum: {
    position: 'absolute', bottom: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.textPrimary, alignItems: 'center', justifyContent: 'center',
  },
  moduleNumTxt: { fontSize: 9, fontWeight: '800', color: COLORS.white },
  moduleBody: { flex: 1, gap: 4 },
  moduleName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  moduleMeta: { fontSize: 12, color: COLORS.textSecondary },
  moduleProgress: {
    height: 4, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  moduleProgressFill: { height: '100%', borderRadius: BORDER_RADIUS.full },
  lockIcon: { fontSize: 18, opacity: 0.5 },
  arrowIcon: { fontSize: 22, color: COLORS.textMuted },

  sectionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionBannerEmoji: { fontSize: 32 },
  sectionBannerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  sectionBannerDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  contentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  contentCardLeft: {
    width: 48, height: 48, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  contentEmoji: { fontSize: 24 },
  contentCardBody: { flex: 1, gap: 6 },
  contentTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  contentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contentMetaTxt: { fontSize: 11, color: COLORS.textMuted },

  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.textPrimary, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, marginBottom: 4,
  },
  premiumBannerEmoji: { fontSize: 28 },
  premiumBannerBody: { flex: 1 },
  premiumBannerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  premiumBannerDesc: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  premiumBannerBtn: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  premiumBannerBtnTxt: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  aiFeaturesCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, gap: 12, marginTop: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  aiFeaturesTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  aiFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiFeatureEmoji: { fontSize: 18, width: 28, textAlign: 'center' },
  aiFeatureTxt: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
});
