/**
 * 🎮 GameScreen.tsx - Главный экран игры
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  Modal,
  ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import TetrisBoard from '../components/TetrisBoard';
import TetrominoBox from '../components/TetrominoBox';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useGameState } from '../hooks/useGameState';
import { useTouchGameControls } from '../hooks/useTouchGameControls';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { useAudioManager } from '../hooks/useAudioManager';

import { RootStackParamList } from '../../App';
import { CommonActions } from '@react-navigation/native';

import { RecognitionModeOverlay } from '../components/RecognitionModeOverlay';
import type { LetterPosition } from '../hooks/useWordRecognition';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  WordSet,
  WordData,
  builtInWordSets,
  STORAGE_FOUND_WORDS,
} from '../types/wordSets';

import WordCard from '../components/WordCard';
import { DEFAULT_GAME_CONFIG } from '../types/game';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ navigation, route }: Props) {
  // ========================================
  // 🔧 ИНИЦИАЛИЗАЦИЯ
  // ========================================
  const savedGameData = route.params?.savedGameData;
  const routeWordSetId = route.params?.wordSetId;

  const { saveGame, clearSavedGame } = useGamePersistence();
  const { playSound, playBackgroundMusic, stopBackgroundMusic } =
    useAudioManager();

  // ========================================
  // 📦 СОСТОЯНИЕ
  // ========================================
  const [showDebug, setShowDebug] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [isControlsDisabled, setIsControlsDisabled] = useState(false);
  const [recognitionModeActive, setRecognitionModeActive] = useState(false);
  const [recognitionTimer, setRecognitionTimer] = useState(120);
  const [selectedPath, setSelectedPath] = useState<LetterPosition[]>([]);

  // ✨ Наборы слов
  const [currentWordSet, setCurrentWordSet] = useState<WordSet | null>(null);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [currentTargetWord, setCurrentTargetWord] = useState<string | null>(
    savedGameData?.currentTargetWord ?? null
  );
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(
    savedGameData?.currentTargetId ?? null
  );

  // 🔧 Конфиг игры
  const effectiveConfig = {
    ...DEFAULT_GAME_CONFIG,
    ...(savedGameData?.config ?? {}),
    targetWord: currentTargetWord ?? undefined,
  };

  const { gameState, actions } = useGameState(
    effectiveConfig,
    undefined
  );

  // ✨ Карточка только что найденного слова
  const [justFoundWord, setJustFoundWord] = useState<WordData | null>(null);
  const [justFoundVisible, setJustFoundVisible] = useState(false);

  // ========================================
  // 📍 REFS
  // ========================================
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundMusicStartedRef = useRef(false);
  const stateRef = useRef({
    isControlsDisabled,
    isPaused: gameState.isPaused,
  });

  // ========================================
  // 🧩 РАБОТА С НАБОРОМ СЛОВ
  // ========================================
  const chooseNextTarget = (set: WordSet, found: string[]) => {
    const candidates = set.words.filter((w) => !found.includes(w.id));
    if (candidates.length === 0) {
      console.log('✅ Все слова в наборе найдены');
      setCurrentTargetWord(null);
      setCurrentTargetId(null);
      return;
    }

    const random = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrentTargetWord(random.word.toUpperCase());
    setCurrentTargetId(random.id);
    console.log('🎯 Новая цель:', random.word, 'id=', random.id);
  };

  useEffect(() => {
    const initWordSet = async () => {
      try {
        const fromRoute = routeWordSetId;
        const fromSave = savedGameData?.wordSetId;
        const setId = fromRoute ?? fromSave;

        if (!setId) {
          console.log('⚠️ wordSetId не передан в GameScreen');
          setCurrentWordSet(null);
          return;
        }

        const set = builtInWordSets.find((s) => s.id === setId);
        if (!set) {
          console.log('⚠️ Набор не найден по id:', setId);
          setCurrentWordSet(null);
          return;
        }

        setCurrentWordSet(set);

        const raw = await AsyncStorage.getItem(STORAGE_FOUND_WORDS);
        const parsed: Record<string, string[]> = raw ? JSON.parse(raw) : {};
        const alreadyFound = parsed[set.id] ?? [];
        setFoundIds(alreadyFound);

        if (
          savedGameData?.currentTargetWord &&
          savedGameData?.currentTargetId
        ) {
          console.log(
            '🎯 Восстанавливаем сохранённую цель:',
            savedGameData.currentTargetWord
          );
          return;
        }

        chooseNextTarget(set, alreadyFound);
      } catch (e) {
        console.log('Ошибка инициализации набора слов в GameScreen', e);
      }
    };

    initWordSet();
  }, [routeWordSetId, savedGameData]);

  // ========================================
  // ⏱️ ТАЙМЕР ОБРАТНОГО ОТСЧЁТА
  // ========================================
  const startCountdown = useCallback(
    (duration: number = 3) => {
      console.log(
        `⏱️ Таймер начат на ${duration} сек, isControlsDisabled = true`
      );
      setCountdownTime(duration);
      setIsControlsDisabled(true);

      let remaining = duration;

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        console.log('🗑️ Старый таймер очищен');
      }

      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        console.log(`⏳ Таймер: ${remaining} сек осталось`);
        setCountdownTime(remaining);

        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          console.log('✅ Таймер закончился, isControlsDisabled = false');
          setCountdownTime(null);
          setIsControlsDisabled(false);
          actions.resume();

          setTimeout(() => {
            if (!backgroundMusicStartedRef.current) {
              console.log('🎵 Запускаем фоновую музыку');
              playBackgroundMusic();
              backgroundMusicStartedRef.current = true;
            }
          }, 100);
        }
      }, 1000);
    },
    [actions, playBackgroundMusic]
  );

  // ========================================
  // 🧹 CLEANUP
  // ========================================
  useEffect(() => {
    return () => {
      console.log('🧹 GameScreen размонтируется - ПОЛНАЯ ОЧИСТКА');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      stopBackgroundMusic();
      try {
        actions.pause();
      } catch {
        console.log('⚠️ actions уже недоступны при cleanup');
      }
      setIsControlsDisabled(false);
      console.log('✅ Cleanup завершён');
    };
  }, [stopBackgroundMusic]);

  // ========================================
  // 🔄 ОБНОВЛЕНИЕ stateRef
  // ========================================
  useEffect(() => {
    stateRef.current = {
      isControlsDisabled,
      isPaused: gameState.isPaused,
    };
  }, [isControlsDisabled, gameState.isPaused]);

  // ========================================
  // 🚫 SWIPE BACK
  // ========================================
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        handlePause();
      }
    });

    return unsubscribe;
  }, [navigation, gameState.isPaused, showPauseMenu, isControlsDisabled]);

  // ========================================
  // 📱 ИНИЦИАЛИЗАЦИЯ
  // ========================================
  useEffect(() => {
    console.log('📱 GameScreen загружен, ставим паузу и запускаем таймер');
    actions.pause();
    startCountdown(3);
    backgroundMusicStartedRef.current = false;
  }, []);

  useEffect(() => {
    if (!recognitionModeActive) return;

    const id = setInterval(() => {
      setRecognitionTimer((t) => {
        if (t <= 1) {
          console.log('⏰ Recognition: время вышло');
          setRecognitionModeActive(false);
          actions.resume();
          playBackgroundMusic();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [recognitionModeActive, actions, playBackgroundMusic]);

  // ========================================
  // 👆 СВАЙПЫ
  // ========================================
  const touchControls = useTouchGameControls({
    onMoveLeft: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        playSound('move');
        actions.moveTetromino(-1, 0);
      }
    },
    onMoveRight: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        playSound('move');
        actions.moveTetromino(1, 0);
      }
    },
    onRotate: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        playSound('rotate');
        actions.rotateTetromino();
      }
    },
    onHardDrop: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        playSound('hard_drop');
        actions.hardDrop();
      }
    },
    onSoftDrop: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        playSound('move');
        actions.moveTetromino(0, 1);
      }
    },
  });

  // ========================================
  // 🎮 ОБРАБОТЧИКИ
  // ========================================
  const handlePause = () => {
    if (gameState.isPaused && showPauseMenu) {
      setShowPauseMenu(false);
      startCountdown(3);
      playBackgroundMusic();
    } else {
      actions.pause();
      setShowPauseMenu(true);
      stopBackgroundMusic();
    }
  };

  const handleHold = () => {
    if (!isControlsDisabled && !gameState.isPaused) {
      playSound('hold');
      actions.holdTetromino();
    }
  };

  const handleRestart = async () => {
    playSound('game_over');
    actions.restart();
    await clearSavedGame();
    setShowPauseMenu(false);
    backgroundMusicStartedRef.current = false;
    actions.pause();
    startCountdown(3);
  };

  const handleExitRequest = () => {
    if (gameState.isGameOver) {
      handleQuickExit();
    } else {
      setShowExitConfirm(true);
    }
  };

  const goHomeReset = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      })
    );
  };

  const handleExitWithSave = async () => {
    console.log('🚪 Выход с сохранением');
    actions.pause();
    stopBackgroundMusic();
    const wordSetId = currentWordSet?.id;

    await saveGame(
      gameState,
      wordSetId,
      currentTargetWord,
      currentTargetId
    );

    actions.restart();
    setShowExitConfirm(false);
    setShowPauseMenu(false);
    setCountdownTime(null);
    setShowDebug(false);
    setIsControlsDisabled(false);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    backgroundMusicStartedRef.current = false;
    goHomeReset();
  };

  const handleExitWithoutSave = async () => {
    console.log('🚪 Выход без сохранения');
    actions.pause();
    stopBackgroundMusic();
    await clearSavedGame();
    actions.restart();
    setShowExitConfirm(false);
    setShowPauseMenu(false);
    setCountdownTime(null);
    setShowDebug(false);
    setIsControlsDisabled(false);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    backgroundMusicStartedRef.current = false;
    goHomeReset();
  };

  const handleQuickExit = async () => {
    console.log('🚪 Быстрый выход (game over)');
    actions.pause();
    stopBackgroundMusic();
    await clearSavedGame();
    actions.restart();
    setShowExitConfirm(false);
    setShowPauseMenu(false);
    setCountdownTime(null);
    setShowDebug(false);
    setIsControlsDisabled(false);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    backgroundMusicStartedRef.current = false;
    goHomeReset();
  };

  // ========================================
  // ✨ РЕЖИМ РАЗГАДЫВАНИЯ + ПРОГРЕСС СЛОВ
  // ========================================
  const handleActivateRecognitionMode = () => {
    if (gameState.isGameOver || recognitionModeActive) return;
    console.log('🔍 Активируем режим разгадывания');
    setRecognitionTimer(120);
    setRecognitionModeActive(true);
    actions.pause();
    stopBackgroundMusic();
  };

  const handleRecognitionClose = async (word: string) => {
    console.log('📝 Слово из режима разгадывания:', word);
    setRecognitionModeActive(false);

    const trimmed = word.trim();
    const upper = trimmed.toUpperCase();

    let success = false;
    let unlockedWord: WordData | null = null;

    if (
      currentTargetWord &&
      upper === currentTargetWord &&
      currentWordSet &&
      currentTargetId
    ) {
      success = true;
      unlockedWord =
        currentWordSet.words.find((w) => w.id === currentTargetId) ??
        null;
      console.log('🎯 Совпадение с целью!');
    } else {
      console.log(
        '❌ Не совпало с целью. target =',
        currentTargetWord,
        'word =',
        upper
      );
    }

    if (success && currentWordSet && currentTargetId) {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_FOUND_WORDS);
        const parsed: Record<string, string[]> = raw ? JSON.parse(raw) : {};
        const list = parsed[currentWordSet.id] ?? [];

        if (!list.includes(currentTargetId)) {
          const updated = [...list, currentTargetId];
          parsed[currentWordSet.id] = updated;
          await AsyncStorage.setItem(
            STORAGE_FOUND_WORDS,
            JSON.stringify(parsed)
          );
          setFoundIds(updated);
          console.log(
            '💾 Слово добавлено в найденные:',
            currentTargetId
          );
        }

        chooseNextTarget(currentWordSet, parsed[currentWordSet.id]);

        if (unlockedWord) {
          setJustFoundWord(unlockedWord);
          setJustFoundVisible(true);
        }
      } catch (e) {
        console.log('Ошибка сохранения найденного слова', e);
      }
    }

    if (trimmed.length > 0) {
      actions.addWord();
      if (trimmed.length > 2) {
        actions.addScore((trimmed.length - 2) * 50);
      }
    }

    actions.resume();
    playBackgroundMusic();
  };

  // ========================================
  // 🐛 DEBUG
  // ========================================
  const debugActions = {
    moveLeft: () => actions.moveTetromino(-1, 0),
    moveRight: () => actions.moveTetromino(1, 0),
    moveDown: () => actions.moveTetromino(0, 1),
    rotate: () => {
      playSound('rotate');
      actions.rotateTetromino();
    },
    addLine: () => {
      playSound('line_clear');
      actions.addLines(1);
    },
    addLevel: () => {
      playSound('level_up');
      actions.levelUp();
    },
    addScore: () => actions.addScore(100),
    toggleHold: () => actions.setCanHold(!gameState.canHold),
    spawnNew: () => actions.spawnNew(),
  };

  const recognitionBoard = React.useMemo(
    () =>
      gameState.board.map((row) =>
        row.map((cell) => ({
          letter: cell?.letter ?? '',
          tetrominoId: (cell as any)?.tetrominoId ?? null,
        }))
      ),
    [gameState.board]
  );

  // ========================================
  // 🎨 РЕНДЕРИНГ
  // ========================================
  return (
    <ImageBackground
      source={require('../../assets/images/blue_darkblue_bgshort.png')}
      style={styles.backgroundImage}
      imageStyle={styles.gameImageStyle}
    >
      <View style={styles.container}>
        <StatusBar hidden />

        {/* Панель статистики */}
        <View style={statPanel.container}>
          <View style={statPanel.box}>
            <Text style={statPanel.label}>ЛИНИИ</Text>
            <Text style={statPanel.value}>{gameState.linesCleared}</Text>
          </View>
          <View style={statPanel.box}>
            <Text style={statPanel.label}>УРОВЕНЬ</Text>
            <Text style={statPanel.value}>{gameState.level}</Text>
          </View>
          <View style={statPanel.box}>
            <Text style={statPanel.label}>ОЧКИ</Text>
            <Text style={statPanel.value}>{gameState.score}</Text>
          </View>
          <View style={statPanel.box}>
            <Text style={statPanel.label}>ЦЕЛЬ</Text>
            <Text style={statPanel.value}>
              {currentTargetWord ?? '—'}
            </Text>
          </View>
        </View>

        {/* Кнопки управления */}
        <View style={controls.container}>
          <TouchableOpacity
            onPress={handlePause}
            style={controls.button}
          >
            <MaterialCommunityIcons
              name={
                gameState.isPaused ? 'play-box-outline' : 'pause-box-outline'
              }
              size={28}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDebug(!showDebug)}
            style={controls.button}
          >
            <MaterialCommunityIcons
              name="bug"
              size={28}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Игровая площадка */}
        <View style={gameArea.container}>
          {/* Правая панель */}
          <View style={gameArea.rightPanel}>
            <View style={gameArea.section}>
              <Text style={gameArea.sectionTitle}>КАРМАН</Text>
              <TouchableOpacity
                onPress={handleHold}
                disabled={
                  !gameState.canHold ||
                  isControlsDisabled ||
                  gameState.isPaused
                }
                style={
                  !gameState.canHold ||
                  isControlsDisabled ||
                  gameState.isPaused
                    ? gameArea.disabled
                    : undefined
                }
              >
                <TetrominoBox
                  tetromino={gameState.heldTetromino}
                  size="medium"
                  showLetters={true}
                />
              </TouchableOpacity>
            </View>

            <View style={gameArea.section}>
              <Text style={gameArea.sectionTitle}>СЛЕДУЮЩИЕ</Text>
              <View style={gameArea.nextFigures}>
                {gameState.nextTetrominos.slice(0, 3).map((tetromino, index) => (
                  <TetrominoBox
                    key={index}
                    tetromino={tetromino}
                    size="small"
                    showLetters={false}
                  />
                ))}
              </View>
            </View>

            <View style={gameArea.section}>
              <TouchableOpacity
                onPress={handleActivateRecognitionMode}
                disabled={gameState.isGameOver}
                style={
                  gameState.isGameOver ? gameArea.disabled : undefined
                }
              >
                <Text style={gameArea.sectionTitle}>🔍 СЛОВО</Text>
                {recognitionModeActive && (
                  <Text
                    style={[
                      gameArea.sectionTitle,
                      { fontSize: 10 },
                    ]}
                  >
                    {recognitionTimer}s
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Центр с игрой */}
          <View
            style={gameArea.center}
            {...touchControls.panHandlers}
          >
            <TetrisBoard
              board={gameState.board}
              currentTetromino={gameState.currentTetromino}
            />
          </View>
        </View>

        {/* Оверлей таймера */}
        {countdownTime !== null && (
          <View style={countdownOverlay.container}>
            <Text style={countdownOverlay.text}>{countdownTime}</Text>
          </View>
        )}

        {/* Debug панель */}
        {showDebug && (
          <View style={debugPanel.container}>
            <Text style={debugPanel.title}>DEBUG PANEL</Text>
            <View style={debugPanel.row}>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.moveLeft}
              >
                <Text>{'<-'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.moveRight}
              >
                <Text>{'->'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.moveDown}
              >
                <Text>{'v'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.rotate}
              >
                <Text>ROT</Text>
              </TouchableOpacity>
            </View>
            <View style={debugPanel.row}>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.addLine}
              >
                <Text>+1 Line</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.addLevel}
              >
                <Text>+1 Level</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.addScore}
              >
                <Text>+100 Score</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.spawnNew}
              >
                <Text>New Fig</Text>
              </TouchableOpacity>
            </View>
            <View style={debugPanel.row}>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={debugActions.toggleHold}
              >
                <Text>Hold: {gameState.canHold ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={handleRestart}
              >
                <Text>Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Меню паузы */}
        <Modal visible={showPauseMenu} transparent animationType="fade">
          <View style={pauseMenu.overlay}>
            <View style={pauseMenu.container}>
              <Text style={pauseMenu.title}>ПАУЗА</Text>

              <TouchableOpacity
                style={pauseMenu.button}
                onPress={handlePause}
              >
                <Text style={pauseMenu.buttonText}>ПРОДОЛЖИТЬ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={pauseMenu.button}
                onPress={handleRestart}
              >
                <Text style={pauseMenu.buttonText}>ЗАНОВО</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={pauseMenu.button}
                onPress={handleExitRequest}
              >
                <Text style={pauseMenu.buttonText}>ГЛАВНОЕ МЕНЮ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={pauseMenu.button}
                onPress={() => setShowDebug(true)}
              >
                <Text style={pauseMenu.buttonText}>DEBUG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Диалог выхода */}
        <Modal visible={showExitConfirm} transparent animationType="fade">
          <View style={exitConfirmModal.overlay}>
            <View style={exitConfirmModal.container}>
              <Text style={exitConfirmModal.title}>Сохранить игру?</Text>
              <Text style={exitConfirmModal.message}>
                Вы можете продолжить позже, если сохраните.
              </Text>

              <TouchableOpacity
                style={exitConfirmModal.button}
                onPress={handleExitWithSave}
              >
                <Text style={exitConfirmModal.buttonText}>
                  💾 СОХРАНИТЬ И ВЫЙТИ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={exitConfirmModal.button}
                onPress={handleExitWithoutSave}
              >
                <Text style={exitConfirmModal.buttonText}>
                  ВЫЙТИ БЕЗ СОХРАНЕНИЯ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={exitConfirmModal.cancelButton}
                onPress={() => setShowExitConfirm(false)}
              >
                <Text style={exitConfirmModal.cancelButtonText}>
                  ОТМЕНА
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Game Over */}
        <Modal visible={gameState.isGameOver} transparent animationType="fade">
          <View style={gameOverModal.overlay}>
            <View style={gameOverModal.container}>
              <Text style={gameOverModal.title}>ИГРА ОКОНЧЕНА</Text>
              <View style={gameOverModal.statsContainer}>
                <View style={gameOverModal.statRow}>
                  <Text style={gameOverModal.statLabel}>ОЧКИ:</Text>
                  <Text style={gameOverModal.statValue}>
                    {gameState.score}
                  </Text>
                </View>
                <View style={gameOverModal.statRow}>
                  <Text style={gameOverModal.statLabel}>УРОВЕНЬ:</Text>
                  <Text style={gameOverModal.statValue}>
                    {gameState.level}
                  </Text>
                </View>
                <View style={gameOverModal.statRow}>
                  <Text style={gameOverModal.statLabel}>ЛИНИИ:</Text>
                  <Text style={gameOverModal.statValue}>
                    {gameState.linesCleared}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={gameOverModal.button}
                onPress={handleRestart}
              >
                <Text style={gameOverModal.buttonText}>ИГРАТЬ ЗАНОВО</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={gameOverModal.cancelButton}
                onPress={handleExitRequest}
              >
                <Text style={gameOverModal.cancelButtonText}>
                  В ГЛАВНОЕ МЕНЮ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Карточка только что найденного слова */}
        <WordCard
          visible={justFoundVisible}
          word={justFoundWord}
          onClose={() => {
            setJustFoundVisible(false);
            setJustFoundWord(null);
          }}
        />

        {/* Режим разгадывания */}
        <RecognitionModeOverlay
          isVisible={recognitionModeActive}
          board={recognitionBoard}
          timerRemaining={recognitionTimer}
          onClose={handleRecognitionClose}
          onTimerTick={() => setRecognitionTimer(120)}
        />
      </View>
    </ImageBackground>
  );
}

// ========================================
// 🎨 СТИЛИ
// ========================================
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  gameImageStyle: {
    resizeMode: 'repeat',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const statPanel = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  box: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

const controls = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 25,
  },
  button: {
    padding: 8,
  },
});

const gameArea = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  rightPanel: {
    width: 80,
  },
  section: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
  },
  nextFigures: {
    alignItems: 'center',
    gap: 2,
  },
  disabled: {
    opacity: 0.4,
  },
});

const debugPanel = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  button: {
    flex: 1,
    marginHorizontal: 2,
    padding: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
  },
});

const pauseMenu = StyleSheet.create({
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
    minWidth: 250,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const exitConfirmModal = StyleSheet.create({
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
    backgroundColor: '#4CAF50',
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

const countdownOverlay = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  text: {
    fontSize: 120,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
});

const gameOverModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#222',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 300,
    borderWidth: 3,
    borderColor: '#ff4444',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    minWidth: '100%',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  button: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    minWidth: 250,
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
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
  },
});
