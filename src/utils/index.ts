// ============================================================
// src/utils/index.ts
// Utilitaires généraux — dates, chaînes, validation, formatage
// ============================================================

// ── DATES ────────────────────────────────────────────────────

export function formatDate(date: Date | string, locale = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(date: Date | string, locale = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

export function formatTime(date: Date | string, locale = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toDateString() === new Date().toDateString();
}

export function isYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

export function daysSince(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = 0
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} jours`;
  return formatDate(d);
}

// ── CHAÎNES ──────────────────────────────────────────────────

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// Normaliser le polonais pour la comparaison (enlever les diacritiques)
export function normalizePl(str: string): string {
  return str
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[.,!?;:"""]/g, '')
    .trim();
}

// Comparer deux réponses polonaises avec tolérance
export function comparePl(
  userAnswer: string,
  correct: string,
  strict = false,
): {
  isCorrect: boolean;
  similarity: number;
} {
  const normalize = (s: string) =>
    strict
      ? s.toLowerCase().trim()
      : normalizePl(s);

  const a = normalize(userAnswer);
  const b = normalize(correct);

  if (a === b) return { isCorrect: true, similarity: 1 };

  // Calcul de similarité simple (distance de Levenshtein simplifiée)
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return { isCorrect: true, similarity: 1 };

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] === longer[i]) matches++;
  }

  const similarity = matches / longer.length;
  const isCorrect = strict ? a === b : similarity >= 0.85;

  return { isCorrect, similarity };
}

// ── NOMBRES ──────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── VALIDATION ───────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 6) errors.push('6 caractères minimum');
  if (!/\d/.test(password)) errors.push('Au moins un chiffre');
  return { valid: errors.length === 0, errors };
}

// ── GAMIFICATION ─────────────────────────────────────────────

export function getXPForLevel(level: number): number {
  const levels = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
  return levels[level - 1] ?? levels[levels.length - 1];
}

export function getLevelFromXP(xp: number): number {
  const levels = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i]) return i + 1;
  }
  return 1;
}

export function getXPProgress(xp: number): {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  percentage: number;
} {
  const level = getLevelFromXP(xp);
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const currentXP = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const percentage = xpNeeded > 0 ? clamp((currentXP / xpNeeded) * 100, 0, 100) : 100;

  return { level, currentXP, xpForCurrentLevel, xpForNextLevel, percentage };
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 365) return '🏆';
  if (streak >= 100) return '💎';
  if (streak >= 30) return '🌟';
  if (streak >= 14) return '🔥';
  if (streak >= 7) return '⚡';
  if (streak >= 3) return '✨';
  if (streak >= 1) return '🌱';
  return '💤';
}

export function getRarityColor(rarity: 'common' | 'rare' | 'epic' | 'legendary'): string {
  const colors = {
    common: '#6B7280',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#D4AF37',
  };
  return colors[rarity] ?? colors.common;
}

// ── EXERCICES ────────────────────────────────────────────────

export function generateMultipleChoiceOptions(
  correct: string,
  allOptions: string[],
  count = 4,
): string[] {
  const wrong = allOptions
    .filter(o => o !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, count - 1);

  return shuffleArray([correct, ...wrong]);
}

export function scoreToGrade(score: number): {
  emoji: string;
  label: string;
  color: string;
} {
  if (score >= 95) return { emoji: '🏆', label: 'Parfait !', color: '#D4AF37' };
  if (score >= 80) return { emoji: '⭐', label: 'Excellent !', color: '#22C55E' };
  if (score >= 65) return { emoji: '👍', label: 'Bien !', color: '#3B82F6' };
  if (score >= 50) return { emoji: '💪', label: 'Pas mal !', color: '#F59E0B' };
  return { emoji: '📚', label: 'À réviser', color: '#EF4444' };
}

// ── COLORS ───────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function interpolateColor(
  color1: string,
  color2: string,
  factor: number,
): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(lerp(r1, r2, factor));
  const g = Math.round(lerp(g1, g2, factor));
  const b = Math.round(lerp(b1, b2, factor));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
