/**
 * backgroundTasks.ts - Фоновые задачи для обновления слова дня
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { 
  updateDailyWord, 
  getDailyWordMeta,
  getDailyWord 
} from './dailyWordStorage';

const BACKGROUND_TASK_NAME = 'DAILY_WORD_UPDATE';

// Регистрация фоновой задачи
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('🔄 Running background task to check daily word...');
    
    const now = Date.now();
    const meta = await getDailyWordMeta();
    
    if (!meta) {
      console.log('No meta found in background task');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    const timeSinceUpdate = now - meta.lastUpdatedAt;
    const needsUpdate = timeSinceUpdate >= meta.intervalMs;
    
    if (needsUpdate) {
      console.log('📱 Background: Time to update daily word!');
      
      // Обновляем слово
      const newWord = await updateDailyWord(meta.intervalMs);
      
      if (newWord) {
        // Показываем уведомление
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🆕 Новое слово дня!',
            body: `Новое слово: ${newWord.word.toUpperCase()}`,
            data: { screen: 'Home', background: true },
            sound: true,
          },
          trigger: null, // Немедленно
        });
        
        console.log('✅ Background: Daily word updated and notification sent');
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    } else {
      console.log(`⏰ Background: Next update in ${Math.floor((meta.intervalMs - timeSinceUpdate) / 1000)}s`);
    }
    
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Регистрация фоновой задачи
export const registerBackgroundTask = async () => {
  try {
    // Отменяем предыдущую регистрацию
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    
    // Регистрируем заново
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60 * 15, // Минимум каждые 15 минут (ограничение iOS)
      stopOnTerminate: false,   // Продолжать после закрытия приложения
      startOnBoot: true,        // Запускать при загрузке устройства
    });
    
    console.log('✅ Background task registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering background task:', error);
    return false;
  }
};

// Проверка статуса фоновой задачи
export const checkBackgroundTaskStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    
    return { status, isRegistered };
  } catch (error) {
    console.error('Error checking background task:', error);
    return null;
  }
};