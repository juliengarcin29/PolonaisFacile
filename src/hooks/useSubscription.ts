// ============================================================
// src/hooks/useSubscription.ts
// Hook abonnement — état premium, achats, restauration
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  initRevenueCat,
  getAvailablePackages,
  purchasePackage,
  restorePurchases,
  getCurrentPremiumStatus,
  listenToPurchaseUpdates,
  PackageInfo,
} from '@/services/revenue/subscriptionService';
import { useUserStore } from '@/store/userStore';
import { auth } from '@/services/firebase/config';

type PurchaseStatus = 'idle' | 'loading' | 'success' | 'error';

export function useSubscription() {
  const { user, updateUser } = useUserStore();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ── Initialisation RevenueCat ────────────────────────────
  useEffect(() => {
    const uid = auth.currentUser?.uid;

    initRevenueCat(uid).then(() => {
      setIsInitialized(true);
    });

    // Écouter les changements de statut (webhooks RevenueCat)
    const unsubscribe = listenToPurchaseUpdates((isPremium) => {
      updateUser({ premium: isPremium });
    });

    return unsubscribe;
  }, []);

  // ── Charger les packages disponibles ────────────────────
  const loadPackages = useCallback(async () => {
    if (!isInitialized) return;
    setIsLoadingPackages(true);
    try {
      const pkgs = await getAvailablePackages();
      setPackages(pkgs);
    } catch (e) {
      console.error('Erreur chargement packages:', e);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized) loadPackages();
  }, [isInitialized]);

  // ── Acheter un package ───────────────────────────────────
  const purchase = useCallback(async (pkg: PackageInfo) => {
    setPurchaseStatus('loading');
    setError(null);

    const result = await purchasePackage(pkg.pkg);

    if (result.success) {
      setPurchaseStatus('success');
      updateUser({ premium: true });
    } else {
      setPurchaseStatus('error');
      setError(result.error ?? 'Erreur inconnue');
    }

    // Reset après 3s
    setTimeout(() => setPurchaseStatus('idle'), 3000);
    return result;
  }, []);

  // ── Restaurer les achats ─────────────────────────────────
  const restore = useCallback(async () => {
    setPurchaseStatus('loading');
    setError(null);

    const result = await restorePurchases();

    if (result.success && result.isPremium) {
      setPurchaseStatus('success');
      updateUser({ premium: true });
    } else if (result.success && !result.isPremium) {
      setError('Aucun achat actif à restaurer.');
      setPurchaseStatus('idle');
    } else {
      setPurchaseStatus('error');
      setError(result.error ?? 'Erreur lors de la restauration.');
    }

    setTimeout(() => setPurchaseStatus('idle'), 3000);
    return result;
  }, []);

  // ── Vérifier le statut premium en temps réel ─────────────
  const refreshPremiumStatus = useCallback(async () => {
    const isPremium = await getCurrentPremiumStatus();
    updateUser({ premium: isPremium });
    return isPremium;
  }, []);

  return {
    isPremium: user?.premium ?? false,
    packages,
    purchaseStatus,
    error,
    isLoadingPackages,
    isInitialized,
    purchase,
    restore,
    refreshPremiumStatus,
    loadPackages,
    isPurchasing: purchaseStatus === 'loading',
    isPurchaseSuccess: purchaseStatus === 'success',
  };
}
