// ============================================================
// src/services/ads/adService.ts
// Publicités AdMob — rewarded + interstitiel modéré
// ============================================================

import {
  RewardedAd,
  InterstitialAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── IDs AdMob ────────────────────────────────────────────────
const AD_UNIT_IDS = {
  REWARDED: __DEV__
    ? TestIds.REWARDED
    : 'ca-app-pub-VOTRE_ID/VOTRE_REWARDED_ID',
  INTERSTITIAL: __DEV__
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-VOTRE_ID/VOTRE_INTERSTITIAL_ID',
};

// ── Clés de stockage ─────────────────────────────────────────
const STORAGE_KEYS = {
  LAST_INTERSTITIAL: 'last_interstitial_ts',
  DAILY_AD_COUNT: 'daily_ad_count',
  DAILY_AD_DATE: 'daily_ad_date',
};

// ── Limites de fréquence ─────────────────────────────────────
const AD_LIMITS = {
  INTERSTITIAL_MIN_INTERVAL_MS: 10 * 60 * 1000, // 10 minutes
  MAX_INTERSTITIAL_PER_DAY: 5,
  MAX_REWARDED_PER_DAY: 10,
};

// ── Singleton des instances d'annonces ───────────────────────
let rewardedAd: RewardedAd | null = null;
let interstitialAd: InterstitialAd | null = null;
let isRewardedLoaded = false;
let isInterstitialLoaded = false;

// ── Précharger la publicité avec récompense ──────────────────
export function preloadRewardedAd(): void {
  try {
    rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedLoaded = true;
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      // Callback géré par showRewardedAd
    });

    rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
      isRewardedLoaded = false;
      // Réessayer dans 30s
      setTimeout(preloadRewardedAd, 30_000);
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      isRewardedLoaded = false;
      // Précharger la suivante
      setTimeout(preloadRewardedAd, 1000);
    });

    rewardedAd.load();
  } catch (e) {
    console.error('Erreur préchargement rewarded:', e);
  }
}

// ── Précharger l'interstitiel ────────────────────────────────
export function preloadInterstitialAd(): void {
  try {
    interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      isInterstitialLoaded = false;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      setTimeout(preloadInterstitialAd, 1000);
    });

    interstitialAd.load();
  } catch (e) {
    console.error('Erreur préchargement interstitiel:', e);
  }
}

// ── Afficher la pub avec récompense ──────────────────────────
export async function showRewardedAd(): Promise<{
  shown: boolean;
  rewarded: boolean;
  error?: string;
}> {
  if (!rewardedAd || !isRewardedLoaded) {
    preloadRewardedAd();
    return { shown: false, rewarded: false, error: 'Publicité en cours de chargement...' };
  }

  return new Promise((resolve) => {
    let wasRewarded = false;

    const rewardListener = rewardedAd!.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => { wasRewarded = true; }
    );

    const closeListener = rewardedAd!.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        rewardListener();
        closeListener();
        resolve({ shown: true, rewarded: wasRewarded });
      }
    );

    const errorListener = rewardedAd!.addAdEventListener(
      AdEventType.ERROR,
      () => {
        errorListener();
        resolve({ shown: false, rewarded: false, error: 'Erreur lors de l\'affichage.' });
      }
    );

    try {
      rewardedAd!.show();
    } catch (e) {
      resolve({ shown: false, rewarded: false, error: 'Impossible d\'afficher la publicité.' });
    }
  });
}

// ── Afficher l'interstitiel (avec vérification de fréquence) ─
export async function showInterstitialAd(isPremium: boolean): Promise<boolean> {
  // Ne jamais afficher aux utilisateurs Premium
  if (isPremium) return false;

  // Vérifier l'intervalle minimum
  const canShow = await canShowInterstitial();
  if (!canShow) return false;

  if (!interstitialAd || !isInterstitialLoaded) {
    preloadInterstitialAd();
    return false;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_INTERSTITIAL, Date.now().toString());
    await incrementDailyAdCount();
    interstitialAd.show();
    return true;
  } catch (e) {
    return false;
  }
}

// ── Vérifier si on peut afficher un interstitiel ─────────────
async function canShowInterstitial(): Promise<boolean> {
  try {
    // Vérifier l'intervalle de temps
    const lastTs = await AsyncStorage.getItem(STORAGE_KEYS.LAST_INTERSTITIAL);
    if (lastTs) {
      const elapsed = Date.now() - parseInt(lastTs);
      if (elapsed < AD_LIMITS.INTERSTITIAL_MIN_INTERVAL_MS) return false;
    }

    // Vérifier le quota quotidien
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_AD_DATE);
    const storedCount = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_AD_COUNT);

    if (storedDate !== today) {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_AD_DATE, today);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_AD_COUNT, '0');
      return true;
    }

    const count = parseInt(storedCount ?? '0');
    return count < AD_LIMITS.MAX_INTERSTITIAL_PER_DAY;
  } catch {
    return false;
  }
}

async function incrementDailyAdCount(): Promise<void> {
  const count = parseInt(
    (await AsyncStorage.getItem(STORAGE_KEYS.DAILY_AD_COUNT)) ?? '0'
  );
  await AsyncStorage.setItem(STORAGE_KEYS.DAILY_AD_COUNT, String(count + 1));
}

// ── Initialiser toutes les pubs au démarrage ─────────────────
export function initAds(isPremium: boolean): void {
  if (isPremium) return; // Pas de pubs pour les Premium
  preloadRewardedAd();
  preloadInterstitialAd();
}
