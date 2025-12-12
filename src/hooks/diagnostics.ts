/**
 * 🔍 ДИАГНОСТИЧЕСКИЙ СКРИПТ
 * 
 * Используйте этот файл в компоненте для проверки статуса уведомлений
 * Импортируйте и вызовите при нужде для дебага
 */

import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import {
  getDailyWord,
  getDailyWordMeta,
  getNextUpdateTimestamp,
} from '../utils/dailyWordStorage';

const BACKGROUND_TASK_NAME = 'DAILY_WORD_UPDATE';

/**
 * Проверить статус уведомлений
 */
export const diagnosticNotifications = async () => {
  console.log('\n=== 🔍 ДИАГНОСТИКА УВЕДОМЛЕНИЙ ===\n');

  try {
    // 1. Проверить разрешения
    console.log('1️⃣  РАЗРЕШЕНИЯ:');
    const permissions = await Notifications.getPermissionsAsync();
    console.log(`   Status: ${permissions.status}`);
    console.log(`   Granted: ${permissions.granted}`);
    console.log(`   CanAskAgain: ${permissions.canAskAgain}`);
    console.log('');

    // 2. Проверить канал (Android)
    console.log('2️⃣  КАНАЛ УВЕДОМЛЕНИЙ (Android):');
    try {
      const channels = await Notifications.getNotificationChannelsAsync?.();
      if (channels) {
        console.log(`   Каналов: ${channels.length}`);
        channels.forEach((ch) => {
          console.log(`   - ${ch.id}: ${ch.name}`);
        });
      } else {
        console.log('   API недоступен на этой платформе');
      }
    } catch (e) {
      console.log(`   Ошибка: ${e}`);
    }
    console.log('');

    // 3. Проверить фоновую задачу
    console.log('3️⃣  ФОНОВАЯ ЗАДАЧА:');
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TASK_NAME
    );
    console.log(`   Зарегистрирована: ${isTaskRegistered ? '✅' : '❌'}`);

    if (isTaskRegistered) {
      const status = await BackgroundFetch.getStatusAsync();
      console.log(`   Статус: ${status}`);
    }
    console.log('');

    // 4. Проверить слово дня
    console.log('4️⃣  СЛОВО ДНЯ:');
    const dailyWord = await getDailyWord();
    if (dailyWord) {
      console.log(`   Слово: ${dailyWord.word}`);
      console.log(`   ID: ${dailyWord.wordId}`);
      console.log(`   Найдено: ${dailyWord.found ? '✅' : '❌'}`);
    } else {
      console.log('   ❌ Слово не загружено');
    }
    console.log('');

    // 5. Проверить время следующего обновления
    console.log('5️⃣  ВРЕМЯ ОБНОВЛЕНИЙ:');
    const meta = await getDailyWordMeta();
    if (meta) {
      const now = Date.now();
      const nextUpdate = meta.lastUpdatedAt + meta.intervalMs;
      const timeUntil = Math.max(nextUpdate - now, 0);
      const secondsUntil = Math.floor(timeUntil / 1000);

      console.log(`   Последнее обновление: ${new Date(meta.lastUpdatedAt).toLocaleString()}`);
      console.log(`   Интервал: ${Math.floor(meta.intervalMs / 1000)} сек`);
      console.log(`   Следующее обновление: ${new Date(nextUpdate).toLocaleString()}`);
      console.log(`   Осталось: ${secondsUntil} сек`);
    } else {
      console.log('   ❌ Мета информация не найдена');
    }
    console.log('');

    // 6. Запланированные уведомления
    console.log('6️⃣  ЗАПЛАНИРОВАННЫЕ УВЕДОМЛЕНИЯ:');
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`   Всего: ${scheduled.length}`);
      scheduled.forEach((notif, i) => {
        console.log(`   ${i + 1}. ${notif.content.title}`);
        if (notif.trigger && 'date' in notif.trigger) {
          console.log(`      На: ${new Date(notif.trigger.date).toLocaleString()}`);
        }
      });
    } catch (e) {
      console.log(`   Ошибка: ${e}`);
    }
    console.log('');

    console.log('=== ✅ ДИАГНОСТИКА ЗАВЕРШЕНА ===\n');
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error);
  }
};

/**
 * Проверить все настройки для продакшена
 */
export const validateProductionSettings = () => {
  console.log('\n=== ✅ ПРОВЕРКА ПРОДАКШЕНА ===\n');

  let errors = 0;

  // Проверка 1: DEBUG_MODE
  // Примечание: Это нужно проверить вручную в useDailyWordManager.ts
  console.log('1️⃣  DEBUG_MODE:');
  console.log('   📝 Проверьте в useDailyWordManager.ts:');
  console.log('   const DEBUG_MODE = false; // ✅ ДОЛЖНО БЫТЬ FALSE');
  console.log('');

  // Проверка 2: Интервал
  console.log('2️⃣  PRODUCTION_INTERVAL_MS:');
  console.log('   📝 Проверьте в useDailyWordManager.ts:');
  console.log('   const PRODUCTION_INTERVAL_MS = 24 * 60 * 60 * 1000; // ✅ 24 часа');
  console.log('');

  // Проверка 3: Разрешения
  console.log('3️⃣  app.json РАЗРЕШЕНИЯ:');
  console.log('   📝 Убедитесь что есть:');
  console.log('   "android": {');
  console.log('     "permissions": [');
  console.log('       "SCHEDULE_EXACT_ALARM", ✅');
  console.log('       "USE_EXACT_ALARM",     ✅');
  console.log('       "POST_NOTIFICATIONS"   ✅');
  console.log('     ]');
  console.log('   }');
  console.log('');

  // Проверка 4: Импорты
  console.log('4️⃣  ИМПОРТЫ:');
  console.log('   📝 В HomeScreen.tsx НЕ ДОЛЖНО БЫТЬ:');
  console.log('   ❌ import { useAppStateListener }');
  console.log('   ❌ useAppStateListener();');
  console.log('');
  console.log('   📝 ДОЛЖНЫ БЫТЬ:');
  console.log('   ✅ import { useDailyNotifications }');
  console.log('   ✅ useDailyNotifications();');
  console.log('   ✅ import { useDailyWordManager }');
  console.log('   ✅ useDailyWordManager();');
  console.log('');

  console.log('=== 📋 ПРОВЕРКА ЗАВЕРШЕНА ===\n');
};

/**
 * Быстрый тест уведомления
 */
export const testNotification = async () => {
  console.log('🧪 Отправка тестового уведомления...');

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Тестовое уведомление',
        body: 'Если видите это - всё работает!',
        data: { test: true },
        sound: 'default',
      },
      trigger: null, // Немедленно
    });

    console.log('✅ Тестовое уведомление отправлено');
  } catch (error) {
    console.error('❌ Ошибка при отправке:', error);
  }
};

/**
 * Очистить все запланированные уведомления (для дебага)
 */
export const clearAllNotifications = async () => {
  console.log('🗑️  Очистка всех запланированных уведомлений...');

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Найдено: ${scheduled.length}`);

    for (const notif of scheduled) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }

    console.log('✅ Все уведомления очищены');
  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
  }
};

/**
 * Показать все запланированные уведомления
 */
export const listAllNotifications = async () => {
  console.log('\n📋 ЗАПЛАНИРОВАННЫЕ УВЕДОМЛЕНИЯ:\n');

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    if (scheduled.length === 0) {
      console.log('Нет запланированных уведомлений');
      return;
    }

    scheduled.forEach((notif, i) => {
      console.log(`${i + 1}. ID: ${notif.identifier}`);
      console.log(`   Название: ${notif.content.title}`);
      console.log(`   Описание: ${notif.content.body}`);

      if (notif.trigger && 'date' in notif.trigger) {
        const triggerDate = new Date(notif.trigger.date);
        const now = new Date();
        const diff = triggerDate.getTime() - now.getTime();
        const minutes = Math.floor(diff / 1000 / 60);

        console.log(`   Запланировано: ${triggerDate.toLocaleString()}`);
        console.log(`   Через: ${minutes} минут`);
      }

      console.log('');
    });
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
};

/**
 * Выполнить полную диагностику и валидацию
 */
export const runFullDiagnostics = async () => {
  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║     🔍 ПОЛНАЯ ДИАГНОСТИКА УВЕДОМЛЕНИЙ         ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  await diagnosticNotifications();
  validateProductionSettings();
  await listAllNotifications();

  console.log('\n✅ Используйте эти функции в DevTools для дебага:');
  console.log('   • diagnosticNotifications() - полная диагностика');
  console.log('   • testNotification() - отправить тестовое уведомление');
  console.log('   • clearAllNotifications() - очистить всё');
  console.log('   • listAllNotifications() - показать всё запланированное\n');
};
