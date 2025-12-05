/**
 * 🏠 HomeScreen.tsx - Главное меню приложения
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ImageBackground } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { RootStackParamList } from '../../App';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WordSet,
  builtInWordSets,
  STORAGE_SELECTED_SET_ID,
} from '../types/wordSets';

// ========================================
// 📊 ТИПЫ
// ========================================

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ========================================
// 🏠 ГЛАВНЫЙ КОМПОНЕНТ
// ========================================

export default function HomeScreen({ navigation }: Props) {
  // ========================================
  // 🪝 HOOKS
  // ========================================

  const { hasSavedGame, clearSavedGame, loadGame } = useGamePersistence();

  // ========================================
  // 📦 СОСТОЯНИЕ
  // ========================================

  const [savedGameExists, setSavedGameExists] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  // ✨ Новое: текущий набор для игры (может быть random)
  const [currentSet, setCurrentSet] = useState<WordSet | null>(null);

  // ========================================
  // ⚡ ПРОВЕРКА СОХРАНЁННОЙ ИГРЫ
  // ========================================

  useFocusEffect(
    React.useCallback(() => {
      const checkSaveAndSet = async () => {
        const exists = await hasSavedGame();
        setSavedGameExists(exists);

        // 👇 добавляем загрузку выбранного набора при КАЖДОМ фокусе
        try {
          const storedId = await AsyncStorage.getItem(STORAGE_SELECTED_SET_ID);
          if (storedId) {
            const set = builtInWordSets.find(s => s.id === storedId) ?? null;
            setCurrentSet(set);
          } else {
            setCurrentSet(null); // будет показывать "случайный набор"
          }
        } catch (e) {
          console.log('Ошибка загрузки набора на HomeScreen', e);
        }
      };

      checkSaveAndSet();
    }, [hasSavedGame])
  );

  // ========================================
  // 🚫 БЛОКИРОВКА SWIPE BACK (КРИТИЧНО!)
  // ========================================

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
  // 🔤 ЗАГРУЗКА / УСТАНОВКА НАБОРА
  // ========================================

  // При заходе на Home: читаем выбранный набор из AsyncStorage или берём случайный.
  useEffect(() => {
    const loadCurrentSet = async () => {
      try {
        const storedId = await AsyncStorage.getItem(STORAGE_SELECTED_SET_ID);
        let set: WordSet | undefined;

        if (storedId) {
          set = builtInWordSets.find(s => s.id === storedId);
        }
        if (!set) {
          const all = builtInWordSets;
          set = all[Math.floor(Math.random() * all.length)];
          // Для наглядности: НЕ сохраняем рандом в STORAGE_SELECTED_SET_ID,
          // чтобы пользователь явно выбрал набор в словаре.
        }
        setCurrentSet(set || null);
      } catch (e) {
        console.log('Ошибка загрузки набора на HomeScreen', e);
      }
    };

    loadCurrentSet();
  }, []);

  // Этот обработчик можно будет вызывать из других экранов, если решишь
  // делать выбор набора прямо из Home. Пока он только читает состояние.
  const getSetLabel = () => {
    if (!currentSet) return 'Набор: случайный';
    return `Набор: ${currentSet.name}`;
  };

  // ========================================
  // 🎮 ОБРАБОТЧИКИ НАЖАТИЙ
  // ========================================

  const handleNewGame = () => {
    if (savedGameExists) {
      setShowNewGameConfirm(true);
    } else {
      navigation.navigate('Game', {
        // Явно прокидываем текущий набор; если он рандомный — это всё равно конкретный id
        wordSetId: currentSet ? currentSet.id : undefined,
      });
    }
  };

  const handleConfirmNewGame = async () => {
    await clearSavedGame();
    setShowNewGameConfirm(false);
    navigation.navigate('Game', {
      wordSetId: currentSet ? currentSet.id : undefined,
    });
  };

  const handleContinueGame = async () => {
    const loadedData = await loadGame();
    if (loadedData) {
      // В сохранении уже есть конфиг и состояние, включая набор:
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
        <View style={styles.innerContainer}>
          {/* Информация о наборе */}
          <Text style={styles.currentSetLabel}>
            {getSetLabel()}
          </Text>

          {savedGameExists && (
            <PrimaryButton
              title="🔄 ПРОДОЛЖИТЬ ИГРУ"
              onPress={handleContinueGame}
            />
          )}

          <PrimaryButton
            title="🎮 НОВАЯ ИГРА"
            onPress={handleNewGame}
          />

          <PrimaryButton
            title="📜 ИНСТРУКЦИИ"
            onPress={() => navigation.navigate('Instructions')}
          />

          <PrimaryButton
            title="📚 СЛОВАРЬ"
            onPress={() => navigation.navigate('Dictionary')}
          />

          <PrimaryButton
            title="⚙️ НАСТРОЙКИ"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        <Text style={styles.footer}>
          Разработка: Лабораторная №5 — Дизайн и функциональные возможности
        </Text>

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
// 🎨 СТИЛИ (ТВОИ, БЕЗ ИЗМЕНЕНИЙ)
// ========================================

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  imageStyle: {
    resizeMode: 'stretch',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 10,
    fontSize: 12,
    color: '#666',
  },
  currentSetLabel: {
  color: 'white',
  fontSize: 14,
  marginBottom: 12,
  },
});

const confirmModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 280,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 5,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
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
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
