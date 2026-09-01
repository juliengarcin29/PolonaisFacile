// src/services/storage/cacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> { data: T; timestamp: number; ttl: number; }

class CacheService {
  private mem = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const mem = this.mem.get(key);
    if (mem && Date.now() - mem.timestamp < mem.ttl) return mem.data as T;
    try {
      const raw = await AsyncStorage.getItem(`cache_${key}`);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > entry.ttl) { await AsyncStorage.removeItem(`cache_${key}`); return null; }
      this.mem.set(key, entry);
      return entry.data;
    } catch { return null; }
  }

  async set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): Promise<void> {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
    this.mem.set(key, entry);
    try { await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry)); } catch { }
  }

  async invalidate(key: string): Promise<void> {
    this.mem.delete(key);
    try { await AsyncStorage.removeItem(`cache_${key}`); } catch { }
  }

  static TTL = { SHORT: 2*60*1000, MEDIUM: 15*60*1000, LONG: 60*60*1000, DAY: 24*60*60*1000 };
}

export const cacheService = new CacheService();
