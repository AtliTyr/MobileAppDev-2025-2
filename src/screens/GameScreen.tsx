// src/screens/GameScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TetrisBoard from '../components/TetrisBoard';
import TetrominoBox from '../components/TetrominoBox';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameState } from '../hooks/useGameState';
import { useTouchGameControls } from '../hooks/useTouchGameControls';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ navigation, route }: Props) {
  const savedGameData = route.params?.savedGameData;
  const { gameState, actions } = useGameState(
    savedGameData?.config,
    savedGameData?.gameState
  );
  const { saveGame, clearSavedGame } = useGamePersistence();
  const [showDebug, setShowDebug] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [isControlsDisabled, setIsControlsDisabled] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для запуска таймера обратного отсчёта
  const startCountdown = useCallback((duration: number = 3) => {
    setCountdownTime(duration);
    setIsControlsDisabled(true);

    let remaining = duration;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdownTime(remaining);

      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdownTime(null);
        setIsControlsDisabled(false);
        actions.resume();
      }
    }, 1000);
  }, [actions]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Swipe back жесты открывают меню паузы
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Проверяем, это ли swipe back жест (а не явный navigate)
      if (e.data.action.type === 'GO_BACK') {
        // Блокируем выход и открываем меню паузы
        e.preventDefault();
        handlePause();
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Автопауза с таймером при загрузке
  React.useEffect(() => {
    actions.pause();
    startCountdown(3);
  }, []);

  // Обработчики для свайпов - БЕЗ проверок, просто вызываем actions
  const touchControls = useTouchGameControls({
    onMoveLeft: () => {
      console.log('LEFT swipe handler called');
      if (!isControlsDisabled && !gameState.isPaused) {
        actions.moveTetromino(-1, 0);
      }
    },
    onMoveRight: () => {
      console.log('RIGHT swipe handler called');
      if (!isControlsDisabled && !gameState.isPaused) {
        actions.moveTetromino(1, 0);
      }
    },
    onRotate: () => {
      console.log('ROTATE (UP) handler called');
      if (!isControlsDisabled && !gameState.isPaused) {
        actions.rotateTetromino();
      }
    },
    onHardDrop: () => {
      console.log('HARD DROP handler called');
      if (!isControlsDisabled && !gameState.isPaused) {
        actions.hardDrop();
      }
    },
    onSoftDrop: (speed: Number) => {
      console.log('SOFT DROP handler called, speed:', speed);
      if (!isControlsDisabled && !gameState.isPaused) {
        actions.moveTetromino(0, 1);
      }
    },
  });

  const handlePause = () => {
    if (gameState.isPaused && showPauseMenu) {
      // Закрываем меню паузы и запускаем таймер
      setShowPauseMenu(false);
      startCountdown(3);
    } else {
      // Открываем меню паузы
      actions.pause();
      setShowPauseMenu(true);
    }
  };

  const handleHold = () => {
    if (!isControlsDisabled && !gameState.isPaused) {
      actions.holdTetromino();
    }
  };

  const handleRestart = async () => {
    actions.restart();
    await clearSavedGame();
    setShowPauseMenu(false);

    // Запускаем автопаузу с таймером
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
    navigation.navigate('Home');
  };

  const handleExitWithoutSave = async () => {
    await clearSavedGame();
    actions.restart();
    setShowExitConfirm(false);
    setShowPauseMenu(false);
    navigation.navigate('Home');
  };

  const debugActions = {
    moveLeft: () => actions.moveTetromino(-1, 0),
    moveRight: () => actions.moveTetromino(1, 0),
    moveDown: () => actions.moveTetromino(0, 1),
    rotate: () => actions.rotateTetromino(),
    addLine: () => actions.addLines(1),
    addLevel: () => actions.levelUp(),
    addScore: () => actions.addScore(100),
    toggleHold: () => actions.setCanHold(!gameState.canHold),
    spawnNew: () => actions.spawnNew(),
  };

  return (
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
            color="#333"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={controls.button}>
          <MaterialCommunityIcons
            name="bug"
            size={28}
            color="#333"
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
  );
}

// Стили...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#333',
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
