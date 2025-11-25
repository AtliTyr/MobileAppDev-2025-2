// src/screens/GameScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, Modal, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TetrisBoard from '../components/TetrisBoard';
import TetrominoBox from '../components/TetrominoBox';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameState } from '../hooks/useGameState';
import { useTouchGameControls } from '../hooks/useTouchGameControls';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { useAudioManager } from '../hooks/useAudioManager';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ navigation, route }: Props) {
  const savedGameData = route.params?.savedGameData;
  const { gameState, actions } = useGameState(
    savedGameData?.config,
    savedGameData?.gameState
  );
  const { saveGame, clearSavedGame } = useGamePersistence();
  const { playSound, playBackgroundMusic, stopBackgroundMusic } = useAudioManager();
  
  const [showDebug, setShowDebug] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [isControlsDisabled, setIsControlsDisabled] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundMusicStartedRef = useRef(false);

  // Функция для запуска таймера обратного отсчёта
  const startCountdown = useCallback((duration: number = 3) => {
    console.log(`⏱️ Таймер начат на ${duration} сек, isControlsDisabled = true`);
    
    setCountdownTime(duration);
    setIsControlsDisabled(true);

    let remaining = duration;
    
    // Очищаем старый таймер если он есть
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
        setIsControlsDisabled(false); // ГЛАВНОЕ - это отключает блокировку
        actions.resume();
        
        // Запускаем фоновую музыку при старте игры
        if (!backgroundMusicStartedRef.current) {
          console.log('🎵 Запускаем фоновую музыку');
          playBackgroundMusic();
          backgroundMusicStartedRef.current = true;
        }
      }
    }, 1000);
  }, [actions, playBackgroundMusic]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      console.log('🧹 GameScreen размонтируется, очищаем таймер');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setIsControlsDisabled(false); // Убедимся, что управление включено
      stopBackgroundMusic();
    };
  }, [stopBackgroundMusic]);

  // Swipe back жесты открывают меню паузы
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        handlePause();
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Автопауза с таймером при загрузке
  React.useEffect(() => {
    console.log('📱 GameScreen загружен, ставим паузу и запускаем таймер');
    actions.pause();
    startCountdown(3);
    
    // Очищаем флаг музыки только если это новая игра
    if (!savedGameData) {
      backgroundMusicStartedRef.current = false;
    }
  }, []); // Зависимости пустые - это правильно, чтобы запустилось только один раз

  // Обработчики для свайпов с ЗВУКАМИ
  const touchControls = useTouchGameControls({
    onMoveLeft: () => {
      const state = stateRef.current;
      console.log('LEFT swipe, state:', state);
      if (!state.isControlsDisabled && !state.isPaused) {
        console.log('✅ Moving left');
        playSound('move');
        actions.moveTetromino(-1, 0);
      } else {
        console.log('❌ Controls blocked, isControlsDisabled:', state.isControlsDisabled, 'isPaused:', state.isPaused);
      }
    },
    onMoveRight: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        console.log('✅ Moving right');
        playSound('move');
        actions.moveTetromino(1, 0);
      }
    },
    onRotate: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        console.log('✅ Rotating');
        playSound('rotate');
        actions.rotateTetromino();
      }
    },
    onHardDrop: () => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        console.log('✅ Hard drop');
        playSound('hard_drop');
        actions.hardDrop();
      }
    },
    onSoftDrop: (speed: number) => {
      const state = stateRef.current;
      if (!state.isControlsDisabled && !state.isPaused) {
        console.log('✅ Soft drop');
        playSound('move');
        actions.moveTetromino(0, 1);
      }
    },
  });


  const stateRef = useRef({ isControlsDisabled, isPaused: gameState.isPaused });

  useEffect(() => {
    stateRef.current = { isControlsDisabled, isPaused: gameState.isPaused };
  }, [isControlsDisabled, gameState.isPaused]);

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
    setShowExitConfirm(true);
  };

  const handleExitWithSave = async () => {
    await saveGame(gameState);
    actions.restart();
    setShowExitConfirm(false);
    setShowPauseMenu(false);
    stopBackgroundMusic();
    navigation.navigate('Home');
  };

  const handleExitWithoutSave = async () => {
    await clearSavedGame();
    actions.restart();
    setShowExitConfirm(false);
    setShowPauseMenu(false);
    stopBackgroundMusic();
    navigation.navigate('Home');
  };

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
        </View>

        {/* Кнопки управления */}
        <View style={controls.container}>
          <TouchableOpacity onPress={handlePause} style={controls.button}>
            <MaterialCommunityIcons
              name={gameState.isPaused ? 'play-box-outline' : 'pause-box-outline'}
              size={28}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={controls.button}>
            <MaterialCommunityIcons
              name="bug"
              size={28}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Основные игровые компоненты */}
        <View style={gameArea.container}>
          {/* Правая панель - карман и следующие фигуры */}
          <View style={gameArea.rightPanel}>
            {/* Карман */}
            <View style={gameArea.section}>
              <Text style={gameArea.sectionTitle}>КАРМАН</Text>
              <TouchableOpacity
                onPress={handleHold}
                disabled={!gameState.canHold || isControlsDisabled || gameState.isPaused}
                style={(!gameState.canHold || isControlsDisabled || gameState.isPaused) && gameArea.disabled}
              >
                <TetrominoBox
                  tetromino={gameState.heldTetromino}
                  size="medium"
                  showLetters={true}
                />
              </TouchableOpacity>
            </View>

            {/* Следующие фигуры */}
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
          </View>

          {/* Центр - игровое поле с обработчиками свайпов */}
          <View style={gameArea.center} {...touchControls.panHandlers}>
            <TetrisBoard
              board={gameState.board}
              currentTetromino={gameState.currentTetromino}
            />
          </View>
        </View>

        {/* Оверлей таймера обратного отсчёта */}
        {countdownTime !== null && (
          <View style={countdownOverlay.container}>
            <Text style={countdownOverlay.text}>{countdownTime}</Text>
          </View>
        )}

        {/* Дебаг панель */}
        {showDebug && (
          <View style={debugPanel.container}>
            <Text style={debugPanel.title}>DEBUG PANEL</Text>
            <View style={debugPanel.row}>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.moveLeft}>
                <Text>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.moveRight}>
                <Text>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.moveDown}>
                <Text>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.rotate}>
                <Text>↻</Text>
              </TouchableOpacity>
            </View>
            <View style={debugPanel.row}>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.addLine}>
                <Text>+1 Line</Text>
              </TouchableOpacity>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.addLevel}>
                <Text>+1 Level</Text>
              </TouchableOpacity>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.addScore}>
                <Text>+100 Score</Text>
              </TouchableOpacity>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.spawnNew}>
                <Text>New Fig</Text>
              </TouchableOpacity>
            </View>
            <View style={debugPanel.row}>
              <TouchableOpacity style={debugPanel.button} onPress={debugActions.toggleHold}>
                <Text>Hold: {gameState.canHold ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={debugPanel.button} onPress={handleRestart}>
                <Text>Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Меню паузы */}
        <Modal
          visible={showPauseMenu}
          transparent={true}
          animationType="fade"
        >
          <View style={pauseMenu.overlay}>
            <View style={pauseMenu.container}>
              <Text style={pauseMenu.title}>ПАУЗА</Text>

              <TouchableOpacity style={pauseMenu.button} onPress={handlePause}>
                <Text style={pauseMenu.buttonText}>ПРОДОЛЖИТЬ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={pauseMenu.button} onPress={handleRestart}>
                <Text style={pauseMenu.buttonText}>ЗАНОВО</Text>
              </TouchableOpacity>

              <TouchableOpacity style={pauseMenu.button} onPress={handleExitRequest}>
                <Text style={pauseMenu.buttonText}>ГЛАВНОЕ МЕНЮ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={pauseMenu.button} onPress={() => setShowDebug(true)}>
                <Text style={pauseMenu.buttonText}>DEBUG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal подтверждения выхода */}
        <Modal
          visible={showExitConfirm}
          transparent={true}
          animationType="fade"
        >
          <View style={exitConfirmModal.overlay}>
            <View style={exitConfirmModal.container}>
              <Text style={exitConfirmModal.title}>Сохранить игру?</Text>
              <Text style={exitConfirmModal.message}>
                Вы можете продолжить позже, если сохраните.
              </Text>

              <TouchableOpacity style={exitConfirmModal.button} onPress={handleExitWithSave}>
                <Text style={exitConfirmModal.buttonText}>💾 СОХРАНИТЬ И ВЫЙТИ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={exitConfirmModal.button} onPress={handleExitWithoutSave}>
                <Text style={exitConfirmModal.buttonText}>ВЫЙТИ БЕЗ СОХРАНЕНИЯ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={exitConfirmModal.cancelButton} onPress={() => setShowExitConfirm(false)}>
                <Text style={exitConfirmModal.cancelButtonText}>ОТМЕНА</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

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
  leftPanel: {
    width: 80,
    justifyContent: 'flex-start',
    paddingVertical: 10,
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
