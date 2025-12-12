import AsyncStorage from '@react-native-async-storage/async-storage';
import { builtInWordSets, WordData } from '../types/wordSets';

const DAILY_WORD_KEY = 'DAILY_WORD';
const DAILY_WORD_META_KEY = 'DAILY_WORD_META';

// ⚙️ НАСТРОЙКИ ИНТЕРВАЛА
const DEBUG_MODE = false;              // ← дебаг ВЫКЛ по умолчанию
const DEBUG_INTERVAL_MS = 20_000;      // 20 сек для тестов (можешь менять)
const DEFAULT_RESET_HOUR = 15;          // 07:00 локального времени

export interface DailyWord {
  word: string;
  wordId: string;
  setId: string;
  date: string;                        // 'YYYY-MM-DD' (дата, для которой это слово)
  found: boolean;
}

interface DailyWordMeta {
  lastUpdatedAt: number;               // timestamp последнего обновления
  intervalMs: number;
}

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

// Получить сегодняшнюю дату в формате 'YYYY-MM-DD'
const getTodayString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// timestamp следующего обновления (для таймера и дебага)
const getNextResetTimestampInternal = (): number => {
  if (DEBUG_MODE) {
    // в дебаг-режиме просто от текущего времени
    return Date.now() + DEBUG_INTERVAL_MS;
  }

  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setHours(DEFAULT_RESET_HOUR, 46, 0, 0);

  if (now >= nextReset) {
    // если уже после 07:00 — переносим на следующий день
    nextReset.setDate(nextReset.getDate() + 1);
  }

  return nextReset.getTime();
};

const shouldUpdateDailyWord = async (): Promise<boolean> => {
  try {
    const daily = await getDailyWord();
    const meta = await getDailyWordMeta();

    // если нет слова или меты — точно обновляем
    if (!daily || !meta) return true;

    if (DEBUG_MODE) {
      // дебаг: по таймеру в мс
      const now = Date.now();
      return now - meta.lastUpdatedAt >= DEBUG_INTERVAL_MS;
    }

    // прод: обновляем раз в сутки, когда дата изменилась
    const today = getTodayString();
    return daily.date !== today;
  } catch (e) {
    console.error('Error in shouldUpdateDailyWord:', e);
    return true;
  }
};

const generateNewDailyWord = (): DailyWord => {
  const randomSetIndex = Math.floor(Math.random() * builtInWordSets.length);
  const selectedSet = builtInWordSets[randomSetIndex];
  const randomWordIndex = Math.floor(
    Math.random() * selectedSet.words.length
  );
  const selectedWord = selectedSet.words[randomWordIndex];

  const today = getTodayString();

  return {
    word: selectedWord.word,
    wordId: selectedWord.id,
    setId: selectedSet.id,
    date: today,
    found: false,
  };
};

export const updateDailyWord = async (intervalMs: number): Promise<DailyWord | null> => {
  try {
    const mustUpdate = await shouldUpdateDailyWord();
    if (!mustUpdate) {
      const existing = await getDailyWord();
      if (existing) return existing;
    }

    const dailyWord = generateNewDailyWord();
    const now = Date.now();

    await AsyncStorage.setItem(DAILY_WORD_KEY, JSON.stringify(dailyWord));
    await setDailyWordMeta({
      lastUpdatedAt: now,
      intervalMs: DEBUG_MODE ? DEBUG_INTERVAL_MS : 24 * 60 * 60 * 1000,
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
    const nextAt = getNextResetTimestampInternal();
    const diffMs = Math.max(nextAt - Date.now(), 0);

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

export const forceNewDailyWord = async (): Promise<DailyWord | null> => {
  try {
    const dailyWord = generateNewDailyWord();
    const now = Date.now();

    await AsyncStorage.setItem(DAILY_WORD_KEY, JSON.stringify(dailyWord));
    await setDailyWordMeta({
      lastUpdatedAt: now,
      intervalMs: DEBUG_MODE ? DEBUG_INTERVAL_MS : 24 * 60 * 60 * 1000,
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

export const getNextUpdateTimestamp = async (): Promise<number | null> => {
  try {
    return getNextResetTimestampInternal();
  } catch (error) {
    console.error('Error getting next update timestamp:', error);
    return null;
  }
};