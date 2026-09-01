// ============================================================
// src/hooks/usePremiumGate.ts
// Hook de vérification Premium — contenu verrouillé
// ============================================================
// ✅ CORRECT (Imports direct de fichier à fichier)
import { useUserStore } from '@/store/userStore';
import { CONTENT_LIMITS } from '@/constants';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { router } from 'expo-router';
import { useCallback } from 'react';

type GateContext = 'lesson' | 'flashcard' | 'dictation' | 'offline' | 'quiz' | 'default';

export function usePremiumGate() {
  const { user } = useUserStore();

  // Le statut Premium est effectif si l'utilisateur est abonné
  // OU si la phase "Tout Gratuit" est activée.
  const isPremium = (user?.premium ?? false) || FEATURE_FLAGS.FREE_ALL_LESSONS;

  // ── Vérifier et rediriger vers le paywall si besoin ──────
  const requirePremium = useCallback((
    context: GateContext = 'default',
    onAllowed?: () => void,
  ): boolean => {
    if (isPremium) {
      onAllowed?.();
      return true;
    }
    router.push(`/paywall?reason=${context}`);
    return false;
  }, [isPremium]);

  // ── Vérifier si une leçon est accessible ─────────────────
  const canAccessLesson = useCallback((
    lessonIndex: number,
    isPremiumLesson: boolean,
  ): boolean => {
    if (isPremium) return true;
    if (!isPremiumLesson) return true;
    // Les 10 premières leçons sont gratuites
    return lessonIndex < CONTENT_LIMITS.FREE_LESSONS;
  }, [isPremium]);

  // ── Vérifier si les flashcards sont accessibles ──────────
  const canAccessFlashcards = useCallback((
    cardIndex: number,
    isPremiumCard: boolean,
  ): boolean => {
    if (isPremium) return true;
    if (!isPremiumCard) return true;
    return cardIndex < CONTENT_LIMITS.FREE_FLASHCARDS;
  }, [isPremium]);

  // ── Vérifier si un module est accessible ─────────────────
  const canAccessModule = useCallback((moduleIndex: number): boolean => {
    if (isPremium) return true;
    return moduleIndex < CONTENT_LIMITS.FREE_MODULES;
  }, [isPremium]);

  return {
    isPremium,
    requirePremium,
    canAccessLesson,
    canAccessFlashcards,
    canAccessModule,
  };
}

// ============================================================
// src/components/ui/PremiumGate.tsx
// Composant qui verrouille visuellement le contenu Premium
// ============================================================

import { BORDER_RADIUS, COLORS, SPACING } from '@/constants';
//import { usePremiumGate } from '@/hooks/usePremiumGate';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface PremiumGateProps {
  children: React.ReactNode;
  context?: GateContext;
  fallbackLabel?: string;
  showBlur?: boolean;
}

export function PremiumGate({
  children,
  context = 'default',
  fallbackLabel = 'Contenu Premium',
  showBlur = true,
}: PremiumGateProps) {
  const { isPremium } = usePremiumGate();

  if (isPremium) return <React.Fragment>{children}</React.Fragment>;

  return (
    <View style={pg.container}>
      {/* Contenu flouté en arrière-plan */}
      {showBlur && (
        <View style={pg.blurWrap} pointerEvents="none">
          <View style={pg.blur}>{children}</View>
          <View style={pg.overlay} />
        </View>
      )}

      {/* Badge de verrouillage */}
      <View style={pg.lockCard}>
        <Text style={pg.lockEmoji}>🔒</Text>
        <Text style={pg.lockTitle}>{fallbackLabel}</Text>
        <Text style={pg.lockDesc}>
          Débloquez ce contenu avec Premium
        </Text>
        <TouchableOpacity
          style={pg.unlockBtn}
          onPress={() => router.push(`/paywall?reason=${context}`)}
        >
          <Text style={pg.unlockBtnTxt}>⭐ Débloquer Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pg = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', borderRadius: BORDER_RADIUS.xl },
  blurWrap: { position: 'absolute', inset: 0 },
  blur: { opacity: 0.15 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  lockCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm,
    margin: SPACING.lg,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  lockEmoji: { fontSize: 40 },
  lockTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  lockDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  unlockBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 13, paddingHorizontal: SPACING.xl, marginTop: 4,
  },
  unlockBtnTxt: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
});
