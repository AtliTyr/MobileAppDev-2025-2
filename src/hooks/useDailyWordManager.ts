/**
 * ✅ ИСПРАВЛЕННЫЙ useDailyWordManager.ts v4
 * 
 * РЕШЕНИЯ ПРОБЛЕМ:
 * 1. ❌ УБРАНА дублирующаяся логика в checkAndUpdateWord
 * 2. ❌ УБРАНА отправка уведомления в инициализации
 * 3. ✅ Уведомление отправляется ТОЛЬКО при изменении даты/слова
 * 4. ✅ Дедупликация: проверяем хэш последнего отправленного уведомления
 * 5. ✅ DEBUG_MODE = false для продакшена
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  DailyWord,
  getDailyWord,
  updateDailyWord,
  getNextUpdateTime,
  forceNewDailyWord,
  getDailyWordMeta,
  getDailyWordDate,
} from '../utils/dailyWordStorage';

// === НАСТРОЙКИ ===
const DEBUG_MODE = false; // ← ДОЛЖНО БЫТЬ FALSE ДЛЯ ПРОДАКШЕНА!
const DEBUG_INTERVAL_MS = 15 * 1000; // 15 сек (только для тестирования)
const PRODUCTION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 часа

// === ДЕДУПЛИКАЦИЯ ===
const LAST_NOTIFIED_KEY = 'DAILY_WORD_LAST_NOTIFIED';

export const useDailyWordManager = () => {
  // 📦 СОСТОЯНИЕ
  const [dailyWord, setDailyWord] = useState<DailyWord | null>(null);
  const [nextUpdateTime, setNextUpdateTime] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔗 РЕФЫ
  const initialized = useRef(false);
  const appState = useRef(AppState.currentState);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef(0);
  const lastNotifiedWordRef = useRef<string | null>(null);

  // 🎯 Получить интервал
  const getCurrentInterval = useCallback(() => {
    return DEBUG_MODE ? DEBUG_INTERVAL_MS : PRODUCTION_INTERVAL_MS;
  }, []);

  // 🔔 ОТПРАВИТЬ УВЕДОМЛЕНИЕ (только если слово изменилось)
  const sendNotificationIfNeeded = useCallback(async (word: DailyWord) => {
    if (Platform.OS === 'web') return;

    // Дедупликация: не отправляем, если это слово уже был уведомлен
    if (lastNotifiedWordRef.current === word.wordId) {
      console.log('⏭️ Already notified about this word, skipping...');
      return;
    }

    try {
      console.log('📤 Sending notification for:', word.word);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🆕 Новое слово дня!',
          body: `Новое слово: ${word.word.toUpperCase()}`,
          data: {
            screen: 'Home',
            timestamp: Date.now(),
            wordId: word.wordId,
          },
          sound: 'default',
        },
        trigger: null, // ← НЕМЕДЛЕННО!
      });

      lastNotifiedWordRef.current = word.wordId;
      console.log('✅ Notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }, []);

  // 🔄 ОБНОВИТЬ СЛОВО И ОТПРАВИТЬ УВЕДОМЛЕНИЕ
  const updateAndNotify = useCallback(async () => {
    try {
      console.log('🔄 Updating daily word...');
      setLoading(true);

      const word = await updateDailyWord(getCurrentInterval());

      if (word) {
        setDailyWord(word);
        const nextTime = await getNextUpdateTime();
        setNextUpdateTime(nextTime);

        // Отправляем уведомление ТОЛЬКО при обновлении
        await sendNotificationIfNeeded(word);

        console.log(`✅ Daily word updated: ${word.word}`);
      }
    } catch (error) {
      console.error('❌ Error updating daily word:', error);
    } finally {
      setLoading(false);
    }
  }, [getCurrentInterval, sendNotificationIfNeeded]);

  // 🎯 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ
  const forceUpdateDailyWord = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Force updating daily word...');

      const word = await forceNewDailyWord();

      if (word) {
        setDailyWord(word);
        const nextTime = await getNextUpdateTime();
        setNextUpdateTime(nextTime);

        // Отправляем уведомление
        await sendNotificationIfNeeded(word);

        console.log(`✅ Daily word forced: ${word.word}`);
      }
    } catch (error) {
      console.error('❌ Error forcing daily word update:', error);
    } finally {
      setLoading(false);
    }
  }, [sendNotificationIfNeeded]);

  // ✅ ПРОВЕРИТЬ НУЖНО ЛИ ОБНОВИТЬ (ГЛАВНАЯ ЛОГИКА)
  const checkAndUpdateIfNeeded = useCallback(async () => {
    // Защита: не проверяем чаще чем раз в 2 секунды
    const now = Date.now();
    if (now - lastCheckRef.current < 2000) {
      return;
    }
    lastCheckRef.current = now;

    try {
      const meta = await getDailyWordMeta();
      if (!meta) {
        console.log('ℹ️ No meta found, initializing...');
        await updateAndNotify();
        return;
      }

      const currentTime = Date.now();
      const timeSinceUpdate = currentTime - meta.lastUpdatedAt;
      const needsUpdate = timeSinceUpdate >= meta.intervalMs;

      if (DEBUG_MODE) {
        console.log(
          `⏰ Check: ${Math.floor(timeSinceUpdate / 1000)}s / ${Math.floor(meta.intervalMs / 1000)}s`
        );
      }

      if (needsUpdate) {
        console.log('🚀 UPDATE NEEDED! Updating word...');
        await updateAndNotify();
      }
    } catch (error) {
      console.error('❌ Error checking for update:', error);
    }
  }, [updateAndNotify]);

  // 🚀 ИНИЦИАЛИЗАЦИЯ (ОДИН РАЗ)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        console.log('🚀 Initializing Daily Word Manager...');
        setLoading(true);

        // Загружаем текущее слово (без уведомления)
        const word = await getDailyWord();

        if (word) {
          setDailyWord(word);
          lastNotifiedWordRef.current = word.wordId;
          const nextTime = await getNextUpdateTime();
          setNextUpdateTime(nextTime);

          console.log(`📖 Current word: ${word.word}`);

          // Проверяем НУЖНО ЛИ обновить (если дата изменилась)
          // НО НЕ отправляем уведомление при инициализации!
          const currentDate = await getDailyWordDate();
          const today = new Date().toISOString().split('T')[0];

          if (currentDate !== today) {
            console.log('📅 Date changed! Updating word...');
            await updateAndNotify();
          }
        } else {
          // Если слова нет - создаем новое БЕЗ уведомления
          console.log('📖 No word found, creating new one...');
          const newWord = await updateDailyWord(getCurrentInterval());
          if (newWord) {
            setDailyWord(newWord);
            lastNotifiedWordRef.current = newWord.wordId;
            const nextTime = await getNextUpdateTime();
            setNextUpdateTime(nextTime);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Очистка при размонтировании
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [getCurrentInterval, updateAndNotify]);

  // ⏱️ ТАЙМЕР (обновление каждую сек)
  useEffect(() => {
    if (!dailyWord) return;

    const updateTimer = async () => {
      try {
        const nextTime = await getNextUpdateTime();
        setNextUpdateTime(nextTime);
      } catch (error) {
        console.error('⚠️ Timer update error:', error);
      }
    };

    updateTimer();

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [dailyWord]);

  // 🔍 ПЕРИОДИЧЕСКАЯ ПРОВЕРКА (не часто!)
  // В дебаге: каждые 15 сек
  // В продакшене: каждые 60 сек
  useEffect(() => {
    if (!dailyWord || loading) return;

    console.log('🔍 Starting periodic checks...');
    checkAndUpdateIfNeeded();

    const interval = DEBUG_MODE ? 15000 : 60000;
    checkIntervalRef.current = setInterval(() => {
      checkAndUpdateIfNeeded();
    }, interval);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [dailyWord, loading, checkAndUpdateIfNeeded]);

  // 📱 СЛУШАТЕЛЬ СОСТОЯНИЯ ПРИЛОЖЕНИЯ
  // При возобновлении - проверяем НЕМЕДЛЕННО
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('🚀 APP RESUMED! Checking for updates...');
        await checkAndUpdateIfNeeded();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription.remove();
  }, [checkAndUpdateIfNeeded]);

  return {
    dailyWord,
    nextUpdateTime,
    loading,
    forceUpdateDailyWord,
  };
};