// ============================================================
// src/__tests__/activityUtils.test.ts
// Tests purs du journal d'activité et de la série
// ============================================================

import { describe, it, expect } from '@jest/globals';
import {
  toDateKey,
  getPreviousDateKey,
  getWeek,
  computeStreak,
  mergeActivityLogs,
  pruneActivityLog,
  capSessionSeconds,
  getActiveDaysCount,
  getActivityForDay,
} from '../utils/activityUtils';
import type { ActivityLog } from '../types';

const DAY = { seconds: 60, lessonsCompleted: 1, xp: 10, exercisesDone: 7 };

function logOf(...keys: string[]): ActivityLog {
  const log: ActivityLog = {};
  keys.forEach(k => { log[k] = { ...DAY }; });
  return log;
}

describe('toDateKey', () => {
  it('formate en YYYY-MM-DD avec zéros', () => {
    expect(toDateKey(new Date(2026, 4, 5))).toBe('2026-05-05');
  });
  it('utilise le jour LOCAL, même tard le soir', () => {
    expect(toDateKey(new Date(2026, 4, 15, 23, 59, 59))).toBe('2026-05-15');
  });
  it('utilise le jour LOCAL, même juste après minuit', () => {
    expect(toDateKey(new Date(2026, 0, 1, 0, 0, 1))).toBe('2026-01-01');
  });
  it('gère le 29 février d\'une année bissextile', () => {
    expect(toDateKey(new Date(2028, 1, 29))).toBe('2028-02-29');
  });
  it('gère le 31 décembre', () => {
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('getPreviousDateKey', () => {
  it('jour ordinaire', () => {
    expect(getPreviousDateKey('2026-05-17')).toBe('2026-05-16');
  });
  it('début de mois', () => {
    expect(getPreviousDateKey('2026-05-01')).toBe('2026-04-30');
  });
  it('début d\'année', () => {
    expect(getPreviousDateKey('2026-01-01')).toBe('2025-12-31');
  });
  it('lendemain d\'un 29 février', () => {
    expect(getPreviousDateKey('2028-03-01')).toBe('2028-02-29');
  });
  it('changement d\'heure d\'été (29 mars 2026)', () => {
    expect(getPreviousDateKey('2026-03-29')).toBe('2026-03-28');
    expect(getPreviousDateKey('2026-03-30')).toBe('2026-03-29');
  });
  it('changement d\'heure d\'hiver (25 octobre 2026)', () => {
    expect(getPreviousDateKey('2026-10-25')).toBe('2026-10-24');
    expect(getPreviousDateKey('2026-10-26')).toBe('2026-10-25');
  });
});

describe('getWeek', () => {
  it('un dimanche renvoie la semaine qui finit ce jour', () => {
    const w = getWeek('2026-05-17');
    expect(w[0]).toBe('2026-05-11');
    expect(w[6]).toBe('2026-05-17');
  });
  it('un lundi renvoie la semaine qui commence ce jour', () => {
    const w = getWeek('2026-05-11');
    expect(w[0]).toBe('2026-05-11');
    expect(w[6]).toBe('2026-05-17');
  });
  it('passage de mois', () => {
    const w = getWeek('2026-05-01');
    expect(w[0]).toBe('2026-04-27');
    expect(w[6]).toBe('2026-05-03');
  });
  it('passage d\'année', () => {
    const w = getWeek('2026-01-01');
    expect(w[0]).toBe('2025-12-29');
    expect(w[6]).toBe('2026-01-04');
  });
  it('semaine du changement d\'heure : 7 jours distincts et ordonnés', () => {
    const w = getWeek('2026-03-29');
    expect(w).toEqual([
      '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26',
      '2026-03-27', '2026-03-28', '2026-03-29',
    ]);
    const w2 = getWeek('2026-10-25');
    expect(w2[6]).toBe('2026-10-25');
    expect(new Set(w2).size).toBe(7);
  });
});

describe('computeStreak', () => {
  it('journal absent ou vide : 0', () => {
    expect(computeStreak(undefined, '2026-05-17')).toEqual({ currentStreak: 0, longestStreak: 0 });
    expect(computeStreak({}, '2026-05-17')).toEqual({ currentStreak: 0, longestStreak: 0 });
  });
  it('aujourd\'hui seulement : 1', () => {
    expect(computeStreak(logOf('2026-05-17'), '2026-05-17').currentStreak).toBe(1);
  });
  it('hier + aujourd\'hui : 2', () => {
    expect(computeStreak(logOf('2026-05-16', '2026-05-17'), '2026-05-17').currentStreak).toBe(2);
  });
  it('hier seulement : 1 (série à sauver)', () => {
    expect(computeStreak(logOf('2026-05-16'), '2026-05-17').currentStreak).toBe(1);
  });
  it('avant-hier seulement : 0 (série brisée) mais meilleure série 1', () => {
    expect(computeStreak(logOf('2026-05-15'), '2026-05-17')).toEqual({ currentStreak: 0, longestStreak: 1 });
  });
  it('un trou : seule la série la plus récente compte', () => {
    const log = logOf('2026-05-10', '2026-05-11', '2026-05-12', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17');
    expect(computeStreak(log, '2026-05-17')).toEqual({ currentStreak: 4, longestStreak: 4 });
  });
  it('meilleure série ancienne conservée quand la série actuelle est brisée', () => {
    const log = logOf('2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-10');
    expect(computeStreak(log, '2026-05-17')).toEqual({ currentStreak: 0, longestStreak: 4 });
  });
  it('passage de mois', () => {
    expect(computeStreak(logOf('2026-04-30', '2026-05-01'), '2026-05-01').currentStreak).toBe(2);
  });
  it('passage d\'année', () => {
    expect(computeStreak(logOf('2025-12-31', '2026-01-01'), '2026-01-01').currentStreak).toBe(2);
  });
  it('changement d\'heure d\'été', () => {
    expect(computeStreak(logOf('2026-03-28', '2026-03-29', '2026-03-30'), '2026-03-30').currentStreak).toBe(3);
  });
  it('changement d\'heure d\'hiver', () => {
    expect(computeStreak(logOf('2026-10-24', '2026-10-25', '2026-10-26'), '2026-10-26').currentStreak).toBe(3);
  });
  it('un jour avec seulement des secondes (aucun exercice) n\'est pas actif', () => {
    const log: ActivityLog = { '2026-05-17': { seconds: 50, lessonsCompleted: 0, xp: 0, exercisesDone: 0 } };
    expect(computeStreak(log, '2026-05-17').currentStreak).toBe(0);
  });
  it('une révision de cartes ou une mission suffit à rendre le jour actif', () => {
    const log: ActivityLog = {
      '2026-05-16': { seconds: 0, lessonsCompleted: 0, xp: 0, exercisesDone: 0, cardsReviewed: 5 },
      '2026-05-17': { seconds: 0, lessonsCompleted: 0, xp: 0, exercisesDone: 0, missionDone: true },
    };
    expect(computeStreak(log, '2026-05-17').currentStreak).toBe(2);
  });
  it('mois complet de 30 jours consécutifs', () => {
    const keys: string[] = [];
    for (let d = 1; d <= 30; d++) keys.push(`2026-06-${String(d).padStart(2, '0')}`);
    expect(computeStreak(logOf(...keys), '2026-06-30')).toEqual({ currentStreak: 30, longestStreak: 30 });
  });
});

describe('mergeActivityLogs', () => {
  it('garde le maximum champ par champ pour un même jour', () => {
    const merged = mergeActivityLogs(
      { '2026-05-15': { seconds: 100, lessonsCompleted: 2, xp: 50, exercisesDone: 10 } },
      { '2026-05-15': { seconds: 200, lessonsCompleted: 1, xp: 80, exercisesDone: 5 } },
    );
    expect(merged['2026-05-15']).toMatchObject({ seconds: 200, lessonsCompleted: 2, xp: 80, exercisesDone: 10 });
  });
  it('réunit les jours des deux journaux', () => {
    const merged = mergeActivityLogs(logOf('2026-05-01'), logOf('2026-05-02'));
    expect(Object.keys(merged).sort()).toEqual(['2026-05-01', '2026-05-02']);
  });
  it('accepte un journal absent', () => {
    expect(Object.keys(mergeActivityLogs(undefined, logOf('2026-05-01')))).toEqual(['2026-05-01']);
    expect(Object.keys(mergeActivityLogs(logOf('2026-05-01'), undefined))).toEqual(['2026-05-01']);
  });
  it('conserve les champs optionnels', () => {
    const merged = mergeActivityLogs(
      { '2026-05-15': { ...DAY, missionDone: true } },
      { '2026-05-15': { ...DAY, cardsReviewed: 12 } },
    );
    expect(merged['2026-05-15'].missionDone).toBe(true);
    expect(merged['2026-05-15'].cardsReviewed).toBe(12);
  });
  it('est idempotente : fusionner deux fois donne le même résultat', () => {
    const a = logOf('2026-05-01', '2026-05-02');
    const b: ActivityLog = { '2026-05-02': { ...DAY, xp: 99 } };
    const once = mergeActivityLogs(a, b);
    expect(mergeActivityLogs(once, b)).toEqual(once);
  });
});

describe('pruneActivityLog', () => {
  it('ramène 405 jours à 400 en gardant les plus récents', () => {
    const log: ActivityLog = {};
    for (let i = 0; i < 405; i++) log[toDateKey(new Date(2025, 0, 1 + i))] = { ...DAY };
    const pruned = pruneActivityLog(log, 400);
    const keys = Object.keys(pruned);
    expect(keys).toHaveLength(400);
    expect(keys).not.toContain('2025-01-01');
    expect(keys).toContain(toDateKey(new Date(2025, 0, 405)));
  });
  it('ne touche pas un journal de 400 jours ou moins', () => {
    const log = logOf('2026-05-01', '2026-05-02');
    expect(pruneActivityLog(log, 400)).toBe(log);
  });
  it('accepte un journal vide', () => {
    expect(pruneActivityLog({}, 400)).toEqual({});
  });
});

describe('capSessionSeconds', () => {
  it('négatif : 0', () => expect(capSessionSeconds(-10)).toBe(0));
  it('zéro : 0', () => expect(capSessionSeconds(0)).toBe(0));
  it('valeur normale inchangée', () => expect(capSessionSeconds(600)).toBe(600));
  it('plafond atteint', () => expect(capSessionSeconds(1200)).toBe(1200));
  it('au-delà du plafond : 1200', () => expect(capSessionSeconds(2500)).toBe(1200));
  it('plafond personnalisé', () => expect(capSessionSeconds(500, 300)).toBe(300));
});

describe('getActivityForDay', () => {
  it('renvoie des zéros pour un jour absent', () => {
    expect(getActivityForDay({}, '2026-05-17')).toEqual({ seconds: 0, lessonsCompleted: 0, xp: 0, exercisesDone: 0 });
    expect(getActivityForDay(undefined, '2026-05-17').xp).toBe(0);
  });
  it('renvoie les valeurs enregistrées et les champs optionnels présents', () => {
    const log: ActivityLog = { '2026-05-17': { ...DAY, cardsReviewed: 4 } };
    const day = getActivityForDay(log, '2026-05-17');
    expect(day.exercisesDone).toBe(7);
    expect(day.cardsReviewed).toBe(4);
  });
});

describe('getActiveDaysCount', () => {
  it('compte les jours de la période, bornes incluses', () => {
    const log = logOf('2026-05-01', '2026-05-03', '2026-05-05', '2026-05-09');
    expect(getActiveDaysCount(log, '2026-05-03', '2026-05-05')).toBe(2);
    expect(getActiveDaysCount(log, '2026-05-01', '2026-05-31')).toBe(4);
  });
  it('journal absent : 0', () => {
    expect(getActiveDaysCount(undefined, '2026-05-01', '2026-05-31')).toBe(0);
  });
});
