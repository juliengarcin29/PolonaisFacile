// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch { return null; }
  },
  async set<T>(key: string, value: T): Promise<boolean> {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  async remove(key: string): Promise<boolean> {
    try { await AsyncStorage.removeItem(key); return true; }
    catch { return false; }
  },
  async getString(key: string, defaultVal = ''): Promise<string> {
    return (await this.get<string>(key)) ?? defaultVal;
  },
  async getBoolean(key: string, defaultVal = false): Promise<boolean> {
    return (await this.get<boolean>(key)) ?? defaultVal;
  },
};
