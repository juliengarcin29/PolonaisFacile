// ============================================================
// app/(tabs)/premium.tsx — Onglet Premium
// ============================================================
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

const FEATURES = [
  { emoji: '♾️', title: 'Accès illimité', desc: 'Tous les modules, leçons et exercices' },
  { emoji: '📵', title: 'Hors ligne complet', desc: 'Apprenez sans connexion internet' },
  { emoji: '🚫', title: 'Sans publicités', desc: 'Expérience fluide et immersive' },
  { emoji: '🎤', title: 'Dictées & Dialogues', desc: '20 dictées et 20 dialogues réels' },
  { emoji: '🤖', title: 'IA conversationnelle', desc: 'Pratiquez avec un locuteur virtuel' },
  { emoji: '📊', title: 'Statistiques avancées', desc: 'Suivez précisément vos progrès' },
];

export default function PremiumScreen() {
  return (
    <SafeAreaView style={p.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={p.hero}>
          <Text style={p.heroEmoji}>⭐</Text>
          <Text style={p.heroTitle}>Passez à Premium</Text>
          <Text style={p.heroSub}>7 jours gratuits, puis annulable à tout moment</Text>
        </View>

        <View style={p.pricingWrap}>
          {/* Annuel mis en avant */}
          <View style={p.planFeatured}>
            <View style={p.planBadge}>
              <Text style={p.planBadgeText}>⭐ MEILLEURE OFFRE — −50 %</Text>
            </View>
            <View style={p.planRow}>
              <View>
                <Text style={p.planNameFeatured}>Annuel</Text>
                <Text style={p.planSub}>soit 2,50 €/mois</Text>
              </View>
              <Text style={p.planPriceFeatured}>29,99 €</Text>
            </View>
            <TouchableOpacity style={p.btnFeatured}>
              <Text style={p.btnFeaturedText}>Essayer 7 jours gratuits →</Text>
            </TouchableOpacity>
          </View>

          {/* Mensuel */}
          <View style={p.plan}>
            <View style={p.planRow}>
              <Text style={p.planName}>Mensuel</Text>
              <Text style={p.planPrice}>4,99 €</Text>
            </View>
            <TouchableOpacity style={p.btn}>
              <Text style={p.btnText}>Choisir Mensuel</Text>
            </TouchableOpacity>
          </View>

          {/* À vie */}
          <View style={p.plan}>
            <View style={p.planRow}>
              <View>
                <Text style={p.planName}>À vie</Text>
                <Text style={p.planSubGray}>Paiement unique</Text>
              </View>
              <Text style={p.planPrice}>79,99 €</Text>
            </View>
            <TouchableOpacity style={p.btn}>
              <Text style={p.btnText}>Accès à vie</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={p.sectionTitle}>Ce qui est inclus</Text>
        <View style={p.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={p.featureRow}>
              <View style={p.featureIcon}>
                <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              </View>
              <View style={p.featureBody}>
                <Text style={p.featureTitle}>{f.title}</Text>
                <Text style={p.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={p.legal}>
          Abonnement renouvelé automatiquement. Annulez à tout moment depuis les paramètres du store. Aucun remboursement des périodes entamées.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const p = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    backgroundColor: COLORS.primary, padding: SPACING.xl,
    alignItems: 'center', gap: 8,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  pricingWrap: { padding: SPACING.lg, gap: 12 },

  planFeatured: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: 14,
  },
  planBadge: {
    backgroundColor: '#F59E0B', borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start',
  },
  planBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 0.6 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planNameFeatured: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  planSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  planPriceFeatured: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  btnFeatured: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
  },
  btnFeaturedText: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },

  plan: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  planName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  planSubGray: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  planPrice: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  btn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 13, alignItems: 'center',
  },
  btnText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },

  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: COLORS.textPrimary,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  featureList: { paddingHorizontal: SPACING.lg, gap: 16 },
  featureRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  featureIcon: {
    width: 48, height: 48, backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  featureBody: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  featureDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  legal: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
    marginHorizontal: SPACING.xl, marginTop: SPACING.xl, lineHeight: 16,
  },
});
