// ============================================================
// src/utils/network.ts
// Détection réseau + logique de retry
// ============================================================

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NetworkStatus = 'online' | 'offline' | 'unknown';

class NetworkService {
  private status: NetworkStatus = 'unknown';
  private listeners: Array<(status: NetworkStatus) => void> = [];

  constructor() {
    NetInfo.addEventListener(this.handleChange.bind(this));
  }

  private handleChange(state: NetInfoState) {
    const newStatus: NetworkStatus = state.isConnected ? 'online' : 'offline';
    if (newStatus !== this.status) {
      this.status = newStatus;
      this.listeners.forEach(fn => fn(newStatus));
    }
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  onStatusChange(fn: (status: NetworkStatus) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  async fetch<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
    retries = 3,
    delayMs = 1000,
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (e: any) {
        const isNetworkError =
          e?.message?.includes('network') ||
          e?.message?.includes('fetch') ||
          e?.code === 'unavailable';

        if (isNetworkError && fallback) return fallback();
        if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        if (i === retries - 1) throw e;
      }
    }
    throw new Error('Max retries reached');
  }

  async checkConnectivity(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.status = state.isConnected ? 'online' : 'offline';
    return state.isConnected ?? false;
  }
}

export const networkService = new NetworkService();


// ============================================================
// src/utils/storage.ts
// Wrapper AsyncStorage typé avec gestion d'erreurs
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  async has(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch {
      return false;
    }
  },

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return pairs.reduce((acc, [key, value]) => {
        acc[key] = value ? JSON.parse(value) : null;
        return acc;
      }, {} as Record<string, T | null>);
    } catch {
      return {};
    }
  },

  async setMultiple(entries: Record<string, any>): Promise<boolean> {
    try {
      const pairs: [string, string][] = Object.entries(entries).map(
        ([k, v]) => [k, JSON.stringify(v)]
      );
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch {
      return false;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      return [...(await AsyncStorage.getAllKeys())];
    } catch {
      return [];
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch {
      return false;
    }
  },

  // ── Helpers spécialisés ──────────────────────────────────
  async getNumber(key: string, defaultVal = 0): Promise<number> {
    const val = await this.get<number>(key);
    return val ?? defaultVal;
  },

  async getString(key: string, defaultVal = ''): Promise<string> {
    const val = await this.get<string>(key);
    return val ?? defaultVal;
  },

  async getBoolean(key: string, defaultVal = false): Promise<boolean> {
    const val = await this.get<boolean>(key);
    return val ?? defaultVal;
  },

  async increment(key: string, by = 1): Promise<number> {
    const current = await this.getNumber(key, 0);
    const next = current + by;
    await this.set(key, next);
    return next;
  },
};


// ============================================================
// src/utils/polish.ts
// Helpers spécifiques à la langue polonaise
// ============================================================

// ── Phonétique simplifiée pour les francophones ──────────────
const POLISH_TO_FRENCH_PHONETICS: Record<string, string> = {
  'ą': 'on (nasal)',
  'ę': 'é (nasal)',
  'ó': 'ou',
  'ł': 'w',
  'ż': 'j (dur)',
  'ź': 'j (doux)',
  'ś': 'ch (doux)',
  'ć': 'tch (doux)',
  'ń': 'gn',
  'sz': 'ch',
  'cz': 'tch',
  'rz': 'j (dur)',
  'dz': 'dz',
  'dź': 'dj (doux)',
  'dż': 'dj (dur)',
  'ch': 'h (aspiré)',
  'j': 'y',
  'w': 'v',
  'c': 'ts',
};

// Explication phonétique simplifiée pour l'affichage
export function explainPronunciation(letter: string): string {
  return POLISH_TO_FRENCH_PHONETICS[letter.toLowerCase()] ?? letter;
}

// ── Règles d'accent ──────────────────────────────────────────
export function getStressedSyllable(word: string): number {
  const syllables = countSyllables(word);
  // Règle générale : avant-dernière syllabe (pénultième)
  return Math.max(0, syllables - 2);
}

export function countSyllables(word: string): number {
  const vowels = 'aąeęioóuy';
  let count = 0;
  let prevWasVowel = false;

  for (const char of word.toLowerCase()) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }
  return Math.max(1, count);
}

// ── Genre des noms ───────────────────────────────────────────
export type PolishGender = 'masculine' | 'feminine' | 'neuter' | 'unknown';

export function guessGender(noun: string): PolishGender {
  const lower = noun.toLowerCase();

  // Neutre : finit en -o, -e, -ę, -um
  if (/[oe]$/.test(lower) || lower.endsWith('ę') || lower.endsWith('um')) {
    return 'neuter';
  }
  // Féminin : finit en -a, -i, -ość, -ść
  if (lower.endsWith('a') || lower.endsWith('i') ||
      lower.endsWith('ość') || lower.endsWith('ść')) {
    return 'feminine';
  }
  // Masculin : finit en consonne
  if (/[bcdfghjklmnprstwzżźćśłń]$/.test(lower)) {
    return 'masculine';
  }
  return 'unknown';
}

// ── Conjugaison rapide ────────────────────────────────────────
export function conjugateVerb(
  infinitive: string,
  person: 'ja' | 'ty' | 'on' | 'my' | 'wy' | 'oni',
): string {
  // Verbes en -ać (type 1 : pracować → pracuję)
  if (infinitive.endsWith('ować')) {
    const stem = infinitive.slice(0, -4) + 'uj';
    const endings = { ja: 'ę', ty: 'esz', on: 'e', my: 'emy', wy: 'ecie', oni: 'ą' };
    return stem + endings[person];
  }
  // Verbes en -ić/-yć (type 2 : mówić → mówię)
  if (infinitive.endsWith('ić') || infinitive.endsWith('yć')) {
    const stem = infinitive.slice(0, -2);
    const endings = { ja: 'ię', ty: 'isz', on: 'i', my: 'imy', wy: 'icie', oni: 'ią' };
    return stem + endings[person];
  }
  // Verbes en -ać simple (typ : czytać → czytam)
  if (infinitive.endsWith('ać')) {
    const stem = infinitive.slice(0, -2);
    const endings = { ja: 'm', ty: 'sz', on: '', my: 'my', wy: 'cie', oni: 'ją' };
    return stem + endings[person];
  }
  return infinitive; // fallback
}

// ── Déclinaison simplifiée du génitif ────────────────────────
export function toGenitive(noun: string, gender: PolishGender): string {
  switch (gender) {
    case 'masculine':
      // Animé → -a, inanimé → -u (règle simplifiée)
      if (/[kgch]$/.test(noun)) return noun + 'u';
      return noun + 'a';
    case 'feminine':
      if (noun.endsWith('a')) return noun.slice(0, -1) + 'y';
      if (noun.endsWith('ia')) return noun.slice(0, -2) + 'i';
      return noun + 'i';
    case 'neuter':
      if (noun.endsWith('o')) return noun.slice(0, -1) + 'a';
      if (noun.endsWith('e')) return noun.slice(0, -1) + 'a';
      return noun + 'a';
    default:
      return noun;
  }
}

// ── Alphabet polonais avec descriptions ──────────────────────
export const POLISH_ALPHABET = [
  { letter: 'A', sound: 'a', note: 'Comme en français' },
  { letter: 'Ą', sound: 'ɔ̃', note: 'Comme "on" nasal' },
  { letter: 'B', sound: 'b', note: 'Comme en français' },
  { letter: 'C', sound: 'ts', note: 'Comme "ts" dans "tsar"' },
  { letter: 'Ć', sound: 'tɕ', note: '"tch" très doux' },
  { letter: 'D', sound: 'd', note: 'Comme en français' },
  { letter: 'E', sound: 'ɛ', note: 'Comme "è"' },
  { letter: 'Ę', sound: 'ɛ̃', note: 'Comme "in" nasal (nasal devant consonne)' },
  { letter: 'F', sound: 'f', note: 'Comme en français' },
  { letter: 'G', sound: 'ɡ', note: 'Toujours dur (comme "gare")' },
  { letter: 'H', sound: 'x', note: 'Comme "j" espagnol / "ch" allemand' },
  { letter: 'I', sound: 'i', note: 'Comme "i" français' },
  { letter: 'J', sound: 'j', note: 'Comme "y" dans "yeux"' },
  { letter: 'K', sound: 'k', note: 'Comme en français' },
  { letter: 'L', sound: 'l', note: 'Comme en français' },
  { letter: 'Ł', sound: 'w', note: 'Comme "w" anglais dans "water"' },
  { letter: 'M', sound: 'm', note: 'Comme en français' },
  { letter: 'N', sound: 'n', note: 'Comme en français' },
  { letter: 'Ń', sound: 'ɲ', note: 'Comme "gn" dans "agneau"' },
  { letter: 'O', sound: 'ɔ', note: 'Comme "o" ouvert' },
  { letter: 'Ó', sound: 'u', note: 'Comme "ou" français' },
  { letter: 'P', sound: 'p', note: 'Comme en français' },
  { letter: 'R', sound: 'r', note: 'R roulé (comme en espagnol)' },
  { letter: 'S', sound: 's', note: 'Toujours sourd (comme "sel")' },
  { letter: 'Ś', sound: 'ɕ', note: '"ch" très doux' },
  { letter: 'T', sound: 't', note: 'Comme en français' },
  { letter: 'U', sound: 'u', note: 'Comme "ou" français' },
  { letter: 'W', sound: 'v', note: 'Comme "v" français' },
  { letter: 'Y', sound: 'ɨ', note: 'Entre "i" et "u" — unique au polonais' },
  { letter: 'Z', sound: 'z', note: 'Comme en français' },
  { letter: 'Ź', sound: 'ʑ', note: '"j" très doux' },
  { letter: 'Ż', sound: 'ʐ', note: '"j" dur (comme en français)' },
];

// ── Digrammes polonais ────────────────────────────────────────
export const POLISH_DIGRAPHS = [
  { digraph: 'sz', sound: 'ʂ', note: 'Comme "ch" français' },
  { digraph: 'cz', sound: 'tʂ', note: 'Comme "tch"' },
  { digraph: 'rz', sound: 'ʐ', note: 'Comme "j" français (= ż)' },
  { digraph: 'ch', sound: 'x', note: 'Comme "h" aspiré (= h)' },
  { digraph: 'dz', sound: 'dz', note: 'Comme "dz" dans "adze"' },
  { digraph: 'dź', sound: 'dʑ', note: '"dj" doux' },
  { digraph: 'dż', sound: 'dʐ', note: '"dj" dur' },
];

// ── Expressions de politesse par situation ───────────────────
export const POLITENESS_GUIDE = {
  formal: {
    male: { greeting: 'Dzień dobry', address: 'pan', pronoun: 'pan' },
    female: { greeting: 'Dzień dobry', address: 'pani', pronoun: 'pani' },
  },
  informal: {
    greeting: 'Cześć',
    address: 'ty',
    pronoun: 'ty',
  },
  note: 'En polonais, on utilise "pan" (M) / "pani" (F) comme équivalent du "vous" de politesse. Ce n\'est pas un pronom mais un nom !',
};
