// ============================================================
// app/paywall.tsx
// Écran Paywall — ancrage de prix, essai gratuit, upsell
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { PackageInfo } from '@/services/revenue/subscriptionService';
import { COLORS, SPACING, BORDER_RADIUS, SUBSCRIPTION } from '@/constants';

// ── Contenu pédagogique verrouillé (raison d'affichage) ──────
const UPSELL_REASONS: Record<string, { emoji: string; title: string; desc: string }> = {
  lesson: {
    emoji: '📚',
    title: 'Cette leçon est Premium',
    desc: 'Débloquez les 50+ leçons avancées avec grammaire, conjugaison et aspects verbaux.',
  },
  flashcard: {
    emoji: '🃏',
    title: 'Flashcards illimitées',
    desc: 'Accédez aux 500+ flashcards avec prononciation audio et répétition espacée avancée.',
  },
  dictation: {
    emoji: '🎤',
    title: 'Mode Dictée Premium',
    desc: 'Entraînez votre oreille avec 20 dictées polonaises authentiques.',
  },
  offline: {
    emoji: '📵',
    title: 'Mode Hors Ligne',
    desc: 'Téléchargez tout le contenu pour apprendre sans connexion internet.',
  },
  default: {
    emoji: '⭐',
    title: 'Passez à Premium',
    desc: 'Accédez à tout le contenu pour apprendre le polonais rapidement.',
  },
};

const FEATURES = [
  { emoji: '♾️', text: 'Accès illimité à tout le contenu' },
  { emoji: '📵', text: 'Mode hors ligne complet' },
  { emoji: '🚫', text: 'Zéro publicité' },
  { emoji: '🎤', text: '20 dictées et 20 dialogues réels' },
  { emoji: '🤖', text: 'IA conversationnelle polonaise' },
  { emoji: '📊', text: 'Statistiques avancées' },
  { emoji: '🔊', text: 'Tous les audios natifs' },
];

export default function PaywallScreen() {
  const { reason = 'default' } = useLocalSearchParams<{ reason?: string }>();
  const {
    packages, purchase, restore,
    isLoadingPackages, isPurchasing, isPurchaseSuccess, error,
  } = useSubscription();

  const [selectedPkg, setSelectedPkg] = useState<PackageInfo | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  const upsell = UPSELL_REASONS[reason] ?? UPSELL_REASONS.default;

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // Sélectionner automatiquement le package annuel (mis en avant)
  useEffect(() => {
    if (packages.length > 0 && !selectedPkg) {
      const yearly = packages.find(p => p.isPopular);
      setSelectedPkg(yearly ?? packages[0]);
    }
  }, [packages]);

  // Animation de succès
  useEffect(() => {
    if (isPurchaseSuccess) {
      setShowSuccess(true);
      Animated.spring(successScale, {
        toValue: 1, friction: 4, tension: 80, useNativeDriver: true,
      }).start();
      setTimeout(() => router.replace('/(tabs)'), 2000);
    }
  }, [isPurchaseSuccess]);

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    await purchase(selectedPkg);
  };

  const handleRestore = async () => {
    const result = await restore();
    if (result.success && result.isPremium) {
      Alert.alert('✅ Achat restauré', 'Votre abonnement Premium est actif !');
      router.back();
    } else {
      Alert.alert('ℹ️ Aucun achat', 'Aucun abonnement actif trouvé sur ce compte.');
    }
  };

  // ── Écran de succès ──────────────────────────────────────
  if (showSuccess) {
    return (
      <SafeAreaView style={s.successSafe}>
        <Animated.View style={[s.successBox, { transform: [{ scale: successScale }] }]}>
          <Text style={s.successEmoji}>🎉</Text>
          <Text style={s.successTitle}>Bienvenue Premium !</Text>
          <Text style={s.successSub}>Tout le contenu est maintenant débloqué.</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Bouton fermer */}
      <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
        <Text style={s.closeTxt}>✕</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Hero contextuel ── */}
          <View style={s.hero}>
            <Text style={s.heroEmoji}>{upsell.emoji}</Text>
            <Text style={s.heroTitle}>{upsell.title}</Text>
            <Text style={s.heroDesc}>{upsell.desc}</Text>
          </View>

          {/* ── Packages de prix ── */}
          <View style={s.packagesWrap}>
            {isLoadingPackages ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={s.loadingTxt}>Chargement des offres...</Text>
              </View>
            ) : packages.length > 0 ? (
              packages
                .sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
                .map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isSelected={selectedPkg?.id === pkg.id}
                    onSelect={() => setSelectedPkg(pkg)}
                  />
                ))
            ) : (
              // Fallback si RevenueCat n'est pas configuré
              <FallbackPricing onSelect={setSelectedPkg} selectedId={selectedPkg?.id} />
            )}
          </View>

          {/* ── Bouton d'achat principal ── */}
          <View style={s.ctaWrap}>
            <TouchableOpacity
              style={[s.ctaBtn, isPurchasing && s.ctaBtnDisabled]}
              onPress={handlePurchase}
              disabled={isPurchasing || !selectedPkg}
            >
              {isPurchasing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={s.ctaBtnTxt}>
                    {selectedPkg?.id?.includes('yearly')
                      ? '🎯 Essayer 7 jours gratuits'
                      : '→ Commencer maintenant'}
                  </Text>
                  {selectedPkg?.id?.includes('yearly') && (
                    <Text style={s.ctaBtnSub}>
                      Puis {selectedPkg?.price} / an — annulable à tout moment
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>

            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorTxt}>⚠️ {error}</Text>
              </View>
            )}
          </View>

          {/* ── Fonctionnalités incluses ── */}
          <Text style={s.featuresTitle}>Tout ce qui est inclus</Text>
          <View style={s.featuresList}>
            {FEATURES.map((f) => (
              <View key={f.text} style={s.featureRow}>
                <Text style={s.featureEmoji}>{f.emoji}</Text>
                <Text style={s.featureTxt}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* ── Témoignages ── */}
          <View style={s.testimonialsWrap}>
            {TESTIMONIALS.map((t) => (
              <View key={t.name} style={s.testimonialCard}>
                <Text style={s.testimonialStars}>⭐⭐⭐⭐⭐</Text>
                <Text style={s.testimonialText}>"{t.text}"</Text>
                <Text style={s.testimonialName}>— {t.name}</Text>
              </View>
            ))}
          </View>

          {/* ── Actions secondaires ── */}
          <View style={s.secondaryActions}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={s.restoreTxt}>Restaurer mes achats</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.skipTxt}>Non merci, continuer gratuitement</Text>
            </TouchableOpacity>
          </View>

          {/* ── Mentions légales ── */}
          <Text style={s.legal}>
            L'abonnement se renouvelle automatiquement sauf résiliation au moins 24h avant la fin de la période. Gérez vos abonnements dans les paramètres de votre compte store.
          </Text>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Carte de package ─────────────────────────────────────────
function PackageCard({
  pkg, isSelected, onSelect,
}: {
  pkg: PackageInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[pc.card, isSelected && pc.cardSelected, pkg.isPopular && pc.cardPopular]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {/* Badge populaire */}
      {pkg.isPopular && (
        <View style={pc.popularBadge}>
          <Text style={pc.popularBadgeTxt}>⭐ MEILLEURE OFFRE</Text>
        </View>
      )}

      <View style={pc.row}>
        {/* Radio */}
        <View style={[pc.radio, isSelected && pc.radioSelected]}>
          {isSelected && <View style={pc.radioDot} />}
        </View>

        {/* Infos */}
        <View style={pc.info}>
          <Text style={[pc.period, pkg.isPopular && pc.periodPopular]}>
            {pkg.id.includes('monthly') ? 'Mensuel' :
             pkg.id.includes('yearly') ? 'Annuel' : 'À vie'}
          </Text>
          {pkg.id.includes('yearly') && (
            <Text style={pc.subInfo}>soit ~2,50 € / mois</Text>
          )}
          {pkg.id.includes('lifetime') && (
            <Text style={pc.subInfo}>Paiement unique, à vie</Text>
          )}
        </View>

        {/* Prix */}
        <View style={pc.priceWrap}>
          <Text style={[pc.price, pkg.isPopular && pc.pricePopular]}>{pkg.price}</Text>
          {pkg.savings && <Text style={pc.savings}>{pkg.savings}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Fallback si RevenueCat non configuré ─────────────────────
function FallbackPricing({
  onSelect, selectedId,
}: {
  onSelect: (pkg: any) => void;
  selectedId?: string;
}) {
  const MOCK_PACKAGES = [
    { id: 'premium_yearly', price: '29,99 €', period: 'par an', savings: 'Économisez 50%', isPopular: true },
    { id: 'premium_monthly', price: '4,99 €', period: 'par mois', isPopular: false },
    { id: 'premium_lifetime', price: '79,99 €', period: 'paiement unique', isPopular: false },
  ];

  return (
    <View style={{ gap: 12 }}>
      {MOCK_PACKAGES.map((pkg) => (
        <TouchableOpacity
          key={pkg.id}
          style={[pc.card, selectedId === pkg.id && pc.cardSelected, pkg.isPopular && pc.cardPopular]}
          onPress={() => onSelect(pkg)}
        >
          {pkg.isPopular && (
            <View style={pc.popularBadge}>
              <Text style={pc.popularBadgeTxt}>⭐ MEILLEURE OFFRE</Text>
            </View>
          )}
          <View style={pc.row}>
            <View style={[pc.radio, selectedId === pkg.id && pc.radioSelected]}>
              {selectedId === pkg.id && <View style={pc.radioDot} />}
            </View>
            <View style={pc.info}>
              <Text style={[pc.period, pkg.isPopular && pc.periodPopular]}>
                {pkg.id.includes('monthly') ? 'Mensuel' :
                 pkg.id.includes('yearly') ? 'Annuel' : 'À vie'}
              </Text>
              <Text style={pc.subInfo}>{pkg.period}</Text>
            </View>
            <View style={pc.priceWrap}>
              <Text style={[pc.price, pkg.isPopular && pc.pricePopular]}>{pkg.price}</Text>
              {pkg.savings && <Text style={pc.savings}>{pkg.savings}</Text>}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Témoignages ──────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Marie L.', text: 'En 3 mois, je parle avec ma belle-famille polonaise. Incroyable !' },
  { name: 'Thomas B.', text: 'La meilleure app pour apprendre le polonais. Les aspects verbaux enfin expliqués clairement.' },
];

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  successSafe: {
    flex: 1, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  successBox: { alignItems: 'center', gap: SPACING.md },
  successEmoji: { fontSize: 80 },
  successTitle: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  successSub: { fontSize: 16, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  closeBtn: {
    position: 'absolute', top: 56, right: SPACING.lg, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },

  hero: {
    backgroundColor: COLORS.primary, padding: SPACING.xl,
    paddingTop: 64, alignItems: 'center', gap: 10,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white, textAlign: 'center' },
  heroDesc: {
    fontSize: 14, color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', lineHeight: 20, maxWidth: 280,
  },

  packagesWrap: { padding: SPACING.lg, gap: 12 },
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: SPACING.xl },
  loadingTxt: { fontSize: 14, color: COLORS.textMuted },

  ctaWrap: { paddingHorizontal: SPACING.lg, gap: 10 },
  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 18, alignItems: 'center', gap: 4,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.55 },
  ctaBtnTxt: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  ctaBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  errorBox: {
    backgroundColor: COLORS.errorLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  errorTxt: { fontSize: 13, color: COLORS.error, textAlign: 'center' },

  featuresTitle: {
    fontSize: 17, fontWeight: '800', color: COLORS.textPrimary,
    marginHorizontal: SPACING.lg, marginTop: SPACING.xl, marginBottom: SPACING.md,
  },
  featuresList: { paddingHorizontal: SPACING.lg, gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  featureTxt: { fontSize: 15, color: COLORS.textPrimary, flex: 1, fontWeight: '500' },

  testimonialsWrap: { padding: SPACING.lg, gap: 12 },
  testimonialCard: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, gap: 8,
  },
  testimonialStars: { fontSize: 14 },
  testimonialText: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  testimonialName: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  secondaryActions: { alignItems: 'center', gap: SPACING.md, padding: SPACING.lg },
  restoreTxt: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  skipTxt: { fontSize: 13, color: COLORS.textMuted },

  legal: {
    fontSize: 10, color: COLORS.textMuted, textAlign: 'center',
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xxl, lineHeight: 14,
  },
});

const pc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2, borderColor: '#E5E7EB',
    padding: SPACING.md, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF5F7' },
  cardPopular: { borderColor: '#D4AF37' },
  popularBadge: {
    backgroundColor: '#FFF8DC', borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
    borderWidth: 1, borderColor: '#D4AF37',
  },
  popularBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#92400E', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  info: { flex: 1 },
  period: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  periodPopular: { color: '#92400E' },
  subInfo: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  priceWrap: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  pricePopular: { color: COLORS.primary },
  savings: {
    fontSize: 11, fontWeight: '700', color: COLORS.success,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.full,
  },
});
