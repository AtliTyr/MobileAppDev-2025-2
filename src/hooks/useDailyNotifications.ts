/**
 * ✅ ИСПРАВЛЕННЫЙ useDailyNotifications.ts
 * 
 * ЗАДАЧИ:
 * 1. Настройка разрешений уведомлений (ОДИН РАЗ)
 * 2. Создание канала для Android
 * 3. Регистрация обработчика (НЕ отправка!)
 * 
 * ОТПРАВКА происходит в useDailyWordManager.ts
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Конфигурация обработчика уведомлений (для переднего плана)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useDailyNotifications = () => {
  const setupDoneRef = useRef(false);

  useEffect(() => {
    const setupNotifications = async () => {
      // Защита от повторной регистрации
      if (setupDoneRef.current) return;
      
      if (Platform.OS === 'web') {
        console.log('ℹ️ Notifications skipped on web platform');
        return;
      }

      try {
        // 1️⃣ Запрашиваем разрешения (ОДИН РАЗ)
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('🔔 Notification permission status:', status);

        if (status !== 'granted') {
          console.warn(
            '⚠️ Notification permissions not granted. User may not receive notifications.'
          );
          return;
        }

        // 2️⃣ Настройка канала для Android (ОДИН РАЗ)
        if (Platform.OS === 'android') {
          try {
            await Notifications.setNotificationChannelAsync('daily-word', {
              name: 'Daily Word Updates',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
              sound: 'default',
              enableVibrate: true,
              enableLights: true,
              bypassDnd: true, // Обойти режим "не беспокоить"
            });
            console.log('✅ Notification channel "daily-word" created');
          } catch (channelError) {
            console.error('Error creating notification channel:', channelError);
          }
        }

        console.log('✅ Notifications setup complete');
        setupDoneRef.current = true;

      } catch (error) {
        console.error('❌ Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, []); // ПУСТО! Выполняется ОДИН РАЗ при монтировании
};