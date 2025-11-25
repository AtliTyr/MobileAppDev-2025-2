/**
 * 🏠 HomeScreen.tsx - Главное меню приложения
 * 
 * ОСНОВНОЙ ФУНКЦИОНАЛ:
 * ✅ Отображение главного меню с кнопками навигации
 * ✅ Проверка наличия сохранённой игры
 * ✅ БЛОКИРОВКА SWIPE BACK жеста (критично!)
 * ✅ Обработка перехода на различные экраны
 * ✅ Подтверждение перед началом новой игры (если есть сохранение)
 * ✅ Загрузка продолжения сохранённой игры
 * 
 * НАВИГАЦИЯ:
 * - Game: новая игра или продолжение
 * - Instructions: инструкции
 * - Dictionary: словарь
 * - Settings: настройки
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ImageBackground } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { RootStackParamList } from '../../App';

// ========================================
// 📊 ТИПЫ
// ========================================

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ========================================
// 🏠 ГЛАВНЫЙ КОМПОНЕНТ
// ========================================

/**
 * HomeScreen - главное меню приложения
 * 
 * ОСНОВНЫЕ ФУНКЦИИ:
 * 1. Показывает кнопки навигации (новая игра, инструкции, словарь, настройки)
 * 2. Проверяет есть ли сохранённая игра и показывает кнопку "Продолжить"
 * 3. ⭐ БЛОКИРУЕТ SWIPE BACK жесты (предотвращает выход из приложения)
 * 4. Показывает модальное окно подтверждения при начале новой игры поверх сохранения
 */
export default function HomeScreen({ navigation }: Props) {
  // ========================================
  // 🪝 HOOKS
  // ========================================

  /**
   * Получаем функции для работы с сохранениями
   * - hasSavedGame: проверяет есть ли сохранённая игра
   * - clearSavedGame: удаляет сохранение
   * - loadGame: загружает сохранённую игру
   */
  const { hasSavedGame, clearSavedGame, loadGame } = useGamePersistence();

  // ========================================
  // 📦 СОСТОЯНИЕ
  // ========================================

  /**
   * savedGameExists - есть ли сохранённая игра
   * 
   * Используется для:
   * - Показа кнопки "Продолжить" если true
   * - Показа диалога подтверждения при новой игре если true
   */
  const [savedGameExists, setSavedGameExists] = useState(false);

  /**
   * showNewGameConfirm - показать ли диалог подтверждения новой игры
   */
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  // ========================================
  // ⚡ ПРОВЕРКА СОХРАНЁННОЙ ИГРЫ
  // ========================================

  /**
   * useFocusEffect - вызывает функцию когда экран получает фокус
   * 
   * ❗ ОТЛИЧИЕ от useEffect:
   * - useEffect: вызывается один раз при монтировании
   * - useFocusEffect: вызывается каждый раз когда пользователь возвращается на экран
   * 
   * ✅ ЛОГИКА:
   * 1. Вызывает hasSavedGame() для проверки наличия сохранения
   * 2. Обновляет savedGameExists
   * 3. Повторяется каждый раз когда фокус вернулся на HomeScreen
   */
  useFocusEffect(
    React.useCallback(() => {
      const checkSave = async () => {
        const exists = await hasSavedGame();
        setSavedGameExists(exists);
      };
      checkSave();
    }, [hasSavedGame])
  );

  // ========================================
  // 🚫 БЛОКИРОВКА SWIPE BACK (КРИТИЧНО!)
  // ========================================

  /**
   * ⭐ ГЛАВНАЯ ФИШКА: Блокируем свайп влево на главном меню
   * 
   * ❗ ПОЧЕМУ ЭТО ВАЖНО:
   * В React Navigation есть встроенный жест "swipe back" (свайп влево)
   * который возвращает пользователя на предыдущий экран.
   * На главном меню это приведёт к выходу из приложения.
   * 
   * ✅ РЕШЕНИЕ:
   * Добавляем listener на событие 'beforeRemove' и:
   * - Проверяем это ли свайп назад (e.data.action.type === 'GO_BACK')
   * - Если да - вызываем e.preventDefault() чтобы заблокировать действие
   * - Логируем что жест был заблокирован
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        console.log('🚫 Swipe back заблокирован на главном меню');
      }
    });

    return unsubscribe;
  }, [navigation]);

  // ========================================
  // 🎮 ОБРАБОТЧИКИ НАЖАТИЙ
  // ========================================

  /**
   * handleNewGame - обработчик кнопки "Новая игра"
   * 
   * ЛОГИКА:
   * 1. Если есть сохранённая игра - показываем диалог подтверждения
   * 2. Если сохранения нет - сразу переходим в Game
   */
  const handleNewGame = () => {
    if (savedGameExists) {
      setShowNewGameConfirm(true);
    } else {
      navigation.navigate('Game');
    }
  };

  /**
   * handleConfirmNewGame - обработчик кнопки "Начать заново" в диалоге
   * 
   * ЛОГИКА:
   * 1. Удаляем сохранённую игру
   * 2. Закрываем диалог подтверждения
   * 3. Переходим на Game экран
   */
  const handleConfirmNewGame = async () => {
    await clearSavedGame();
    setShowNewGameConfirm(false);
    navigation.navigate('Game');
  };

  /**
   * handleContinueGame - обработчик кнопки "Продолжить игру"
   * 
   * ЛОГИКА:
   * 1. Загружаем сохранённую игру
   * 2. Если загрузка успешна - передаём данные на Game экран
   * 3. Переходим на Game экран с параметром savedGameData
   */
  const handleContinueGame = async () => {
    const loadedData = await loadGame();
    if (loadedData) {
      navigation.navigate('Game', { savedGameData: loadedData });
    }
  };

  // ========================================
  // 🎨 РЕНДЕРИНГ
  // ========================================

  return (
    <ImageBackground
      source={require('../../assets/images/home_background.png')}
      style={styles.backgroundImage}
      imageStyle={styles.imageStyle}
    >
      <View style={styles.container}>
        {/* Заголовок приложения */}
        {/* <Text style={styles.title}>🎮 WORDTETRIS</Text> */}
        <View style={styles.innerContainer}>
          {/* Кнопка продолжить (видна только если есть сохранение) */}
          {savedGameExists && (
            <PrimaryButton
              title="🔄 ПРОДОЛЖИТЬ ИГРУ"
              onPress={handleContinueGame}
            />
          )}

          {/* Кнопка начала новой игры */}
          <PrimaryButton
            title="🎮 НОВАЯ ИГРА"
            onPress={handleNewGame}
          />

          {/* Кнопка инструкций */}
          <PrimaryButton
            title="📜 ИНСТРУКЦИИ"
            onPress={() => navigation.navigate('Instructions')}
          />

          {/* Кнопка словаря */}
          <PrimaryButton
            title="📚 СЛОВАРЬ"
            onPress={() => navigation.navigate('Dictionary')}
          />

          {/* Кнопка настроек */}
          <PrimaryButton
            title="⚙️ НАСТРОЙКИ"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
        <Text style={styles.footer}>
          Разработка: Лабораторная №4 — Работа с навигацией и мультимедиа
        </Text>

        {/* Модальное окно подтверждения новой игры */}
        <Modal
          visible={showNewGameConfirm}
          transparent={true}
          animationType="fade"
        >
          <View style={confirmModal.overlay}>
            <View style={confirmModal.container}>
              <Text style={confirmModal.title}>⚠️ Внимание!</Text>
              <Text style={confirmModal.message}>
                Существующее сохранение будет потеряно. Вы уверены?
              </Text>

              <TouchableOpacity
                style={confirmModal.button}
                onPress={handleConfirmNewGame}
              >
                <Text style={confirmModal.buttonText}>НАЧАТЬ ЗАНОВО</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={confirmModal.cancelButton}
                onPress={() => setShowNewGameConfirm(false)}
              >
                <Text style={confirmModal.cancelButtonText}>ОТМЕНА</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

// ========================================
// 🎨 СТИЛИ
// ========================================

/**
 * Стили главного контейнера
 */
const styles = StyleSheet.create({
  /**
   * backgroundImage - фоновое изображение
   * Занимает весь доступный размер
   */
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },

  /**
   * imageStyle - сохраняет соотношение сторон фонового изображения
   */
  imageStyle: {
    resizeMode: 'stretch',
  },

  /**
   * container - главный контейнер меню
   * Центрирует содержимое и добавляет полупрозрачный фон
   */
  container: {
    flex: 1,
    // alignItems: 'center',
    justifyContent: 'flex-end',
    // padding: 16,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Полупрозрачный оверлей
  },
  innerContainer: {
    flex: 1,
    // alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 60,

  },
  /**
   * title - заголовок приложения
   * Большой и жирный текст в верхней части
   */
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },

  /**
   * footer - текст в нижней части
   * Мелкий серый текст с указанием авторства
   */
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 10,
    fontSize: 12,
    color: '#666',
  },
});

/**
 * Стили для модального окна подтверждения
 */
const confirmModal = StyleSheet.create({
  /**
   * overlay - полупрозрачный фон за модальным окном
   * Затемняет фон и центрирует содержимое
   */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * container - сам диалог (белое окно)
   */
  container: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 280,
  },

  /**
   * title - заголовок диалога с предупреждением
   */
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },

  /**
   * message - текст сообщения в диалоге
   */
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },

  /**
   * button - красная кнопка "Начать заново"
   */
  button: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 5,
    minWidth: 220,
    alignItems: 'center',
  },

  /**
   * buttonText - текст на кнопке "Начать заново"
   */
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  /**
   * cancelButton - серая кнопка "Отмена"
   */
  cancelButton: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    minWidth: 220,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },

  /**
   * cancelButtonText - текст на кнопке "Отмена"
   */
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
