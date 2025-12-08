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
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
        {/* Верхняя панель с набором и шестерёнкой */}
        <View style={styles.topBar}>
          <View style={styles.setCard}>
            <Text style={styles.setLabel}>ТЕКУЩИЙ НАБОР</Text>
            <Text
              style={styles.setName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentSet ? currentSet.name : 'Случайный'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={28}
              color="#0D1B2A"
            />
          </TouchableOpacity>
        </View>

        {/* Основные кнопки */}
        <View style={styles.innerContainer}>
          <View style={styles.buttonsPanel}>
            {savedGameExists && (
              <PrimaryButton
                title="🔄 ПРОДОЛЖИТЬ ИГРУ"
                onPress={handleContinueGame}
                variant="primary"
                style={{marginBottom: 24}}
              />
            )}

            <PrimaryButton
              title="НОВАЯ ИГРА"
              onPress={handleNewGame}
              variant="accent"
              style={{marginBottom: 2}}
            />

            <PrimaryButton
              title="СЛОВАРЬ"
              onPress={() => navigation.navigate('Dictionary')}
              variant="secondary"
              style={{marginBottom: 2}}
            />

          </View>
        </View>

        <Text style={styles.footer}>
          Разработка: Лабораторная №5 — Дизайн и функциональные возможности
        </Text>

        {/* Модал подтверждения новой игры — как было */}
        <Modal
          visible={showNewGameConfirm}
          transparent={true}
          animationType="fade"
        >
          <View style={confirmModal.overlay}>
            <View style={confirmModal.cardShadow}>
              <View style={confirmModal.tilted}>
                <View style={confirmModal.container}>
                  <Text style={confirmModal.title}>⚠️ ВНИМАНИЕ</Text>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // верхняя панель
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  setCard: {
    flex: 1,
    marginRight: 12,
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    transform: [{ rotate: '-3deg' }],
  },
  setLabel: {
    fontSize: 11,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
    backgroundColor: '#0D1B2A',
    textAlign: 'center',
    paddingVertical: 2,
    marginBottom: 4,
  },
  setName: {
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    backgroundColor: '#A3CEF1',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '5deg' }],
  },

  innerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 60,
    gap: 10,
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
  buttonsPanel: {
    // backgroundColor: 'rgba(0, 0, 0, 0.25)',
    // borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    // borderWidth: 2,
    // borderColor: 'rgba(13, 27, 42, 0.7)',
  },
});

const confirmModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tilted: {
    transform: [{ rotate: '-4deg' }],
  },
  container: {
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minWidth: 280,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    color: '#111',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0D1B2A',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
  },
  cancelButton: {
    backgroundColor: '#6096BA',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#111',
  },
});
