/**
 * ✅ МИНИМАЛИСТИЧНЫЙ backgroundTasks.ts
 * 
 * НОВЫЙ ПОДХОД:
 * - НЕ полагаемся на minimumInterval (система игнорирует)
 * - ТОЛЬКО пытаемся обновить слово при срабатывании
 * - Основная работа в useDailyWordManager_v3.ts (частые проверки)
 * 
 * Background-fetch = только подстраховка!
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import {
  updateDailyWord,
  getDailyWordMeta,
} from './dailyWordStorage';

const BACKGROUND_TASK_NAME = 'DAILY_WORD_UPDATE';

// Регистрация фоновой задачи
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('🔄 [BACKGROUND] Task triggered by system');
    
    const now = Date.now();
    const meta = await getDailyWordMeta();

    if (!meta) {
      console.log('ℹ️ [BACKGROUND] No meta found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const timeSinceUpdate = now - meta.lastUpdatedAt;
    const needsUpdate = timeSinceUpdate >= meta.intervalMs;

    if (needsUpdate) {
      console.log('✅ [BACKGROUND] Update needed! Updating...');
      
      const newWord = await updateDailyWord(meta.intervalMs);

      if (newWord) {
        // Отправляем немедленно (trigger: null)
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🆕 Новое слово дня!',
              body: `Новое слово: ${newWord.word.toUpperCase()}`,
              data: { source: 'background_task', timestamp: Date.now() },
              sound: 'default',
            },
            trigger: null, // ← КРИТИЧНО: немедленная отправка!
          });
          console.log('🔔 [BACKGROUND] Notification sent');
        } catch (notifError) {
          console.error('[BACKGROUND] Notification error:', notifError);
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    } else {
      const timeUntil = meta.intervalMs - timeSinceUpdate;
      console.log(
        `⏳ [BACKGROUND] Next update in ${Math.floor(timeUntil / 1000)}s`
      );
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BACKGROUND] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Регистрация задачи
export const registerBackgroundTask = async () => {
  try {
    // Безопасная проверка перед отменой
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TASK_NAME
    );

    if (isRegistered) {
      try {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
        console.log('ℹ️ [BACKGROUND] Previous task unregistered');
      } catch (e) {
        console.warn('[BACKGROUND] Could not unregister:', e);
      }
    }

    // Регистрируем с минимальным интервалом
    // ВАЖНО: это только рекомендация, система может игнорировать!
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60 * 15, // iOS требует минимум 15 мин
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('✅ [BACKGROUND] Task registered successfully');
    return true;
  } catch (error) {
    console.error('❌ [BACKGROUND] Registration error:', error);
    return false;
  }
};

// Проверка статуса
export const checkBackgroundTaskStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TASK_NAME
    );

    console.log('📊 [BACKGROUND] Status:', {
      registered: isRegistered,
      status: status,
    });

    return { status, isRegistered };
  } catch (error) {
    console.error('❌ [BACKGROUND] Status check error:', error);
    return null;
  }
};

// Отмена регистрации
export const unregisterBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TASK_NAME
    );

    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      console.log('✅ [BACKGROUND] Task unregistered');
      return true;
    }

    console.log('ℹ️ [BACKGROUND] Task not registered');
    return false;
  } catch (error) {
    console.error('❌ [BACKGROUND] Unregister error:', error);
    return false;
  }
};