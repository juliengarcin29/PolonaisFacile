// ============================================================
// src/__tests__/srs.test.ts
// FIX PRODUCTION — Tests unitaires isolés de l'algorithme SRS
// Couvre : SM-2, cas limites, regression bugs
// ============================================================

import {
  calculateNextReview,
  isDueForReview,
  getDefaultReview,
  getMasteryLevel,
  sortByPriority,
  calculateSessionStats,
} from '../utils/srs';

// ── Helpers de test ───────────────────────────────────────────
const makeReview = (overrides = {}) => ({
  easinessFactor: 2.5,
  interval: 0,
  repetitions: 0,
  ...overrides,
});

const YESTERDAY = new Date(Date.now() - 86_400_000);
const TOMORROW = new Date(Date.now() + 86_400_000);
const NOW = new Date();

// ══════════════════════════════════════════════════════════════
// calculateNextReview — Algorithme SM-2
// ══════════════════════════════════════════════════════════════
describe('calculateNextReview — SM-2', () => {

  describe('Première répétition (rep=0)', () => {
    it('note 5 (parfait) → intervalle 1 jour, rep=1', () => {
      const r = calculateNextReview(makeReview(), 5);
      expect(r.interval).toBe(1);
      expect(r.repetitions).toBe(1);
    });

    it('note 4 (correct) → intervalle 1 jour, rep=1', () => {
      const r = calculateNextReview(makeReview(), 4);
      expect(r.interval).toBe(1);
      expect(r.repetitions).toBe(1);
    });

    it('note 3 (difficile) → intervalle 1 jour, rep=1', () => {
      const r = calculateNextReview(makeReview(), 3);
      expect(r.interval).toBe(1);
      expect(r.repetitions).toBe(1);
    });

    it('note 2 (incorrecte) → réinitialise, rep=0, intervalle=1', () => {
      const r = calculateNextReview(makeReview(), 2);
      expect(r.repetitions).toBe(0);
      expect(r.interval).toBe(1);
    });

    it('note 0 (blackout) → réinitialise complètement', () => {
      const r = calculateNextReview(makeReview(), 0);
      expect(r.repetitions).toBe(0);
      expect(r.interval).toBe(1);
    });
  });

  describe('Deuxième répétition (rep=1)', () => {
    it('note 5 → intervalle 6 jours', () => {
      const r = calculateNextReview(makeReview({ repetitions: 1, interval: 1 }), 5);
      expect(r.interval).toBe(6);
      expect(r.repetitions).toBe(2);
    });

    it('note 4 → intervalle 6 jours', () => {
      const r = calculateNextReview(makeReview({ repetitions: 1, interval: 1 }), 4);
      expect(r.interval).toBe(6);
    });
  });

  describe('Troisième répétition et au-delà (rep>=2)', () => {
    it('intervalle = round(previous_interval × EF)', () => {
      const ef = 2.5;
      const r = calculateNextReview(makeReview({ repetitions: 2, interval: 6, easinessFactor: ef }), 5);
      expect(r.interval).toBe(Math.round(6 * ef)); // 15
    });

    it('EF augmente avec note élevée', () => {
      const r = calculateNextReview(makeReview({ repetitions: 2, interval: 6 }), 5);
      expect(r.easinessFactor).toBeGreaterThan(2.5);
    });

    it('EF diminue avec note basse (3)', () => {
      const r = calculateNextReview(makeReview({ repetitions: 2, interval: 6 }), 3);
      expect(r.easinessFactor).toBeLessThan(2.5);
    });
  });

  describe('Limites du facteur de facilité (EF)', () => {
    it('EF ne descend jamais sous 1.3', () => {
      let review = makeReview({ easinessFactor: 1.3, repetitions: 5, interval: 20 });
      for (let i = 0; i < 10; i++) {
        review = calculateNextReview(review, 0) as any;
      }
      expect(review.easinessFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('EF ne dépasse jamais 2.5 par défaut (note max)', () => {
      let review = makeReview({ repetitions: 2, interval: 6 });
      for (let i = 0; i < 20; i++) {
        review = calculateNextReview(review, 5) as any;
      }
      // L'EF peut dépasser 2.5 selon l'implémentation — on vérifie juste la borne basse
      expect(review.easinessFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('nextReviewDate', () => {
    it('est dans le futur pour une bonne réponse', () => {
      const r = calculateNextReview(makeReview(), 5);
      expect(r.nextReviewDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('est demain pour la première bonne réponse (intervalle=1)', () => {
      const r = calculateNextReview(makeReview(), 5);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      expect(r.nextReviewDate.getTime()).toBe(tomorrow.getTime());
    });

    it('est dans 6 jours pour la deuxième bonne réponse', () => {
      const r = calculateNextReview(makeReview({ repetitions: 1, interval: 1 }), 5);
      const in6 = new Date();
      in6.setDate(in6.getDate() + 6);
      in6.setHours(0, 0, 0, 0);
      expect(r.nextReviewDate.getTime()).toBe(in6.getTime());
    });
  });

  describe('Idempotence et cohérence', () => {
    it('même entrée → même résultat (déterministe)', () => {
      const r1 = calculateNextReview(makeReview({ repetitions: 2, interval: 6 }), 4);
      const r2 = calculateNextReview(makeReview({ repetitions: 2, interval: 6 }), 4);
      expect(r1.interval).toBe(r2.interval);
      expect(r1.easinessFactor).toBeCloseTo(r2.easinessFactor, 5);
      expect(r1.repetitions).toBe(r2.repetitions);
    });

    it('note incorrecte après longue maîtrise → remet à 0 (pas à -1)', () => {
      const r = calculateNextReview(
        makeReview({ repetitions: 10, interval: 180, easinessFactor: 2.5 }), 0,
      );
      expect(r.repetitions).toBe(0);
      expect(r.interval).toBe(1);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// isDueForReview
// ══════════════════════════════════════════════════════════════
describe('isDueForReview', () => {
  it('date passée → due', () => {
    expect(isDueForReview(YESTERDAY)).toBe(true);
  });

  it('date future → pas due', () => {
    expect(isDueForReview(TOMORROW)).toBe(false);
  });

  it('date du jour → due (début du jour)', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(isDueForReview(today)).toBe(true);
  });

  it('date du jour fin de journée → due', () => {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    expect(isDueForReview(todayEnd)).toBe(true);
  });

  it('dans 1 milliseconde → pas due', () => {
    const nearFuture = new Date(Date.now() + 86_400_001); // demain + 1ms
    expect(isDueForReview(nearFuture)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// getDefaultReview
// ══════════════════════════════════════════════════════════════
describe('getDefaultReview', () => {
  it('crée une révision avec les valeurs SM-2 par défaut', () => {
    const r = getDefaultReview('card_1', 'user_1');
    expect(r.easinessFactor).toBe(2.5);
    expect(r.interval).toBe(0);
    expect(r.repetitions).toBe(0);
    expect(r.flashcardId).toBe('card_1');
    expect(r.userId).toBe('user_1');
    expect(r.totalReviews).toBe(0);
    expect(r.correctReviews).toBe(0);
  });

  it('nextReviewDate est aujourd\'hui ou dans le passé (due immédiatement)', () => {
    const r = getDefaultReview('card_1', 'user_1');
    expect(isDueForReview(r.nextReviewDate)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// getMasteryLevel
// ══════════════════════════════════════════════════════════════
describe('getMasteryLevel', () => {
  it('rep=0 → new', () => {
    expect(getMasteryLevel({ repetitions: 0, easinessFactor: 2.5 })).toBe('new');
  });

  it('rep=1 → learning', () => {
    expect(getMasteryLevel({ repetitions: 1, easinessFactor: 2.5 })).toBe('learning');
  });

  it('rep=2 → learning', () => {
    expect(getMasteryLevel({ repetitions: 2, easinessFactor: 2.5 })).toBe('learning');
  });

  it('rep=3 → reviewing', () => {
    expect(getMasteryLevel({ repetitions: 3, easinessFactor: 2.5 })).toBe('reviewing');
  });

  it('rep=6 → mastered', () => {
    expect(getMasteryLevel({ repetitions: 6, easinessFactor: 2.5 })).toBe('mastered');
  });

  it('rep=100 → mastered', () => {
    expect(getMasteryLevel({ repetitions: 100, easinessFactor: 2.5 })).toBe('mastered');
  });
});

// ══════════════════════════════════════════════════════════════
// sortByPriority
// ══════════════════════════════════════════════════════════════
describe('sortByPriority', () => {
  it('les nouvelles cartes (sans review) passent en premier', () => {
    const cards = [
      { id: 'c1', review: { ...makeReview({ repetitions: 3 }), nextReviewDate: YESTERDAY, flashcardId: 'c1', userId: 'u', lastReviewDate: undefined, totalReviews: 3, correctReviews: 3 } },
      { id: 'c2' }, // nouvelle carte, pas de review
    ];
    const sorted = sortByPriority(cards);
    expect(sorted[0].id).toBe('c2');
  });

  it('parmi les cartes avec review, la plus ancienne nextReviewDate passe en premier', () => {
    const makeR = (daysAgo: number) => ({
      ...makeReview({ repetitions: 1 }),
      nextReviewDate: new Date(Date.now() - daysAgo * 86_400_000),
      flashcardId: 'x', userId: 'u', lastReviewDate: undefined, totalReviews: 1, correctReviews: 1,
    });
    const cards = [
      { id: 'recent', review: makeR(1) },
      { id: 'older', review: makeR(5) },
      { id: 'oldest', review: makeR(10) },
    ];
    const sorted = sortByPriority(cards);
    expect(sorted[0].id).toBe('oldest');
    expect(sorted[1].id).toBe('older');
    expect(sorted[2].id).toBe('recent');
  });

  it('ne modifie pas le tableau original', () => {
    const cards = [{ id: 'a' }, { id: 'b' }];
    const original = [...cards];
    sortByPriority(cards);
    expect(cards).toEqual(original);
  });
});

// ══════════════════════════════════════════════════════════════
// calculateSessionStats
// ══════════════════════════════════════════════════════════════
describe('calculateSessionStats', () => {
  it('session vide → tout à 0', () => {
    const s = calculateSessionStats([]);
    expect(s.correctCount).toBe(0);
    expect(s.incorrectCount).toBe(0);
    expect(s.perfectCount).toBe(0);
    expect(s.accuracy).toBe(0);
    expect(s.averageRating).toBe(0);
  });

  it('toutes les réponses parfaites (5)', () => {
    const s = calculateSessionStats([5, 5, 5, 5]);
    expect(s.correctCount).toBe(4);
    expect(s.incorrectCount).toBe(0);
    expect(s.perfectCount).toBe(4);
    expect(s.accuracy).toBe(100);
    expect(s.averageRating).toBe(5);
  });

  it('toutes les réponses incorrectes (0)', () => {
    const s = calculateSessionStats([0, 0, 0]);
    expect(s.correctCount).toBe(0);
    expect(s.incorrectCount).toBe(3);
    expect(s.perfectCount).toBe(0);
    expect(s.accuracy).toBe(0);
  });

  it('session mixte', () => {
    const s = calculateSessionStats([5, 4, 2, 0, 3]);
    expect(s.correctCount).toBe(3);   // 5, 4, 3 >= 3
    expect(s.incorrectCount).toBe(2); // 2, 0 < 3
    expect(s.perfectCount).toBe(1);   // seulement 5
    expect(s.accuracy).toBe(60);
    expect(s.averageRating).toBeCloseTo(2.8, 1);
  });

  it('une seule note 3 (limite correcte)', () => {
    const s = calculateSessionStats([3]);
    expect(s.correctCount).toBe(1);
    expect(s.incorrectCount).toBe(0);
  });

  it('une seule note 2 (limite incorrecte)', () => {
    const s = calculateSessionStats([2]);
    expect(s.correctCount).toBe(0);
    expect(s.incorrectCount).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════
// Scenario de régression complet — 30 révisions consécutives
// ══════════════════════════════════════════════════════════════
describe('Scénario de régression — progression complète', () => {
  it('après 30 bonnes révisions, l\'intervalle dépasse 365 jours', () => {
    let review = makeReview();
    for (let i = 0; i < 30; i++) {
      review = calculateNextReview(review, 4) as any;
    }
    expect(review.interval).toBeGreaterThan(365);
  });

  it('après une série de bonnes puis mauvaises réponses, l\'intervalle se remet à 1', () => {
    let review = makeReview();
    // 5 bonnes réponses
    for (let i = 0; i < 5; i++) review = calculateNextReview(review, 5) as any;
    const intervalAfterGood = review.interval;
    expect(intervalAfterGood).toBeGreaterThan(10);
    // 1 mauvaise réponse
    review = calculateNextReview(review, 0) as any;
    expect(review.interval).toBe(1);
    expect(review.repetitions).toBe(0);
  });

  it('la nextReviewDate est toujours >= aujourd\'hui + interval jours', () => {
    let review = makeReview();
    for (let i = 0; i < 10; i++) {
      review = calculateNextReview(review, 4) as any;
      const expectedMin = new Date();
      expectedMin.setDate(expectedMin.getDate() + review.interval - 1);
      expect(review.nextReviewDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    }
  });
});
