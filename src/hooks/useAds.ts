// ============================================================
// src/hooks/useAds.ts
// Hook publicités — rewarded ads avec récompenses
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import {
  showRewardedAd,
  showInterstitialAd,
  initAds,
} from '@/services/ads/adService';
import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';

type AdStatus = 'idle' | 'loading' | 'showing' | 'rewarded' | 'skipped' | 'error';

export interface RewardConfig {
  xpBonus: number;          // XP supplémentaires
  flashcardsBonus?: number; // Flashcards supplémentaires
  heartsBonus?: number;     // Cœurs récupérés
  label: string;            // Texte affiché à l'utilisateur
}

export function useAds() {
  const { user } = useUserStore();
  const { awardXP } = useGamification();
  const [adStatus, setAdStatus] = useState<AdStatus>('idle');
  const [lastReward, setLastReward] = useState<RewardConfig | null>(null);

  const isPremium = user?.premium ?? false;

  // Initialiser les pubs au montage
  useEffect(() => {
    initAds(isPremium);
  }, [isPremium]);

  // ── Afficher une pub avec récompense ─────────────────────
  const showRewarded = useCallback(async (reward: RewardConfig): Promise<{
    rewarded: boolean;
    error?: string;
  }> => {
    if (isPremium) return { rewarded: false, error: 'Premium actif' };

    setAdStatus('loading');

    const result = await showRewardedAd();

    if (!result.shown) {
      setAdStatus('error');
      setTimeout(() => setAdStatus('idle'), 2000);
      return { rewarded: false, error: result.error };
    }

    if (result.rewarded) {
      setAdStatus('rewarded');
      setLastReward(reward);

      // Appliquer les récompenses
      if (reward.xpBonus > 0) {
        await awardXP(reward.xpBonus, `🎁 ${reward.label}`);
      }

      if (reward.heartsBonus && reward.heartsBonus > 0) {
        const { user, updateUser } = useUserStore.getState();
        if (user) {
          updateUser({
            hearts: Math.min(user.maxHearts, user.hearts + reward.heartsBonus),
          });
        }
      }

      setTimeout(() => {
        setAdStatus('idle');
        setLastReward(null);
      }, 3000);
      return { rewarded: true };
    } else {
      setAdStatus('skipped');
      setTimeout(() => setAdStatus('idle'), 1500);
      return { rewarded: false };
    }
  }, [isPremium, awardXP]);

  // ── Afficher un interstitiel (après une leçon) ────────────
  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (isPremium) return false;
    return showInterstitialAd(isPremium);
  }, [isPremium]);

  return {
    adStatus,
    lastReward,
    showRewarded,
    showInterstitial,
    isPremium,
    isAdLoading: adStatus === 'loading',
    isAdShowing: adStatus === 'showing',
    wasRewarded: adStatus === 'rewarded',
  };
}

// ============================================================
// src/components/ui/RewardedAdButton.tsx
// Bouton "Regarder une pub pour obtenir une récompense"
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import { useAds, RewardConfig } from '@/hooks/useAds';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

interface RewardedAdButtonProps {
  reward: RewardConfig;
  onRewarded?: () => void;
  onSkipped?: () => void;
  disabled?: boolean;
  style?: object;
}

export function RewardedAdButton({
  reward, onRewarded, onSkipped, disabled = false, style,
}: RewardedAdButtonProps) {
  const { showRewarded, adStatus, isPremium } = useAds();
  const [showRewardAnim, setShowRewardAnim] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Ne rien afficher pour les utilisateurs Premium
  if (isPremium) return null;

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const result = await showRewarded(reward);

    if (result.rewarded) {
      setShowRewardAnim(true);
      onRewarded?.();
      setTimeout(() => setShowRewardAnim(false), 2500);
    } else {
      onSkipped?.();
    }
  };

  const isLoading = adStatus === 'loading';

  return (
    <View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[rb.btn, disabled && rb.btnDisabled, style]}
          onPress={handlePress}
          disabled={disabled || isLoading}
          activeOpacity={0.8}
        >
          <View style={rb.iconWrap}>
            {isLoading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={rb.icon}>📺</Text>
            }
          </View>
          <View style={rb.textWrap}>
            <Text style={rb.label}>{reward.label}</Text>
            <Text style={rb.sub}>
              {isLoading ? 'Chargement...' : 'Regarder une courte publicité'}
            </Text>
          </View>
          <View style={rb.rewardBadge}>
            <Text style={rb.rewardTxt}>+{reward.xpBonus} XP</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Animation de récompense */}
      {showRewardAnim && (
        <View style={rb.rewardAnim}>
          <Text style={rb.rewardAnimEmoji}>🎁</Text>
          <Text style={rb.rewardAnimTxt}>+{reward.xpBonus} XP gagnés !</Text>
        </View>
      )}
    </View>
  );
}

const rb = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#2D2D4E',
  },
  btnDisabled: { opacity: 0.5 },
  iconWrap: {
    width: 44, height: 44, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  textWrap: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  rewardBadge: {
    backgroundColor: COLORS.xpGold + '25',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.xpGold + '50',
  },
  rewardTxt: { fontSize: 13, fontWeight: '900', color: COLORS.xpGold },
  rewardAnim: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 8,
    backgroundColor: COLORS.successLight, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  rewardAnimEmoji: { fontSize: 18 },
  rewardAnimTxt: { fontSize: 14, fontWeight: '800', color: COLORS.success },
});
