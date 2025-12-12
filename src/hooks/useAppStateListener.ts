/**
 * useAppStateListener.ts - Слушатель состояния приложения
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getDailyWordMeta, updateDailyWord } from '../utils/dailyWordStorage';
import * as Notifications from 'expo-notifications';

let lastCheckTime = 0;

export const useAppStateListener = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Защита от слишком частых проверок
        const now = Date.now();
        if (now - lastCheckTime < 10000) return; // Не проверяем чаще чем раз в 10 секунд
        
        lastCheckTime = now;
        
        try {
          // Проверяем, нужно ли обновить слово
          const meta = await getDailyWordMeta();
          if (!meta) return;
          
          const needsUpdate = Date.now() - meta.lastUpdatedAt >= meta.intervalMs;
          
            if (needsUpdate) {
            console.log('🔄 Updating daily word on app resume');

            // ✅ intervalMs обязателен
            const newWord = await updateDailyWord(meta.intervalMs);

            if (newWord) {
                await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🆕 Новое слово дня!',
                    body: `Новое слово: ${newWord.word.toUpperCase()}`,
                    data: { screen: 'Home' },
                    sound: true,
                },
                trigger: null,
                });
            }
            }
        } catch (error) {
          console.error('Error checking daily word on app resume:', error);
        }
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);
};