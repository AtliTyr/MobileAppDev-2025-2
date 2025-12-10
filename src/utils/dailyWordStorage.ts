import AsyncStorage from '@react-native-async-storage/async-storage';
import { builtInWordSets } from '../types/wordSets';

const DAILY_WORD_KEY = 'DAILY_WORD';
const DAILY_WORD_DATE_KEY = 'DAILY_WORD_DATE';
const RESET_HOUR = 7; // ⏰ Обновление в 07:00

export interface DailyWord {
  word: string;
  wordId: string;
  setId: string;
  date: string; // YYYY-MM-DD
  found: boolean;
}

// ✅ Получить слово дня
export const getDailyWord = async (): Promise<DailyWord | null> => {
  try {
    const stored = await AsyncStorage.getItem(DAILY_WORD_KEY);
    if (!stored) return null;
    const daily: DailyWord = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    
    // Если дата устарела, вернуть null
    if (daily.date !== today) return null;
    return daily;
  } catch (e) {
    console.error('Error getting daily word:', e);
    return null;
  }
};

// ✅ Установить слово дня (или обновить если прошло 24 часа)
export const updateDailyWord = async (): Promise<DailyWord | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Проверить, есть ли актуальное слово
    const existing = await getDailyWord();
    if (existing) {
      return existing;
    }
    
    // Выбрать случайный набор
    const randomSetIndex = Math.floor(Math.random() * builtInWordSets.length);
    const selectedSet = builtInWordSets[randomSetIndex];
    
    // Выбрать случайное слово из этого набора
    const randomWordIndex = Math.floor(Math.random() * selectedSet.words.length);
    const selectedWord = selectedSet.words[randomWordIndex];
    
    const dailyWord: DailyWord = {
      word: selectedWord.word,
      wordId: selectedWord.id,
      setId: selectedSet.id,
      date: today,
      found: false,
    };
    
    await AsyncStorage.setItem(DAILY_WORD_KEY, JSON.stringify(dailyWord));
    await AsyncStorage.setItem(DAILY_WORD_DATE_KEY, today);
    console.log('✅ Daily word updated:', dailyWord.word);
    return dailyWord;
  } catch (e) {
    console.error('Error updating daily word:', e);
    return null;
  }
};

// ✅ Отметить слово как найденное
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

// 🆕 ✨ Получить время до следующего обновления в формате HH:MM:SS
export const getNextUpdateTime = (): string => {
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setHours(RESET_HOUR, 0, 0, 0);
  
  // Если время обновления уже прошло сегодня, считаем на завтра
  if (now > nextReset) {
    nextReset.setDate(nextReset.getDate() + 1);
  }
  
  const diffMs = nextReset.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  
  return `${hh}:${mm}:${ss}`;
};

// ✅ Получить дату обновления
export const getDailyWordDate = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(DAILY_WORD_DATE_KEY);
  } catch (e) {
    console.error('Error getting daily word date:', e);
    return null;
  }
};

export const forceNewDailyWord = async (): Promise<DailyWord | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const randomSetIndex = Math.floor(Math.random() * builtInWordSets.length);
    const selectedSet = builtInWordSets[randomSetIndex];

    const randomWordIndex = Math.floor(Math.random() * selectedSet.words.length);
    const selectedWord = selectedSet.words[randomWordIndex];

    const dailyWord: DailyWord = {
      word: selectedWord.word,
      wordId: selectedWord.id,
      setId: selectedSet.id,
      date: today,
      found: false,
    };

    await AsyncStorage.setItem(DAILY_WORD_KEY, JSON.stringify(dailyWord));
    await AsyncStorage.setItem(DAILY_WORD_DATE_KEY, today);
    console.log('🐞 DEBUG: Daily word FORCED to:', dailyWord.word);
    return dailyWord;
  } catch (e) {
    console.error('Error forcing daily word:', e);
    return null;
  }
};
