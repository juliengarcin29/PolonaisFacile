// ============================================================
// src/services/revenue/subscriptionService.ts
// Monétisation complète — RevenueCat + abonnements
// ============================================================

import { auth } from '@/services/firebase/config';
import { userService } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesPackage,
} from 'react-native-purchases';



// ── Clés RevenueCat ──────────────────────────────────────────
const REVENUECAT_KEYS = {
  android: 'VOTRE_CLE_REVENUECAT_ANDROID',
  ios: 'VOTRE_CLE_REVENUECAT_IOS',
};

// ── Identifiants des produits (à configurer dans RevenueCat) ─
export const PRODUCT_IDS = {
  MONTHLY: 'premium_monthly',
  YEARLY: 'premium_yearly',
  LIFETIME: 'premium_lifetime',
} as const;

// ── Identifiant de l'entitlement ────────────────────────────
const ENTITLEMENT_ID = 'premium';

export type SubscriptionTier = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface PackageInfo {
  pkg: PurchasesPackage;
  id: string;
  price: string;
  period: string;
  savings?: string;
  isPopular?: boolean;
}

// ── Initialisation RevenueCat ─────────────────────────────────
export async function initRevenueCat(userId?: string): Promise<void> {
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_KEYS.ios
      : REVENUECAT_KEYS.android;

    await Purchases.configure({ apiKey });

    // Identifier l'utilisateur Firebase
    if (userId) {
      await Purchases.logIn(userId);
    }
  } catch (e) {
    console.error('Erreur init RevenueCat:', e);
  }
}

// ── Récupérer les packages disponibles ───────────────────────
export async function getAvailablePackages(): Promise<PackageInfo[]> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current?.availablePackages?.length) return [];

    return current.availablePackages.map((pkg) => {
      const price = pkg.product.priceString;
      const id = pkg.product.identifier;

      let period = '';
      let savings: string | undefined;
      let isPopular = false;

      if (id.includes('monthly')) {
        period = 'par mois';
      } else if (id.includes('yearly')) {
        period = 'par an';
        savings = 'Économisez 50%';
        isPopular = true;
      } else if (id.includes('lifetime')) {
        period = 'paiement unique';
      }

      return { pkg, id, price, period, savings, isPopular };
    });
  } catch (e) {
    console.error('Erreur récupération packages:', e);
    return [];
  }
}

// ── Acheter un package ───────────────────────────────────────
export async function purchasePackage(pkg: PurchasesPackage): Promise<{
  success: boolean;
  error?: string;
  customerInfo?: CustomerInfo;
}> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = checkPremiumStatus(customerInfo);

    if (isPremium) {
      await activatePremiumForUser(customerInfo);
    }

    return { success: isPremium, customerInfo };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, error: 'Achat annulé' };
    }

    const errorMessages: Record<number, string> = {
      [PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR]: 'Achats non autorisés sur cet appareil.',
      [PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR]: 'Paiement en attente de validation.',
      [PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR]: 'Vous possédez déjà ce produit.',
      [PURCHASES_ERROR_CODE.NETWORK_ERROR]: 'Erreur réseau. Vérifiez votre connexion.',
    };

    const msg = errorMessages[e.code] ?? 'Une erreur est survenue lors de l\'achat.';
    return { success: false, error: msg };
  }
}

// ── Restaurer les achats ─────────────────────────────────────
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = checkPremiumStatus(customerInfo);

    if (isPremium) {
      await activatePremiumForUser(customerInfo);
    }

    return { success: true, isPremium };
  } catch (e: any) {
    return {
      success: false,
      isPremium: false,
      error: 'Erreur lors de la restauration des achats.',
    };
  }
}

// ── Vérifier le statut Premium ───────────────────────────────
export function checkPremiumStatus(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

// ── Récupérer le statut actuel ───────────────────────────────
export async function getCurrentPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return checkPremiumStatus(customerInfo);
  } catch {
    return false;
  }
}

// ── Activer Premium dans Firebase + Store ────────────────────
async function activatePremiumForUser(customerInfo: CustomerInfo): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  const expiresAt = entitlement?.expirationDate
    ? new Date(entitlement.expirationDate)
    : null; // null = lifetime

  await userService.activatePremium(uid, expiresAt);
  useUserStore.getState().updateUser({ premium: true, premiumExpiresAt: expiresAt });
}

// ── Écouter les changements de statut ────────────────────────
export function listenToPurchaseUpdates(
  callback: (isPremium: boolean, customerInfo: CustomerInfo) => void
): () => void {
  const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    const isPremium = checkPremiumStatus(customerInfo);
    callback(isPremium, customerInfo);
  });

  return () => listener.remove();
}

// ── Hook React pour l'abonnement ─────────────────────────────
export function formatPrice(priceString: string, period: string): string {
  return `${priceString} ${period}`;
}
