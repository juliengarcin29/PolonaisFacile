// ============================================================
// src/__tests__/gamification.test.ts
// Tests — useGamification hook
// ============================================================

import { ALL_ACHIEVEMENTS } from '../hooks/useGamification';
import { scoreToGrade, getStreakEmoji, getLevelFromXP } from '../utils';

describe('Achievements', () => {

  describe('ALL_ACHIEVEMENTS', () => {
    it('contient au moins 10 badges', () => {
      expect(ALL_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
    });

    it('chaque badge a un id unique', () => {
      const ids = ALL_ACHIEVEMENTS.map(a => a.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('chaque badge a un emoji, titre et description', () => {
      ALL_ACHIEVEMENTS.forEach(a => {
        expect(a.icon).toBeTruthy();
        expect(a.title).toBeTruthy();
        expect(a.description).toBeTruthy();
      });
    });

    it('chaque badge a une rareté valide', () => {
      const validRarities = ['common', 'rare', 'epic', 'legendary'];
      ALL_ACHIEVEMENTS.forEach(a => {
        expect(validRarities).toContain(a.rarity);
      });
    });

    it('les récompenses XP sont positives', () => {
      ALL_ACHIEVEMENTS.forEach(a => {
        expect(a.xpReward).toBeGreaterThan(0);
      });
    });

    it('les badges légendaires ont plus de XP que les communs', () => {
      const legendary = ALL_ACHIEVEMENTS.filter(a => a.rarity === 'legendary');
      const common = ALL_ACHIEVEMENTS.filter(a => a.rarity === 'common');
      if (legendary.length > 0 && common.length > 0) {
        const avgLegendary = legendary.reduce((s, a) => s + a.xpReward, 0) / legendary.length;
        const avgCommon = common.reduce((s, a) => s + a.xpReward, 0) / common.length;
        expect(avgLegendary).toBeGreaterThan(avgCommon);
      }
    });
  });

  describe('Progression et niveaux', () => {
    it('niveau 1 pour XP = 0', () => {
      expect(getLevelFromXP(0)).toBe(1);
    });

    it('niveau 2 pour XP = 100', () => {
      expect(getLevelFromXP(100)).toBe(2);
    });

    it('niveau 5 pour XP = 1000', () => {
      expect(getLevelFromXP(1000)).toBe(5);
    });

    it('niveau max pour XP très élevé', () => {
      expect(getLevelFromXP(100000)).toBe(10);
    });

    it('progression strictement croissante', () => {
      const levels = [0, 50, 100, 300, 600, 1000, 1500];
      let prev = getLevelFromXP(0);
      levels.slice(1).forEach(xp => {
        const current = getLevelFromXP(xp);
        expect(current).toBeGreaterThanOrEqual(prev);
        prev = current;
      });
    });
  });

  describe('Badges de streak', () => {
    it('émoji dormant pour streak 0', () => {
      expect(getStreakEmoji(0)).toBe('💤');
    });

    it('émoji graine pour streak 1', () => {
      expect(getStreakEmoji(1)).toBe('🌱');
    });

    it('émoji flamme pour streak 7', () => {
      expect(getStreakEmoji(7)).toBe('⚡');
    });

    it('émoji trophée pour streak 365', () => {
      expect(getStreakEmoji(365)).toBe('🏆');
    });
  });

  describe('scoreToGrade', () => {
    it('trophée pour 100%', () => {
      expect(scoreToGrade(100).emoji).toBe('🏆');
    });

    it('étoile pour 85%', () => {
      expect(scoreToGrade(85).emoji).toBe('⭐');
    });

    it('pouce pour 70%', () => {
      expect(scoreToGrade(70).emoji).toBe('👍');
    });

    it('muscle pour 55%', () => {
      expect(scoreToGrade(55).emoji).toBe('💪');
    });

    it('livre pour 40%', () => {
      expect(scoreToGrade(40).emoji).toBe('📚');
    });

    it('chaque grade a une couleur', () => {
      [100, 85, 70, 55, 40].forEach(score => {
        expect(scoreToGrade(score).color).toBeTruthy();
      });
    });
  });
});


// ============================================================
// src/__tests__/polish.test.ts
// Tests — Utilitaires polonais
// ============================================================

import {
  normalizePl, comparePl, countSyllables,
  guessGender, conjugateVerb, POLISH_ALPHABET,
} from '../utils/allUtils';

describe('Utilitaires polonais', () => {

  describe('normalizePl', () => {
    it('convertit ą → a', () => {
      expect(normalizePl('ą')).toBe('a');
    });
    it('convertit ę → e', () => {
      expect(normalizePl('ę')).toBe('e');
    });
    it('convertit ó → o', () => {
      expect(normalizePl('ó')).toBe('o');
    });
    it('convertit ł → l', () => {
      expect(normalizePl('ł')).toBe('l');
    });
    it('convertit ż → z', () => {
      expect(normalizePl('ż')).toBe('z');
    });
    it('convertit ź → z', () => {
      expect(normalizePl('ź')).toBe('z');
    });
    it('supprime la ponctuation', () => {
      expect(normalizePl('Cześć!')).toBe('czesc');
    });
    it('met en minuscules', () => {
      expect(normalizePl('DZIĘKUJĘ')).toBe('dziekuje');
    });
    it('gère une chaîne vide', () => {
      expect(normalizePl('')).toBe('');
    });
  });

  describe('comparePl', () => {
    it('correspondance exacte → 100%', () => {
      const r = comparePl('dziękuję', 'dziękuję');
      expect(r.isCorrect).toBe(true);
      expect(r.similarity).toBe(1);
    });

    it('diacritiques manquants → toujours correct', () => {
      const r = comparePl('dziekuje', 'dziękuję');
      expect(r.isCorrect).toBe(true);
    });

    it('majuscules ignorées', () => {
      const r = comparePl('Dziękuję', 'dziękuję');
      expect(r.isCorrect).toBe(true);
    });

    it('réponse incorrecte', () => {
      const r = comparePl('bonjour', 'dziękuję');
      expect(r.isCorrect).toBe(false);
    });

    it('similarité entre 0 et 1', () => {
      const r = comparePl('dzien', 'dziękuję');
      expect(r.similarity).toBeGreaterThanOrEqual(0);
      expect(r.similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('countSyllables', () => {
    it('un mot monosyllabique', () => {
      expect(countSyllables('dom')).toBe(1);
    });
    it('deux syllabes', () => {
      expect(countSyllables('mama')).toBe(2);
    });
    it('trois syllabes', () => {
      expect(countSyllables('Polonia')).toBe(4);
    });
    it('minimum 1', () => {
      expect(countSyllables('rz')).toBeGreaterThanOrEqual(1);
    });
  });

  describe('guessGender', () => {
    it('masculin — finit en consonne', () => {
      expect(guessGender('dom')).toBe('masculine');
    });
    it('féminin — finit en -a', () => {
      expect(guessGender('mama')).toBe('feminine');
    });
    it('neutre — finit en -o', () => {
      expect(guessGender('okno')).toBe('neuter');
    });
    it('féminin — finit en -ość', () => {
      expect(guessGender('miłość')).toBe('feminine');
    });
  });

  describe('conjugateVerb', () => {
    it('verbe en -ować : pracować → pracuję', () => {
      expect(conjugateVerb('pracować', 'ja')).toBe('pracuję');
    });
    it('verbe en -ować : ty → pracujesz', () => {
      expect(conjugateVerb('pracować', 'ty')).toBe('pracujesz');
    });
    it('verbe en -ić : mówić → mówię', () => {
      expect(conjugateVerb('mówić', 'ja')).toBe('mówię');
    });
    it('verbe en -ać : czytać → czytam', () => {
      expect(conjugateVerb('czytać', 'ja')).toBe('czytam');
    });
  });

  describe('POLISH_ALPHABET', () => {
    it('contient 32+ lettres', () => {
      expect(POLISH_ALPHABET.length).toBeGreaterThanOrEqual(32);
    });

    it('chaque lettre a un son et une note', () => {
      POLISH_ALPHABET.forEach(l => {
        expect(l.letter).toBeTruthy();
        expect(l.sound).toBeTruthy();
        expect(l.note).toBeTruthy();
      });
    });

    it('commence par A', () => {
      expect(POLISH_ALPHABET[0].letter).toBe('A');
    });
  });
});


// ============================================================
// src/__tests__/content.test.ts
// Tests — Contenu pédagogique
// ============================================================

import { FLASHCARDS } from '../content/flashcards/flashcards';
import { QUIZZES } from '../content/quizzes/quizzes';
import { MODULE_1_LESSONS } from '../content/lessons/module1';
import { MODULE_2_LESSONS } from '../content/lessons/module2_3';

describe('Contenu pédagogique', () => {

  describe('Flashcards', () => {
    it('contient au moins 50 flashcards', () => {
      expect(FLASHCARDS.length).toBeGreaterThanOrEqual(50);
    });

    it('chaque flashcard a un id unique', () => {
      const ids = FLASHCARDS.map(f => f.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('chaque flashcard a front, back, phonetique', () => {
      FLASHCARDS.forEach(f => {
        expect(f.front).toBeTruthy();
        expect(f.back).toBeTruthy();
        expect(f.phonetic).toBeTruthy();
      });
    });

    it('chaque flashcard a au moins 1 tag', () => {
      FLASHCARDS.forEach(f => {
        expect(f.tags.length).toBeGreaterThan(0);
      });
    });

    it('les flashcards gratuites sont présentes', () => {
      const free = FLASHCARDS.filter(f => !f.isPremium);
      expect(free.length).toBeGreaterThan(0);
    });
  });

  describe('Quiz', () => {
    it('contient au moins 3 quiz', () => {
      expect(QUIZZES.length).toBeGreaterThanOrEqual(3);
    });

    it('chaque quiz a des questions', () => {
      QUIZZES.forEach(q => {
        expect(q.questions.length).toBeGreaterThan(0);
      });
    });

    it('chaque question a une réponse correcte', () => {
      QUIZZES.forEach(q => {
        q.questions.forEach(question => {
          expect(question.correctAnswer).toBeTruthy();
        });
      });
    });

    it('passingScore entre 0 et 100', () => {
      QUIZZES.forEach(q => {
        expect(q.passingScore).toBeGreaterThanOrEqual(0);
        expect(q.passingScore).toBeLessThanOrEqual(100);
      });
    });

    it('chaque quiz a un xpReward positif', () => {
      QUIZZES.forEach(q => {
        expect(q.xpReward).toBeGreaterThan(0);
      });
    });
  });

  describe('Leçons Module 1', () => {
    it('contient 3 leçons', () => {
      expect(MODULE_1_LESSONS.length).toBe(3);
    });

    it('chaque leçon a des exercices', () => {
      MODULE_1_LESSONS.forEach(l => {
        expect(l.exercises.length).toBeGreaterThan(0);
      });
    });

    it('les leçons sont ordonnées', () => {
      for (let i = 1; i < MODULE_1_LESSONS.length; i++) {
        expect(MODULE_1_LESSONS[i].order).toBeGreaterThan(MODULE_1_LESSONS[i - 1].order);
      }
    });

    it('xpReward positif pour chaque leçon', () => {
      MODULE_1_LESSONS.forEach(l => {
        expect(l.xpReward).toBeGreaterThan(0);
      });
    });
  });

  describe('Leçons Module 2', () => {
    it('contient 4 leçons', () => {
      expect(MODULE_2_LESSONS.length).toBe(4);
    });

    it('toutes appartiennent au module 2', () => {
      MODULE_2_LESSONS.forEach(l => {
        expect(l.moduleId).toBe('module_2');
      });
    });
  });
});
