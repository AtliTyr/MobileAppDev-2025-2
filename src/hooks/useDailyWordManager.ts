/**
 * 🎯 useDailyWordManager.ts - Управление словом дня с уведомлениями
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
} from '../utils/dailyWordStorage';

// === НАСТРОЙКИ ДЕБАГА ===
const DEBUG_MODE = true; // Включить для тестирования
const DEBUG_INTERVAL_MS = 30 * 1000; // 10 секунд для дебага
const PRODUCTION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 часа для продакшена
// ========================

export const useDailyWordManager = () => {
  const [dailyWord, setDailyWord] = useState<DailyWord | null>(null);
  const [nextUpdateTime, setNextUpdateTime] = useState('');
  const [loading, setLoading] = useState(true);
  
  const initialized = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationTime = useRef<number>(0);
  const appState = useRef(AppState.currentState);
  const lastCheckTime = useRef<number>(0);

  // Получаем текущий интервал
  const getCurrentInterval = useCallback(() => {
    return DEBUG_MODE ? DEBUG_INTERVAL_MS : PRODUCTION_INTERVAL_MS;
  }, []);

  // Инициализация при первом запуске
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // Загружаем текущее слово
        const word = await getDailyWord();
        setDailyWord(word);
        
        if (word) {
          const nextTime = await getNextUpdateTime();
          setNextUpdateTime(nextTime);
        } else {
          // Если слова нет, создаем новое
          await refreshDailyWord(false); // false = без уведомления при инициализации
        }
      } catch (error) {
        console.error('Error initializing daily word:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [getCurrentInterval]);

  // Обновление таймера каждую секунду
  useEffect(() => {
    if (!dailyWord) return;

    const updateTimer = async () => {
      const nextTime = await getNextUpdateTime();
      setNextUpdateTime(nextTime);
    };

    // Обновляем сразу
    updateTimer();
    
    // И затем каждую секунду
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [dailyWord]);

  // Функция для периодической проверки обновления
  const setupUpdateChecker = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    checkIntervalRef.current = setInterval(async () => {
      try {
        const meta = await getDailyWordMeta();
        if (!meta) return;

        const now = Date.now();
        const timeSinceUpdate = now - meta.lastUpdatedAt;
        
        // Для дебага проверяем чаще, для продакшена - реже
        const checkInterval = DEBUG_MODE ? 1000 : 30000; // 1 сек для дебага, 30 сек для прода
        const shouldCheck = now - lastCheckTime.current > checkInterval;
        
        if (!shouldCheck) return;
        
        lastCheckTime.current = now;
        
        // Проверяем, нужно ли обновить слово
        if (timeSinceUpdate >= meta.intervalMs) {
          console.log('⏰ Время обновить слово дня!');
          await refreshDailyWord(true);
        }
      } catch (error) {
        console.error('Error in update checker:', error);
      }
    }, 1000); // Проверяем каждую секунду, но логика внутри решает, когда именно выполнять проверку
  }, [DEBUG_MODE]);

  // Запускаем проверку обновлений
  useEffect(() => {
    if (!dailyWord || loading) return;
    
    setupUpdateChecker();
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [dailyWord, loading, setupUpdateChecker]);

  // Слушатель состояния приложения
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed from', appState.current, 'to', nextAppState);
      
      // При возвращении в активное состояние проверяем обновление
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 App became active, checking for updates...');
        await checkAndUpdateWord();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Функция проверки и обновления слова
  const checkAndUpdateWord = useCallback(async () => {
    try {
      const meta = await getDailyWordMeta();
      if (!meta) return;

      const now = Date.now();
      const needsUpdate = now - meta.lastUpdatedAt >= meta.intervalMs;

      if (needsUpdate) {
        console.log('🔄 Auto-updating daily word on app resume...');
        await refreshDailyWord(true);
      }
    } catch (error) {
      console.error('Error checking for update:', error);
    }
  }, []);

  // Функция обновления слова
  const refreshDailyWord = useCallback(async (showNotification = true) => {
    try {
      setLoading(true);
      const word = await updateDailyWord(getCurrentInterval());
      setDailyWord(word);
      
      if (word) {
        const nextTime = await getNextUpdateTime();
        setNextUpdateTime(nextTime);
        
        // Защита от спама: не показываем уведомление чаще чем раз в 5 секунд
        const now = Date.now();
        if (showNotification && now - lastNotificationTime.current > 5000) {
          lastNotificationTime.current = now;
          
          if (Platform.OS !== 'web') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🆕 Новое слово дня!',
                body: `Новое слово: ${word.word.toUpperCase()}`,
                data: { screen: 'Home' },
                sound: true,
              },
              trigger: null,
            });
            console.log('🔔 Notification sent');
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing daily word:', error);
    } finally {
      setLoading(false);
    }
  }, [getCurrentInterval]);

  // Принудительное обновление
  const forceUpdateDailyWord = useCallback(async () => {
    try {
      setLoading(true);
      const word = await forceNewDailyWord(getCurrentInterval());
      setDailyWord(word);
      
      if (word) {
        const nextTime = await getNextUpdateTime();
        setNextUpdateTime(nextTime);
        
        // Всегда показываем уведомление при принудительном обновлении
        if (Platform.OS !== 'web') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🔄 Слово дня принудительно обновлено!',
              body: `Новое слово: ${word.word.toUpperCase()}`,
              data: { screen: 'Home' },
              sound: true,
            },
            trigger: null,
          });
        }
      }
    } catch (error) {
      console.error('Error forcing daily word update:', error);
    } finally {
      setLoading(false);
    }
  }, [getCurrentInterval]);

  return {
    dailyWord,
    nextUpdateTime,
    loading,
    refreshDailyWord,
    forceUpdateDailyWord,
    checkAndUpdateWord,
  };
};