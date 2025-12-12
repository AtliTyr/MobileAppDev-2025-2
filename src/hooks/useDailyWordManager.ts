/**
 * 🎯 useDailyWordManager.ts - Управление словом дня с фоновыми уведомлениями
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
  getNextUpdateTimestamp,
} from '../utils/dailyWordStorage';
import { registerBackgroundTask } from '../utils/backgroundTasks';

// === НАСТРОЙКИ ДЕБАГА ===
const DEBUG_MODE = false; // Включить для тестирования
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
  const scheduledNotificationId = useRef<string | null>(null);
  const appState = useRef(AppState.currentState);

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
        // Регистрируем фоновую задачу
        if (Platform.OS !== 'web') {
          await registerBackgroundTask();
        }

        // Загружаем текущее слово
        const word = await getDailyWord();
        setDailyWord(word);
        
        if (word) {
          const nextTime = await getNextUpdateTime();
          setNextUpdateTime(nextTime);
          
          // Планируем уведомление на время обновления
          await scheduleNotificationForNextUpdate();
        } else {
          // Если слова нет, создаем новое
          await refreshDailyWord(false);
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

  // Планирование уведомления на время следующего обновления
  const scheduleNotificationForNextUpdate = useCallback(async () => {
    if (Platform.OS === 'web') return;
    
    try {
      // Отменяем предыдущее запланированное уведомление
      if (scheduledNotificationId.current) {
        await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId.current);
      }
      
      const nextUpdateTimestamp = await getNextUpdateTimestamp();
      if (!nextUpdateTimestamp) return;
      
      const now = Date.now();
      const timeUntilNext = nextUpdateTimestamp - now;
      
      if (timeUntilNext > 0) {
        // Планируем уведомление точно на время обновления
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '🆕 Новое слово дня!',
                body: 'Готово новое слово. Играй прямо сейчас!',
                data: { screen: 'Home', scheduled: true },
                sound: true,
            },
            trigger: {
                type: 'date',
                date: new Date(nextUpdateTimestamp),
            } as Notifications.DateTriggerInput,
        });
        
        scheduledNotificationId.current = notificationId;
        console.log(`⏰ Notification scheduled for ${new Date(nextUpdateTimestamp).toLocaleTimeString()}`);
      }
    } catch (error) {
      console.error('Error scheduling notification for next update:', error);
    }
  }, []);

  // Настройка проверки обновлений
  useEffect(() => {
    if (!dailyWord) return;

    const checkForUpdate = async () => {
      try {
        const meta = await getDailyWordMeta();
        if (!meta) return;

        const now = Date.now();
        const needsUpdate = now - meta.lastUpdatedAt >= meta.intervalMs;

        if (needsUpdate && !loading) {
          console.log('🔄 Auto-updating daily word in background check...');
          await refreshDailyWord(true);
        }
      } catch (error) {
        console.error('Error checking for update:', error);
      }
    };

    // Проверяем каждые 5 секунд в дебаг-режиме, каждые 30 секунд в продакшене
    const interval = DEBUG_MODE ? 5000 : 30000;
    checkForUpdate();
    checkIntervalRef.current = setInterval(checkForUpdate, interval);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [dailyWord, loading]);

  // Слушатель состояния приложения
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed from', appState.current, 'to', nextAppState);
      
      // При возвращении в активное состояние
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
        
        // Планируем следующее уведомление
        await scheduleNotificationForNextUpdate();
        
        // Показываем немедленное уведомление
        if (showNotification && Platform.OS !== 'web') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🆕 Новое слово дня!',
              body: `Новое слово: ${word.word.toUpperCase()}`,
              data: { screen: 'Home', immediate: true },
              sound: true,
            },
            trigger: null, // Немедленно
          });
          console.log('🔔 Immediate notification sent');
        }
      }
    } catch (error) {
      console.error('Error refreshing daily word:', error);
    } finally {
      setLoading(false);
    }
  }, [getCurrentInterval, scheduleNotificationForNextUpdate]);

  // Принудительное обновление
  const forceUpdateDailyWord = useCallback(async () => {
    try {
      setLoading(true);
      const word = await forceNewDailyWord(getCurrentInterval());
      setDailyWord(word);
      
      if (word) {
        const nextTime = await getNextUpdateTime();
        setNextUpdateTime(nextTime);
        
        // Планируем следующее уведомление
        await scheduleNotificationForNextUpdate();
        
        // Показываем уведомление о принудительном обновлении
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
  }, [getCurrentInterval, scheduleNotificationForNextUpdate]);

  return {
    dailyWord,
    nextUpdateTime,
    loading,
    refreshDailyWord,
    forceUpdateDailyWord,
    checkAndUpdateWord,
  };
};