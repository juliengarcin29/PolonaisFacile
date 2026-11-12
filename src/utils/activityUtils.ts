// ============================================================
// src/utils/activityUtils.ts
// Utilitaires de gestion du journal d'activité quotidien (activityLog)
// ============================================================

import type { ActivityLog, ActivityLogDay } from '@/types';

/**
 * Convertit une Date en clé locale 'YYYY-MM-DD' (jour du téléphone, pas UTC).
 */
export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Conserve uniquement les 400 derniers jours dans l'historique d'activité.
 */
export function pruneActivityLog(
  log: ActivityLog = {},
  maxDays: number = 400
): ActivityLog {
  const keys = Object.keys(log).sort();
  if (keys.length <= maxDays) return log;

  const cutoffIndex = keys.length - maxDays;
  const pruned: ActivityLog = {};
  for (let i = cutoffIndex; i < keys.length; i++) {
    pruned[keys[i]] = log[keys[i]];
  }
  return pruned;
}

/**
 * Fusionne deux journaux d'activité en gardant le maximum champ par champ.
 */
export function mergeActivityLogs(
  logA: ActivityLog = {},
  logB: ActivityLog = {}
): ActivityLog {
  const merged: ActivityLog = {};
  const allKeys = new Set([...Object.keys(logA), ...Object.keys(logB)]);

  allKeys.forEach((key) => {
    const a = logA[key];
    const b = logB[key];
    merged[key] = {
      ...(a || {}),
      ...(b || {}),
      seconds: Math.max(a?.seconds ?? 0, b?.seconds ?? 0),
      lessonsCompleted: Math.max(a?.lessonsCompleted ?? 0, b?.lessonsCompleted ?? 0),
      xp: Math.max(a?.xp ?? 0, b?.xp ?? 0),
      exercisesDone: Math.max(a?.exercisesDone ?? 0, b?.exercisesDone ?? 0),
    };
  });

  return pruneActivityLog(merged, 400);
}

/**
 * Retourne l'activité enregistrée pour un jour donné ('YYYY-MM-DD').
 */
export function getActivityForDay(
  activityLog: ActivityLog | undefined,
  dateKey: string
): ActivityLogDay {
  const day = activityLog?.[dateKey];
  return {
    seconds: day?.seconds ?? 0,
    lessonsCompleted: day?.lessonsCompleted ?? 0,
    xp: day?.xp ?? 0,
    exercisesDone: day?.exercisesDone ?? 0,
    ...(day?.missionDone !== undefined ? { missionDone: day.missionDone } : {}),
    ...(day?.cardsReviewed !== undefined ? { cardsReviewed: day.cardsReviewed } : {}),
  };
}

/**
 * Retourne les 7 clés 'YYYY-MM-DD' (du lundi au dimanche) de la semaine contenant dateKey.
 */
export function getWeek(dateKey: string): string[] {
  const [year, month, day] = dateKey.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  const dayOfWeek = targetDate.getDay(); // 0 = Dimanche, 1 = Lundi...
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - distanceToMonday);

  const weekKeys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    weekKeys.push(toDateKey(current));
  }
  return weekKeys;
}

/**
 * Plafonne le temps d'une séance (1200 secondes / 20 min max par défaut).
 */
export function capSessionSeconds(seconds: number, max: number = 1200): number {
  if (seconds < 0) return 0;
  return Math.min(seconds, max);
}

/**
 * Compte le nombre de jours d'activité entre fromKey et toKey inclusivement.
 */
export function getActiveDaysCount(
  activityLog: ActivityLog | undefined,
  fromKey: string,
  toKey: string
): number {
  if (!activityLog) return 0;
  let count = 0;

  const keys = Object.keys(activityLog).filter(key => key >= fromKey && key <= toKey);
  for (const key of keys) {
    const day = activityLog[key];
    if (
      day &&
      ((day.seconds ?? 0) > 0 ||
        (day.xp ?? 0) > 0 ||
        (day.exercisesDone ?? 0) > 0 ||
        (day.lessonsCompleted ?? 0) > 0)
    ) {
      count++;
    }
  }
  return count;
}

/**
 * Vérification automatique interne sans dépendance externe / Jest.
 */
export function selfCheckActivityUtils(): void {
  // 1. toDateKey format
  const todayKey = toDateKey(new Date(2026, 4, 15)); // 15 mai 2026
  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayKey) || todayKey !== '2026-05-15') {
    throw new Error(`toDateKey test échoué: ${todayKey}`);
  }

  // 2. getWeek (7 jours lundi -> dimanche)
  // Cas Dimanche : 17 mai 2026 (dimanche) -> Lundi 11 mai à Dimanche 17 mai
  const weekSun = getWeek('2026-05-17');
  if (weekSun.length !== 7 || weekSun[0] !== '2026-05-11' || weekSun[6] !== '2026-05-17') {
    throw new Error(`getWeek (Dimanche) échoué: ${JSON.stringify(weekSun)}`);
  }

  // Cas Lundi : 11 mai 2026 (lundi) -> Lundi 11 mai à Dimanche 17 mai
  const weekMon = getWeek('2026-05-11');
  if (weekMon.length !== 7 || weekMon[0] !== '2026-05-11' || weekMon[6] !== '2026-05-17') {
    throw new Error(`getWeek (Lundi) échoué: ${JSON.stringify(weekMon)}`);
  }

  // Cas changement de mois : 1er mai 2026 (vendredi) -> Lundi 27 avril à Dimanche 3 mai
  const weekMonthTransition = getWeek('2026-05-01');
  if (weekMonthTransition.length !== 7 || weekMonthTransition[0] !== '2026-04-27' || weekMonthTransition[6] !== '2026-05-03') {
    throw new Error(`getWeek (Mois) échoué: ${JSON.stringify(weekMonthTransition)}`);
  }

  // Cas changement d'année : 1er janvier 2026 (jeudi) -> Lundi 29 décembre 2025 à Dimanche 4 janvier 2026
  const weekYearTransition = getWeek('2026-01-01');
  if (weekYearTransition.length !== 7 || weekYearTransition[0] !== '2025-12-29' || weekYearTransition[6] !== '2026-01-04') {
    throw new Error(`getWeek (Année) échoué: ${JSON.stringify(weekYearTransition)}`);
  }

  // 3. mergeActivityLogs garde le MAX champ par champ
  const merged = mergeActivityLogs(
    { '2026-05-15': { seconds: 100, lessonsCompleted: 2, xp: 50, exercisesDone: 10 } },
    { '2026-05-15': { seconds: 200, lessonsCompleted: 1, xp: 80, exercisesDone: 5 } }
  );
  if (
    merged['2026-05-15'].seconds !== 200 ||
    merged['2026-05-15'].lessonsCompleted !== 2 ||
    merged['2026-05-15'].xp !== 80 ||
    merged['2026-05-15'].exercisesDone !== 10
  ) {
    throw new Error(`mergeActivityLogs échoué: ${JSON.stringify(merged)}`);
  }

  // 4. pruneActivityLog ramène 405 jours à 400 en gardant les plus récents
  const dummyLog: ActivityLog = {};
  for (let i = 1; i <= 405; i++) {
    const d = new Date(2025, 0, i); // dates successives
    dummyLog[toDateKey(d)] = { seconds: i, lessonsCompleted: 1, xp: 10, exercisesDone: 1 };
  }
  const pruned = pruneActivityLog(dummyLog, 400);
  const prunedKeys = Object.keys(pruned);
  if (prunedKeys.length !== 400 || prunedKeys.includes('2025-01-01')) {
    throw new Error(`pruneActivityLog échoué: ${prunedKeys.length} clés`);
  }

  // 5. capSessionSeconds (cas de tests)
  if (
    capSessionSeconds(-10) !== 0 ||
    capSessionSeconds(0) !== 0 ||
    capSessionSeconds(600) !== 600 ||
    capSessionSeconds(1200) !== 1200 ||
    capSessionSeconds(2500) !== 1200
  ) {
    throw new Error('capSessionSeconds échoué');
  }
}

// ── Auto-vérification sous __DEV__ au chargement du module ────
if (__DEV__) {
  try {
    selfCheckActivityUtils();
    console.log('[activityLog selfCheck] OK');
  } catch (e) {
    console.error('[activityLog selfCheck] ÉCHOUÉ:', e);
  }
}
