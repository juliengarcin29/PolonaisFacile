// ============================================================
// app/(tabs)/review.tsx — Onglet Réviser (SRS)
// ============================================================
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

const SAMPLE_CARDS = [
  { pl: 'Dziękuję', phonetic: '[dʑɛŋkujɛ]', fr: 'Merci', emoji: '✅', color: COLORS.success },
  { pl: 'Przepraszam', phonetic: '[pʂɛˈpraʂam]', fr: 'Pardon / Excusez-moi', emoji: '🔄', color: COLORS.warning },
  { pl: 'Dobry wieczór', phonetic: '[ˈdɔbrɨ ˈvjɛtʂur]', fr: 'Bonsoir', emoji: '✅', color: COLORS.success },
  { pl: 'Proszę', phonetic: '[ˈprɔʂɛ]', fr: 'S\'il vous plaît / Voici', emoji: '⚠️', color: COLORS.error },
];

export default function ReviewScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Réviser</Text>
          <Text style={s.subtitle}>Répétition espacée intelligente (SM-2)</Text>
        </View>
        <View style={s.dueCard}>
          <Text style={s.dueEmoji}>🧠</Text>
          <Text style={s.dueCount}>12</Text>
          <Text style={s.dueLabel}>cartes à réviser aujourd'hui</Text>
          <TouchableOpacity style={s.startBtn}>
            <Text style={s.startBtnText}>Commencer la révision →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.statsRow}>
          {[
            { label: 'Apprises', value: '48', emoji: '✅', color: COLORS.success },
            { label: 'En cours', value: '23', emoji: '🔄', color: COLORS.warning },
            { label: 'À revoir', value: '12', emoji: '⚠️', color: COLORS.error },
          ].map((stat) => (
            <View key={stat.label} style={[s.statBox, { borderTopColor: stat.color }]}>
              <Text style={s.statEmoji}>{stat.emoji}</Text>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        <Text style={s.sectionTitle}>📋 Flashcards récentes</Text>
        {SAMPLE_CARDS.map((card) => (
          <View key={card.pl} style={s.flashRow}>
            <View style={s.flashLeft}>
              <Text style={s.flashPl}>{card.pl}</Text>
              <Text style={s.flashPhonetic}>{card.phonetic}</Text>
            </View>
            <Text style={s.flashFr}>{card.fr}</Text>
            <View style={[s.flashStatus, { backgroundColor: card.color + '22' }]}>
              <Text style={{ fontSize: 14 }}>{card.emoji}</Text>
            </View>
          </View>
        ))}
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
