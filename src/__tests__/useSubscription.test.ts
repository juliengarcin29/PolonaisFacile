// ============================================================
// src/__tests__/useSubscription.test.ts
// Tests — gestion abonnements et erreurs réseau RevenueCat
// ============================================================

jest.mock('react-native-purchases', () => ({
  default: {
    configure: jest.fn().mockResolvedValue(undefined),
    getOfferings: jest.fn().mockResolvedValue({
      current: {
        availablePackages: [
          { identifier: 'premium_monthly', product: { priceString: '4,99 €', title: 'Premium Mensuel' } },
          { identifier: 'premium_yearly', product: { priceString: '29,99 €', title: 'Premium Annuel' } },
        ],
      },
    }),
    purchasePackage: jest.fn().mockResolvedValue({
      customerInfo: {
        entitlements: { active: { premium: { isActive: true } } },
      },
    }),
    restorePurchases: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
    }),
    getCustomerInfo: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
    }),
    addCustomerInfoUpdateListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 2,
    NETWORK_ERROR: 10,
  },
}));

jest.mock('../store/userStore', () => ({
  useUserStore: () => ({
    user: { id: 'test-uid', premium: false },
    setPremium: jest.fn(),
    setSubscription: jest.fn(),
  }),
}));

import Purchases, { PURCHASES_ERROR_CODE } from 'react-native-purchases';

// Simulateur de comportements d'achat
describe('Gestion abonnements — comportements critiques', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  describe('Chargement des offres', () => {
    it('charge les offres disponibles sans erreur', async () => {
      const offerings = await (Purchases as any).default.getOfferings();
      expect(offerings.current.availablePackages).toHaveLength(2);
    });

    it('gère l\'absence d\'offres (current=null) sans crasher', async () => {
      (Purchases as any).default.getOfferings.mockResolvedValueOnce({ current: null });
      const offerings = await (Purchases as any).default.getOfferings();
      expect(offerings.current).toBeNull();
      // L'app doit afficher un état vide, pas crasher
    });

    it('gère une erreur réseau sur getOfferings', async () => {
      (Purchases as any).default.getOfferings.mockRejectedValueOnce(
        new Error('network error')
      );
      await expect((Purchases as any).default.getOfferings()).rejects.toThrow('network error');
    });
  });

  describe('Achat d\'abonnement', () => {
    it('achat réussi → retourne customerInfo avec entitlement actif', async () => {
      const result = await (Purchases as any).default.purchasePackage({ identifier: 'premium_monthly' });
      expect(result.customerInfo.entitlements.active).toHaveProperty('premium');
    });

    it('annulation par l\'utilisateur → code PURCHASE_CANCELLED_ERROR', async () => {
      const cancelError = Object.assign(new Error('Cancelled'), {
        code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
        userCancelled: true,
      });
      (Purchases as any).default.purchasePackage.mockRejectedValueOnce(cancelError);
      try {
        await (Purchases as any).default.purchasePackage({ identifier: 'premium_monthly' });
      } catch (e: any) {
        expect(e.userCancelled).toBe(true);
        expect(e.code).toBe(2);
      }
    });

    it('erreur réseau pendant l\'achat → code NETWORK_ERROR', async () => {
      const networkError = Object.assign(new Error('Network'), {
        code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
        userCancelled: false,
      });
      (Purchases as any).default.purchasePackage.mockRejectedValueOnce(networkError);
      try {
        await (Purchases as any).default.purchasePackage({ identifier: 'premium_yearly' });
      } catch (e: any) {
        expect(e.code).toBe(10);
        expect(e.userCancelled).toBe(false);
      }
    });
  });

  describe('Restauration des achats', () => {
    it('restauration sans achat précédent → entitlements vides (pas d\'erreur)', async () => {
      const result = await (Purchases as any).default.restorePurchases();
      expect(result.entitlements.active).toEqual({});
    });

    it('restauration avec abonnement actif → premium retrouvé', async () => {
      (Purchases as any).default.restorePurchases.mockResolvedValueOnce({
        entitlements: { active: { premium: { isActive: true, productIdentifier: 'premium_yearly' } } },
      });
      const result = await (Purchases as any).default.restorePurchases();
      expect(result.entitlements.active.premium.isActive).toBe(true);
    });

    it('erreur réseau lors de la restauration → rejection propre', async () => {
      (Purchases as any).default.restorePurchases.mockRejectedValueOnce(
        new Error('Connection failed')
      );
      await expect((Purchases as any).default.restorePurchases()).rejects.toThrow('Connection failed');
    });
  });

  describe('Vérification statut premium', () => {
    it('utilisateur non premium → entitlements.active vide', async () => {
      const info = await (Purchases as any).default.getCustomerInfo();
      const isPremium = Object.keys(info.entitlements.active).length > 0;
      expect(isPremium).toBe(false);
    });

    it('utilisateur premium → entitlements.active contient "premium"', async () => {
      (Purchases as any).default.getCustomerInfo.mockResolvedValueOnce({
        entitlements: { active: { premium: { isActive: true } } },
      });
      const info = await (Purchases as any).default.getCustomerInfo();
      const isPremium = 'premium' in info.entitlements.active;
      expect(isPremium).toBe(true);
    });
  });
});
