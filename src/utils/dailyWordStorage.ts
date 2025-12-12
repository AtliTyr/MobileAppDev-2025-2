/**
 * ✅ ИСПРАВЛЕННЫЙ dailyWordStorage.ts
 * 
 * Добавлен export для getDailyWordMeta
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { builtInWordSets, WordData } from '../types/wordSets';

const DAILY_WORD_KEY = 'DAILY_WORD';

const DAILY_WORD_META_KEY = 'DAILY_WORD_META';

const DEFAULT_INTERVAL_MS = 10 * 1000;
// const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

const DEFAULT_RESET_HOUR = 7;

export interface DailyWord {
  word: string;
  wordId: string;
  setId: string;
  date: string;
  found: boolean;
}

interface DailyWordMeta {
  lastUpdatedAt: number;
  intervalMs: number;
}

/**
 * ✅ ТЕПЕРЬ ЭКСПОРТИРУЕТСЯ!
 */
export const getDailyWordMeta = async (): Promise<DailyWordMeta | null> => {
  try {
    const stored = await AsyncStorage.getItem(DAILY_WORD_META_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as DailyWordMeta;
  } catch (e) {
    console.error('Error getting daily word meta:', e);
    return null;
  }
};

const setDailyWordMeta = async (meta: DailyWordMeta): Promise<void> => {
  try {
    await AsyncStorage.setItem(DAILY_WORD_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Error setting daily word meta:', e);
  }
};

export const getDailyWord = async (): Promise<DailyWord | null> => {
  try {
    const stored = await AsyncStorage.getItem(DAILY_WORD_KEY);
    if (!stored) return null;
    const daily: DailyWord = JSON.parse(stored);
    return daily;
  } catch (e) {
    console.error('Error getting daily word:', e);
    return null;
  }
};

const shouldUpdateDailyWord = async (intervalMs?: number): Promise<boolean> => {
  try {
    const meta = await getDailyWordMeta();
    const now = Date.now();
    const effectiveInterval = intervalMs ?? meta?.intervalMs ?? DEFAULT_INTERVAL_MS;
    if (!meta) {
      return true;
    }
    const diff = now - meta.lastUpdatedAt;
    return diff >= effectiveInterval;
  } catch (e) {
    console.error('Error in shouldUpdateDailyWord:', e);
    return true;
  }
};

const generateNewDailyWord = (): DailyWord => {
  const randomSetIndex = Math.floor(Math.random() * builtInWordSets.length);
  const selectedSet = builtInWordSets[randomSetIndex];
  const randomWordIndex = Math.floor(Math.random() * selectedSet.words.length);
  const selectedWord = selectedSet.words[randomWordIndex];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  return {
    word: selectedWord.word,
    wordId: selectedWord.id,
    setId: selectedSet.id,
    date: today,
    found: false,
  };
};

export const updateDailyWord = async (
  intervalMs?: number
): Promise<DailyWord | null> => {
  try {
    const mustUpdate = await shouldUpdateDailyWord(intervalMs);
    if (!mustUpdate) {
      const existing = await getDailyWord();
      if (existing) return existing;
    }
    const dailyWord = generateNewDailyWord();
    const now = Date.now();
    await AsyncStorage.setItem(DAILY_WORD_KEY, JSON.stringify(dailyWord));
    await setDailyWordMeta({
      lastUpdatedAt: now,
      intervalMs: intervalMs ?? DEFAULT_INTERVAL_MS,
    });
    console.log('✅ Daily word updated:', dailyWord.word);
    return dailyWord;
  } catch (e) {
    console.error('Error updating daily word:', e);
    return null;
  }
};

export const markDailyWordFound = async (): Promise<void> => {
  try {
    const daily = await getDailyWord();
    if (daily) {
      daily.found = true;
      await AsyncStorage.setItem(DAILY_WORD_KEY, JSON.stringify(daily));
    }
  } catch (e) {
    console.error('Error marking daily word found:', e);
  }
};

export const getNextUpdateTime = async (): Promise<string> => {
  try {
    const meta = await getDailyWordMeta();
    const now = Date.now();
    if (meta) {
      const nextAt = meta.lastUpdatedAt + meta.intervalMs;
      const diffMs = Math.max(nextAt - now, 0);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    const nowDate = new Date();
    const nextReset = new Date(nowDate);
    nextReset.setHours(DEFAULT_RESET_HOUR, 0, 0, 0);
    if (nowDate > nextReset) {
      nextReset.setDate(nextReset.getDate() + 1);
    }
    const diffMs = nextReset.getTime() - nowDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch (e) {
    console.error('Error getting next update time:', e);
    return '00:00:00';
  }
};

export const getDailyWordDate = async (): Promise<string | null> => {
  try {
    const daily = await getDailyWord();
    return daily?.date ?? null;
  } catch (e) {
    console.error('Error getting daily word date:', e);
    return null;
  }
};

export const forceNewDailyWord = async (
  intervalMs?: number
): Promise<DailyWord | null> => {
  try {
    const dailyWord = generateNewDailyWord();
    const now = Date.now();
    await AsyncStorage.setItem(DAILY_WORD_KEY, JSON.stringify(dailyWord));
    await setDailyWordMeta({
      lastUpdatedAt: now,
      intervalMs: intervalMs ?? DEFAULT_INTERVAL_MS,
    });
    console.log('🐞 DEBUG: Daily word FORCED to:', dailyWord.word);
    return dailyWord;
  } catch (e) {
    console.error('Error forcing daily word:', e);
    return null;
  }
};

export const getDailyWordAsWordData = async (): Promise<WordData | null> => {
  try {
    const stored = await AsyncStorage.getItem(DAILY_WORD_KEY);
    if (!stored) return null;
    const daily: DailyWord = JSON.parse(stored);
    const set = builtInWordSets.find(s => s.id === daily.setId);
    if (!set) return null;
    const word = set.words.find(w => w.id === daily.wordId);
    return word ?? null;
  } catch (e) {
    console.error('Error converting daily word to WordData:', e);
    return null;
  }
};

export const checkIfUpdateNeeded = async (): Promise<boolean> => {
  try {
    const meta = await getDailyWordMeta();
    if (!meta) return true;
    
    const now = Date.now();
    return now - meta.lastUpdatedAt >= meta.intervalMs;
  } catch (error) {
    console.error('Error checking if update needed:', error);
    return true;
  }
};

// Функция для получения точного времени следующего обновления
export const getNextUpdateTimestamp = async (): Promise<number | null> => {
  try {
    const meta = await getDailyWordMeta();
    if (!meta) return null;
    
    return meta.lastUpdatedAt + meta.intervalMs;
  } catch (error) {
    console.error('Error getting next update timestamp:', error);
    return null;
  }
};