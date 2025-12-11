/**
 * ✅ Упрощенный useDailyNotifications.ts
 * Только запрос разрешений
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Конфигурация обработчика уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

export const useDailyNotifications = () => {
  useEffect(() => {
    const setupNotifications = async () => {
      if (Platform.OS === 'web') return;
      
      try {
        // Запрашиваем разрешения
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('🔔 Notification permission status:', status);
        
        // Настройка канала (Android)
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('daily-word', {
            name: 'Daily Word Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };
    
    setupNotifications();
  }, []);
};