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
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// import TetrisBoard from '../components/TetrisBoard';
import TetrisBoard, { TetrisBoardHandle } from '../components/TetrisBoard';
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

export type CelebrationType = 'tetris' | 'word' | 'level_up' | null;

export default function GameScreen({ navigation, route }: Props) {
  // ========================================
  // 🔧 ИНИЦИАЛИЗАЦИЯ
  // ========================================
  const savedGameData = route.params?.savedGameData;
  const routeWordSetId = route.params?.wordSetId;

  const { saveGame, clearSavedGame, getStats, updateStats, resetStats } = useGamePersistence();
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


  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const loadBest = async () => {
      const stats = await getStats();
      if (stats && typeof stats.bestScore === 'number') {
        setBestScore(stats.bestScore);
      }
    };
    loadBest();
  }, [getStats]);

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
    savedGameData?.gameState,  // ✅ Передаём сохранённое состояние
    (clearedLines) => {
      if (!boardRef.current) return;
      if (clearedLines === 4) {
        boardRef.current.celebrate();
        triggerCelebration('tetris');
      } else {
        boardRef.current.shake();
      }
    },
    () => {
      console.log('🆙 Level Up!');
      triggerCelebration('level_up');
    }
  );

  useEffect(() => {
    if (!gameState.isGameOver) return;

    const applyStats = async () => {
      await updateStats(
        gameState.score,
        gameState.level,
        gameState.linesCleared,
        gameState.wordsFormed
      );

      // сразу подхватить новое значение bestScore
      const stats = await getStats();
      if (stats && typeof stats.bestScore === 'number') {
        setBestScore(stats.bestScore);
      }
    };

    applyStats();
  }, [gameState.isGameOver]);

  // ✨ Карточка только что найденного слова
  const [justFoundWord, setJustFoundWord] = useState<WordData | null>(null);
  const [justFoundVisible, setJustFoundVisible] = useState(false);
  
  
  const [celebrationType, setCelebrationType] = useState<CelebrationType>(null);  
  const [celebrationOpacity] = useState(new Animated.Value(1));
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Удалите эту строку:
// const [emojiParticles, setEmojiParticles] = useState<EmojiParticle[]>([]);



  // ========================================
  // 📍 REFS
  // ========================================
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundMusicStartedRef = useRef(false);
  const stateRef = useRef({
    isControlsDisabled,
    isPaused: gameState.isPaused,
  });

  const boardRef = useRef<TetrisBoardHandle | null>(null);

  const celebrationText = (type: CelebrationType) => {
    switch(type) {
      case 'tetris':
        return 'TETRIS';
      case 'word':
        return 'НОВОЕ СЛОВО';
      case 'level_up':
        return 'ПОВЫШЕНИЕ УРОВНЯ';
      default:
        return '';
    }
  };

  const triggerCelebration = useCallback((type: CelebrationType) => {
    if (!type) return;

    console.log('🎉 triggerCelebration', type);
    
    setCelebrationType(type);
    celebrationOpacity.setValue(1);

    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current);
    }

    // Запускаем анимацию fade-out
    Animated.timing(celebrationOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    celebrationTimeoutRef.current = setTimeout(() => {
      setCelebrationType(null);
      celebrationTimeoutRef.current = null;
    }, 1000);
  }, []);

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

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, []);

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

        if (boardRef.current) {
          boardRef.current.celebrate();
        }

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

        triggerCelebration('word');

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
    addScoreCustom: (score: number) => actions.addScore(score),
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
          <View style={statPanel.leftContainer}>
            <View style={statPanel.leftInnerContainer}>
              <View style={statPanel.box}>
                <Text style={statPanel.label}>ЛИНИИ</Text>
                <Text style={statPanel.value}>{gameState.linesCleared}</Text>
              </View>
              <View style={statPanel.box}>
                <Text style={statPanel.label}>УРОВЕНЬ</Text>
                <Text style={statPanel.value}>{gameState.level}</Text>
              </View>
            </View>
            <View style={statPanel.targetBox}>
              <Text style={statPanel.label}>ЦЕЛЬ</Text>
              <View style={statPanel.targetValueWrapper}>
                <Text
                  style={statPanel.targetValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  // adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {currentTargetWord ?? '—'}
                </Text>
              </View>
            </View>


          </View>
          <View style={statPanel.scoreBox}>
            {gameState.score < bestScore ? (
              <>
              <Text style={statPanel.scoreLabel}>{ bestScore }</Text>
              <Text style={statPanel.scoreValue}>{gameState.score}</Text>
              </>
            ) : (
              <Text style={statPanel.bestScoreValue}>👑 {gameState.score}</Text>

            )}
            
          </View>
        </View>
          

        <View style={topControls.container}>
          {/* Слева: пауза + debug */}
          <View style={pausePanel.container}>
            <TouchableOpacity
              onPress={handlePause}
              style={controls.button}
            >
              <MaterialCommunityIcons
                name={gameState.isPaused ? 'play-box-outline' : 'pause-box-outline'}
                size={28}
                color="#111"
                style={pausePanel.pauseIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDebug(!showDebug)}
              style={controls.button}
            >
              <MaterialCommunityIcons
                name="bug"
                size={28}
                color="#111"
              />
            </TouchableOpacity>
          </View>

          {/* Справа: поиск слова */}
          <View style={searchPanel.container}>
            <TouchableOpacity
              onPress={handleActivateRecognitionMode}
              disabled={gameState.isGameOver}
              style={[gameState.isGameOver ? gameArea.disabled : undefined, controls.button]}
            >
              <Text style={searchPanel.searchText}>🔍 СЛОВО</Text>
              {recognitionModeActive && (
                <Text
                  style={[
                    gameArea.sectionTitle,
                    { fontSize: 28 },
                  ]}
                >
                  {recognitionTimer}s
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Игровая площадка */}
        <View style={gameArea.container}>
          {/* Правая панель */}
          <View style={gameArea.rightPanel}>
            <View style={[gameArea.box, {width: 75}]}>
              <Text style={gameArea.label}>КАРМАН</Text>
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
                  showLetters={true}
                  containerStyle={{backgroundColor: '#6096BA'}}
                />
              </TouchableOpacity>
            </View>

            <View style={gameArea.box}>
              <Text style={gameArea.label}>СЛЕДУЮЩИЕ</Text>
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
          </View>

          {/* Центр с игрой */}
          <View
            style={gameArea.center}
            {...touchControls.panHandlers}
          >
            <TetrisBoard
              ref={boardRef}
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
                onPress={() => debugActions.addScoreCustom(1000)}
              >
                <Text>+1000 Score</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={debugPanel.button}
                onPress={() => debugActions.addScoreCustom(1000000)}
              >
                <Text>+10000 Score</Text>
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
              <TouchableOpacity
                style={debugPanel.button}
                onPress={resetStats}
              >
                <Text>Reset score</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Меню паузы */}
        <Modal visible={showPauseMenu} transparent animationType="fade">
          <View style={pauseMenu.overlay}>
            {/* Наклоняем только внешний каркас */}
            <View style={pauseMenu.cardShadow}>
              <View style={pauseMenu.tilted}>
                {/* Внутренний контейнер без наклона */}
                <View style={pauseMenu.container}>
                  {/* Заголовок */}
                  <Text style={pauseMenu.title}>ПАУЗА</Text>

                  {/* Целевое слово: его можно оставить наклонённым, если хочешь */}
                  <View style={pauseMenu.targetOuter}>
                    <View style={pauseMenu.targetTilted}>
                      <View style={pauseMenu.targetBox}>
                        <Text style={pauseMenu.targetLabel}>ЦЕЛЕВОЕ СЛОВО</Text>
                        <View style={pauseMenu.targetValueWrapper}>
                          <Text
                            style={pauseMenu.targetValue}
                            numberOfLines={2}
                          >
                            {currentTargetWord ?? '—'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Кнопки (ровные) */}
                  <View style={pauseMenu.buttonsColumn}>
                    <TouchableOpacity
                      style={pauseMenu.buttonPrimary}
                      onPress={handlePause}
                    >
                      <Text style={pauseMenu.buttonPrimaryText}>ПРОДОЛЖИТЬ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={pauseMenu.buttonSecondary}
                      onPress={handleRestart}
                    >
                      <Text style={pauseMenu.buttonSecondaryText}>ЗАНОВО</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={pauseMenu.buttonSecondary}
                      onPress={handleExitRequest}
                    >
                      <Text style={pauseMenu.buttonSecondaryText}>
                        ГЛАВНОЕ МЕНЮ
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Диалог выхода */}
        <Modal visible={showExitConfirm} transparent animationType="fade">
          <View style={exitConfirmModal.overlay}>
            <View style={exitConfirmModal.cardShadow}>
              <View style={exitConfirmModal.tilted}>
                <View style={exitConfirmModal.container}>
                  {/* Крестик в правом верхнем углу */}
                  <TouchableOpacity
                    style={exitConfirmModal.closeButton}
                    hitSlop={{ top: 24, right: 24, bottom: 24, left: 24 }}
                    onPress={() => setShowExitConfirm(false)}
                  >
                    <Text style={exitConfirmModal.closeButtonText}>✕</Text>
                  </TouchableOpacity>

                  <Text style={exitConfirmModal.title}>Сохранить игру?</Text>

                  <Text style={exitConfirmModal.message}>
                    Вы можете продолжить позже, если сохраните.
                  </Text>

                  <TouchableOpacity
                    style={exitConfirmModal.buttonPrimary}
                    onPress={handleExitWithSave}
                  >
                    <Text style={exitConfirmModal.buttonPrimaryText}>
                      💾 СОХРАНИТЬ И ВЫЙТИ
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={exitConfirmModal.buttonSecondary}
                    onPress={handleExitWithoutSave}
                  >
                    <Text style={exitConfirmModal.buttonSecondaryText}>
                      ВЫЙТИ БЕЗ СОХРАНЕНИЯ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Game Over */}
        <Modal visible={gameState.isGameOver} transparent animationType="fade">
          <View style={gameOverModal.overlay}>
            <View style={gameOverModal.cardShadow}>
              <View style={gameOverModal.tilted}>
                <View style={gameOverModal.container}>
                  {/* Заголовок */}
                  <Text style={gameOverModal.title}>ИГРА ОКОНЧЕНА</Text>

                  {/* Итоговый счёт / рекорд */}
                  <View style={gameOverModal.scoreBox}>
                    <Text style={gameOverModal.scoreLabel}>ОЧКИ</Text>
                    <Text style={gameOverModal.scoreValue}>{gameState.score}</Text>
                    <Text style={gameOverModal.bestScoreHint}>
                      ЛУЧШИЙ: {bestScore}
                    </Text>
                  </View>

                  {/* Краткая статистика */}
                  <View style={gameOverModal.statsContainer}>
                    <View style={gameOverModal.statRow}>
                      <Text style={gameOverModal.statLabel}>УРОВЕНЬ</Text>
                      <Text style={gameOverModal.statValue}>
                        {gameState.level}
                      </Text>
                    </View>
                    <View style={gameOverModal.statRow}>
                      <Text style={gameOverModal.statLabel}>ЛИНИИ</Text>
                      <Text style={gameOverModal.statValue}>
                        {gameState.linesCleared}
                      </Text>
                    </View>
                    <View style={gameOverModal.statRow}>
                      <Text style={gameOverModal.statLabel}>СЛОВА</Text>
                      <Text style={gameOverModal.statValue}>
                        {gameState.wordsFormed}
                      </Text>
                    </View>
                  </View>

                  {/* Кнопки */}
                  <View style={gameOverModal.buttonsColumn}>
                    <TouchableOpacity
                      style={gameOverModal.buttonPrimary}
                      onPress={handleRestart}
                    >
                      <Text style={gameOverModal.buttonPrimaryText}>
                        ИГРАТЬ ЗАНОВО
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={gameOverModal.buttonSecondary}
                      onPress={handleExitRequest}
                    >
                      <Text style={gameOverModal.buttonSecondaryText}>
                        В ГЛАВНОЕ МЕНЮ
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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

        {celebrationType && (
          <Animated.View
            style={[
              celebrationOverlay.container,
              { opacity: celebrationOpacity }
            ]}
            pointerEvents="none"
          >
            <View style={celebrationOverlay.centerWrapper}>
              <View style={celebrationOverlay.center}>
                <Text style={celebrationOverlay.title}>
                  { celebrationText(celebrationType) }
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

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
    backgroundColor: '#A3CEF1',
    flexDirection: 'row',
    paddingHorizontal: '8%',
    paddingTop: '10%',
    paddingBottom: '5%',
    width: '110%',
    left: '-5%',
    top: '-3%',
    gap: 16,
    alignItems: 'flex-start',
    transform: [{ rotate: '-5deg' }],
    marginBottom: 5,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    height: '19.5%',
  },
  leftContainer: {
    flexDirection: 'column',
    width: '50%',
    height: '90%',
    top: '-5%',
    gap: 8,
  },
  leftInnerContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  box: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
  },

  targetBox: {
    width: '100%',
    // убираем flex/height/top/transform тут
    borderWidth: 3,
    borderColor: '#0D1B2A',
    backgroundColor: '#0D1B2A', // тот же цвет, что и label
    overflow: 'hidden',
  },

  label: {
    backgroundColor: '#0D1B2A',
    color: '#E7ECEF',
    textAlign: 'center',
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    fontSize: 13,
    paddingVertical: 2,
  },

  targetValueWrapper: {
    backgroundColor: '#6096BA',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  targetValue: {
    color: '#111',
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
  },

  scoreBox: {
    alignSelf: 'center',
    width: '45%',
    top: '10%',
    borderColor: '#0D1B2A',
    borderWidth: 2,
    backgroundColor: '#A3CEF1',
  },
  // label: {
  //   backgroundColor: '#0D1B2A',
  //   color: '#E7ECEF',
  //   textAlign: 'center',
  //   fontFamily: 'Unbounded',
  //   fontWeight: 'bold',
  //   fontSize: 13,
  // },
  value: {
    backgroundColor: '#6096BA',
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
  },
  scoreLabel: {
    backgroundColor: '#0D1B2A',
    textAlign: 'center',
    fontSize: 18,
    color: '#E7ECEF',
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
  },
  scoreValue: {
    color: '#111',
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
  },
  bestScoreValue: {
    color: '#111',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'Unbounded',
  },
});


const topControls = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between', // слева/справа
    alignItems: 'center',            // одна высота по вертикали
    // paddingHorizontal: 16,
    width: '110%',
    left: '-5%',
    marginBottom: 10,
  },
});

const pausePanel = StyleSheet.create({
  container: {
    backgroundColor: '#A3CEF1',
    // paddingHorizontal: 8,
    // paddingVertical: 4,
    marginLeft: 16,
    borderWidth: 3,
    flexDirection: 'row',
    // justifyContent: 'center',
    // gap: 6,
    transform: [{ rotate: '-5deg' }],
  },
  pauseIcon: {
    // можно чуть подвинуть иконку внутри, но без процентов
    // marginLeft: 10,
  },
});

const searchPanel = StyleSheet.create({
  container: {
    backgroundColor: '#A3CEF1',
    // paddingHorizontal: 8,
    // paddingVertical: 4,
    // marginLeft: 8,
    width: '25%',
    borderWidth: 3,
    flexDirection: 'row',
    top: '-55%',
    marginRight: 16,
    // justifyContent: 'center',
    // gap: 6,
    transform: [{ rotate: '-5deg' }],
  },
  searchText: {
    fontSize: 18,
    fontWeight: 'bold',
    // marginBottom: 8,
    color: '#111',
    textAlign: 'center',
  }
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
    marginTop: 5,
    marginLeft: 15,
  },
  rightPanel: {
    marginTop: 10,
    gap: 20,
    width: 80,
    alignItems: 'center'
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
    // gap: 2,
  },
  disabled: {
    opacity: 0.4,
  },
  box: {
    outlineWidth: 3,
    outlineColor: '#0D1B2A',

    backgroundColor: '#6096BA',
    width: 65,
    minHeight: 65,
  },
  label: {
    backgroundColor: '#0D1B2A',
    color: '#E7ECEF',
    textAlign: 'center',
    fontFamily: 'Unbounded',
    fontSize: 10,
    fontWeight: 'bold',
    padding: 1
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
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  // наклоняем только этот слой
  tilted: {
    transform: [{ rotate: '-4deg' }],
  },
  // внутренний блок — без наклона, ровный контент
  container: {
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minWidth: 260,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Unbounded',
    color: '#0D1B2A',
    textAlign: 'center',
    marginBottom: 14,
  },

  // блок целевого слова
  targetOuter: {
    marginBottom: 30,
  },
  // если хочешь цель тоже наклонённой — оставляем этот rotate
  targetTilted: {
    transform: [{ rotate: '-3deg' }],
  },
  targetBox: {
    borderWidth: 3,
    borderColor: '#0D1B2A',
    backgroundColor: '#0D1B2A',
    overflow: 'hidden',
  },
  targetLabel: {
    backgroundColor: '#0D1B2A',
    color: '#E7ECEF',
    textAlign: 'center',
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    fontSize: 12,
    paddingVertical: 2,
  },
  targetValueWrapper: {
    backgroundColor: '#6096BA',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  targetValue: {
    color: '#111',
    textAlign: 'center',
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    fontSize: 18,
  },

  buttonsColumn: {
    marginTop: 4,
    gap: 8,
    transform: [{rotate: '3deg'}]
  },

  buttonPrimary: {
    backgroundColor: '#0D1B2A',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#E7ECEF',
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
  },

  buttonSecondary: {
    backgroundColor: '#6096BA',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#111',
    fontSize: 15,
    fontFamily: 'Unbounded',
    fontWeight: '900',
  },
});

const exitConfirmModal = StyleSheet.create({
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
    transform: [{ rotate: '-3deg' }],
  },
  container: {
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minWidth: 280,
    alignItems: 'stretch',
  },

  // крестик
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 4,
    paddingVertical: 0,
    backgroundColor: '#6096BA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0D1B2A',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Unbounded',
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

  buttonPrimary: {
    backgroundColor: '#0D1B2A',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonPrimaryText: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
    textAlign: 'center',
  },

  buttonSecondary: {
    backgroundColor: '#6096BA',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 4,
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  tilted: {
    transform: [{ rotate: '-4deg' }],
  },
  container: {
    backgroundColor: '#0D1B2A', // тёмно‑синий
    borderWidth: 3,
    borderColor: '#6096BA',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 20,
    minWidth: 290,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'Unbounded',
    color: '#A3CEF1',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // блок итогового счёта
  scoreBox: {
    borderWidth: 3,
    borderColor: '#6096BA',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFE066',
    marginBottom: 4,
  },
  bestScoreHint: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#A3CEF1',
  },

  statsContainer: {
    backgroundColor: '#1B263B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#415A77',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#A3CEF1',
    fontFamily: 'Unbounded',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E7ECEF',
    fontFamily: 'Unbounded',
  },

  buttonsColumn: {
    marginTop: 4,
    gap: 8,
    transform: [{ rotate: '3deg' }],
  },
  buttonPrimary: {
    backgroundColor: '#6096BA',
    borderWidth: 3,
    borderColor: '#6096BA',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonPrimaryText: {
    color: '#0D1B2A',
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: '#0D1B2A',
    borderWidth: 3,
    borderColor: '#6096BA',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonSecondaryText: {
    color: '#E7ECEF',
    fontSize: 15,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
  },
});

const celebrationOverlay = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  centerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    fontFamily: 'Unbounded',
    color: '#FFE066',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});