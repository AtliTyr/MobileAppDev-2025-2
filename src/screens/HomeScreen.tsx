/**
 * 🏠 HomeScreen.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
 * 
 * ИСПРАВЛЕНИЯ:
 * ❌ УБРАНА runFullDiagnostics() - вызывалась при КАЖДОМ рендере!
 * ✅ Диагностика вызывается ТОЛЬКО при нажатии кнопки (для разработчика)
 * ✅ useDailyWordManager теперь без дублирования
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { useDailyNotifications } from '../hooks/useDailyNotifications';
import { useDailyWordManager } from '../hooks/useDailyWordManager';
import { runFullDiagnostics } from '../hooks/diagnostics';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  // 🪝 HOOKS (вызываются только при монтировании/изменении зависимостей)
  useDailyNotifications(); // Настройка уведомлений - один раз

  const { hasSavedGame, clearSavedGame, loadGame } = useGamePersistence();

  const {
    dailyWord,
    nextUpdateTime,
    loading,
    forceUpdateDailyWord,
  } = useDailyWordManager(); // Менеджер слова дня

  // 📦 СОСТОЯНИЕ
  const [savedGameExists, setSavedGameExists] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [currentSet, setCurrentSet] = useState<WordSet | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false); // Для дебага

  // Загрузка сохраненной игры и текущего набора
  useFocusEffect(
    React.useCallback(() => {
      const checkSaveAndSet = async () => {
        const exists = await hasSavedGame();
        setSavedGameExists(exists);

        try {
          const storedId = await AsyncStorage.getItem(STORAGE_SELECTED_SET_ID);
          if (storedId) {
            const set = builtInWordSets.find(s => s.id === storedId) ?? null;
            setCurrentSet(set);
          } else {
            setCurrentSet(null);
          }
        } catch (e) {
          console.log('HomeScreen:', e);
        }
      };

      checkSaveAndSet();
    }, [hasSavedGame])
  );

  // Блокировка свайпа назад
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        console.log('🚫 Swipe back заблокирован');
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Загрузка текущего набора
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
        }

        setCurrentSet(set || null);
      } catch (e) {
        console.log('HomeScreen:', e);
      }
    };

    loadCurrentSet();
  }, []);

  // 📱 ОБРАБОТЧИКИ
  const handlePlayDailyWord = useCallback(() => {
    if (dailyWord) {
      navigation.navigate('Game', {
        wordSetId: dailyWord.setId,
        dailyWordId: dailyWord.wordId,
        isDailyWordMode: true,
      });
    }
  }, [dailyWord, navigation]);

  const handleForceDailyWord = useCallback(async () => {
    await forceUpdateDailyWord();
  }, [forceUpdateDailyWord]);

  const handleNewGame = useCallback(() => {
    if (savedGameExists) {
      setShowNewGameConfirm(true);
    } else {
      navigation.navigate('Game', {
        wordSetId: currentSet ? currentSet.id : undefined,
      });
    }
  }, [savedGameExists, currentSet, navigation]);

  const handleConfirmNewGame = useCallback(async () => {
    await clearSavedGame();
    setShowNewGameConfirm(false);
    navigation.navigate('Game', {
      wordSetId: currentSet ? currentSet.id : undefined,
    });
  }, [clearSavedGame, currentSet, navigation]);

  const handleContinueGame = useCallback(async () => {
    const loadedData = await loadGame();
    if (loadedData) {
      navigation.navigate('Game', { savedGameData: loadedData });
    }
  }, [loadGame, navigation]);

  const handleShowDiagnostics = useCallback(async () => {
    setShowDiagnostics(true);
    await runFullDiagnostics();
  }, []);

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
        <View style={styles.topPanel}>
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

          {!loading && dailyWord && (
            <>
              {!!nextUpdateTime && (
                <View style={styles.dailyWordTimerBox}>
                  <View style={styles.dailyWordTimerValueWrapper}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={16}
                      color="#0D1B2A"
                    />
                    <Text style={styles.dailyWordTimerValue}>{nextUpdateTime}</Text>
                  </View>
                </View>
              )}

              <View style={styles.dailyWordRow}>
                {/* Левая часть: label + value, как в наборе */}
                <View style={styles.dailyWordBox}>
                  <Text style={styles.dailyWordLabel}>СЛОВО ДНЯ</Text>
                  <View style={styles.dailyWordValueWrapper}>
                    <Text style={styles.dailyWordValue}>
                      {dailyWord.word.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Правая часть: либо кнопка, либо галочка */}
                {dailyWord.found ? (
                  <View style={styles.dailyWordStatusFound}>
                    <MaterialCommunityIcons
                      name="check-bold"
                      size={40}
                      color="green"
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePlayDailyWord}
                    style={styles.dailyWordStatusFound}
                  >
                    <MaterialCommunityIcons
                      name="play-circle-outline"
                      size={40}
                      color="#0D1B2A"
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.dailyWordStatusFound}
                  onPress={handleForceDailyWord}
                >
                  <MaterialCommunityIcons
                    name="reload"
                    size={40}
                    color="#0D1B2A"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
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
            {/* Кнопка для дебага (форсинг обновления) */}
            {__DEV__ && (
              <TouchableOpacity
                onPress={handleForceDailyWord}
                style={{
                  marginTop: 16,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: '#FFE066',
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: '#0D1B2A',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Unbounded', fontWeight: 'bold' }}>
                  🔄 Обновить слово (дебаг)
                </Text>
              </TouchableOpacity>
            )}

            {/* Кнопка диагностики (только в дебаге) */}
            {__DEV__ && (
              <TouchableOpacity
                onPress={handleShowDiagnostics}
                style={{
                  marginTop: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: '#A3CEF1',
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: '#0D1B2A',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Unbounded', fontWeight: 'bold' }}>
                  🔍 Диагностика (смотри консоль)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.footer}>
          Разработка: Лабораторная №6 — Адаптация под конкретную платформу
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
  topPanel: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
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

  dailyWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    justifyContent: 'flex-start',
    gap: 0,
    marginBottom: 16,
    // paddingHorizontal: 4,
    transform: [{ rotate: '-3deg' }],
    left: '-9%',
  },

  dailyWordBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    backgroundColor: '#0D1B2A',
    borderRadius: 10,
    overflow: 'hidden',
    // marginRight: 8,
  },

  dailyWordLabel: {
    backgroundColor: '#0D1B2A',
    color: '#E7ECEF',
    textAlign: 'center',
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    fontSize: 12,
    paddingVertical: 3,
  },

  dailyWordValueWrapper: {
    backgroundColor: '#A3CEF1',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  dailyWordValue: {
    color: '#111',
    textAlign: 'center',
    fontFamily: 'Unbounded',
    fontWeight: '900',
    fontSize: 20,
  },

  dailyWordTimerBadge: {
    marginTop: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(13, 27, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(13, 27, 42, 0.3)',
  },

  dailyWordTimerText: {
    marginLeft: 4,
    fontSize: 10,
    fontFamily: 'Unbounded',
    fontWeight: '600',
    color: '#0D1B2A',
  },

  dailyWordTimer: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: 'Unbounded',
    color: '#0D1B2A',
  },

  dailyWordStatusPlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    backgroundColor: '#FFE066',
  },

  dailyWordStatusFound: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    backgroundColor: '#A3CEF1',
  },

  dailyWordStatusText: {
    // marginLeft: 4,
    fontSize: 12,
    fontFamily: 'Unbounded',
    fontWeight: '700',
    color: '#0D1B2A',
  },

  dailyWordTimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 4,
    paddingLeft: 8,
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    transform: [{ rotate: '-3deg' }],
  },

  dailyWordTimerHeader: {
    backgroundColor: '#0D1B2A',
    color: '#E7ECEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    fontSize: 11,
    paddingVertical: 3,
    gap: 4,
  },

dailyWordTimerBox: {
  borderWidth: 3,
  borderColor: '#0D1B2A',
  backgroundColor: '#A3CEF1',
  borderRadius: 10,
  overflow: 'hidden',
  width: 200,
  transform: [{ rotate: '-3deg' }],
},

dailyWordTimerValueWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 8,
},

dailyWordTimerValue: {
  color: '#111',
  fontFamily: 'Unbounded',
  fontWeight: '900',
  fontSize: 20,
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
