import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, ImageBackground, Alert } from 'react-native';
import TetrisBoard from '../components/TetrisBoard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useGameState } from '../hooks/useGameState';
import { useGameSave } from '../hooks/useGameSave';
import { useGameLoop } from '../hooks/useGameLoop';

import TetrominoBox from '../components/TetrominoBox';


export default function GameScreen() {
  const { 
    gameState, 
    initializeGame, 
    togglePause, 
    holdPiece,
    movePiece,
    rotatePiece,
    loadGameState,
    updateScore,

    // Хуки для отладки
    setScore,
    addScore,
    setLevel,
    addLevel,
    setLines,
    addLines,
    clearBoard,
    setCurrentPiece,
    resetHold,
    skipToNextLevel,
    resetStats,
  } = useGameState();

  const { saveGame, deleteSave } = useGameSave();
  const [isSaving, setIsSaving] = useState(false);

  // Обработчик игрового тика (движение фигуры вниз)
  const handleGameTick = useCallback(() => {
    console.log('Game tick - moving piece down');
    movePiece('down');
  }, [movePiece]);
  // Обработчик очистки линий
  const handleLineClear = useCallback((clearedLines: number) => {
    console.log(`Cleared ${clearedLines} lines`);
    updateScore(clearedLines);
  }, [updateScore]);

  // Обработчик повышения уровня
  const handleLevelUp = useCallback((newLevel: number) => {
    console.log(`Level up to ${newLevel}`);
  }, []);

  // Обработчик конца игры
  const handleGameOver = useCallback(() => {
    console.log('Game over!');
    Alert.alert('Конец игры', `Ваш счет: ${gameState.score}`);
  }, [gameState.score]);

  // Хук игрового цикла
  const { startGameLoop, stopGameLoop } = useGameLoop({
    gameState,
    onGameTick: handleGameTick,
    onLineClear: handleLineClear,
    onLevelUp: handleLevelUp,
    onGameOver: handleGameOver,
  });

  // Инициализация игры
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Запуск/остановка игрового цикла при изменении состояния игры
  useEffect(() => {
    if (gameState.isGameOver) {
      console.log('Game over - stopping game loop');
      stopGameLoop();
      return;
    }

    if (gameState.isPaused) {
      console.log('Game paused - stopping game loop');
      stopGameLoop();
    } else {
      console.log('Game running - starting game loop');
      startGameLoop();
    }

    return () => {
      stopGameLoop();
    };
  }, [gameState.isPaused, gameState.isGameOver, startGameLoop, stopGameLoop]);

  // Функция сохранения и выхода
  const handleSaveAndExit = async () => {
    setIsSaving(true);
    stopGameLoop();
    
    const success = await saveGame(gameState);
    setIsSaving(false);
    
    if (success) {
      Alert.alert('Успех', 'Игра сохранена!');
    } else {
      Alert.alert('Ошибка', 'Не удалось сохранить игру');
      if (!gameState.isPaused && !gameState.isGameOver) {
        startGameLoop();
      }
    }
  };

  // Обработчик паузы
  const handlePause = () => {
    togglePause();
  };

  // Отладочная информация
  useEffect(() => {
    console.log('Game state updated:', {
      isPaused: gameState.isPaused,
      isGameOver: gameState.isGameOver,
      gameSpeed: gameState.gameSpeed
    });
  }, [gameState.isPaused, gameState.isGameOver, gameState.gameSpeed]);

  // Функция выхода без сохранения
  const handleExitWithoutSave = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти без сохранения?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          style: 'destructive',
          onPress: () => {
            deleteSave(); // Удаляем старое сохранение
            // Выход в главное меню через навигацию
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={statPanel.container}>
        <View style={statPanel.box}>
          <Text style={statPanel.label}>ЛИНИИ</Text>
          <Text style={statPanel.value}>{gameState.lines}</Text>
        </View>
        <View style={statPanel.box}>
          <Text style={statPanel.label}>УРОВЕНЬ</Text>
          <Text style={statPanel.value}>{gameState.level}</Text>
        </View>
        <View style={statPanel.scoreBox}>
          <Text style={statPanel.scoreLabel}>ОЧКИ</Text>
          <Text style={statPanel.scoreValue}>{gameState.score}</Text>
        </View>
      </View>
      
      <View style={pausePanel.container}>
        <TouchableOpacity onPress={handlePause}>
          <MaterialCommunityIcons name="pause-box-outline" size={30} color="black" style={pausePanel.pauseIcon}/>
        </TouchableOpacity>
      </View>

      <View style={gameComponents.container}>
        <TouchableOpacity onPress={holdPiece}>
          <View style={gameComponents.box}>
            <Text style={gameComponents.label}>КАРМАН</Text>
            { 
            gameState.heldPiece ? 
            <TetrominoBox 
              tetrominoType={gameState.heldPiece.type}
            /> 
            : 
            <Text></Text>
            }
          </View>
        </TouchableOpacity>

        {/* Игровое поле */}
        <TetrisBoard 
          board={gameState.board}
          currentPiece={gameState.currentPiece}
        />

        <View style={gameComponents.box}>
          <Text style={gameComponents.label}>СЛЕД.</Text>
          {gameState.nextPieces.slice(0, 3).map((piece, index) => (
            <TetrominoBox 
              key={`next-${index}-${piece.type}`}
              tetrominoType={piece.type} 
            />
          ))}
        </View>
      </View>

      {/* Отладочные кнопки */}
      <View>
        <View style={debugControls.container}>
          <TouchableOpacity onPress={initializeGame} style={debugControls.button}>
            <Text>Перезагрузка</Text>
          </TouchableOpacity>
        </View>
        <View style={debugControls.container}>
          <TouchableOpacity onPress={() => addScore(100)} style={debugControls.button}>
            <Text>+100 очков</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addLevel(1)} style={debugControls.button}>
            <Text>+1 уровень</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addLines(1)} style={debugControls.button}>
            <Text>+1 линия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentPiece('I')} style={debugControls.button}>
            <Text>Фигура I</Text>
          </TouchableOpacity>
        </View>
        <View style={debugControls.container}>
          <TouchableOpacity onPress={() => movePiece('left')} style={debugControls.button}>
            <Text>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => movePiece('right')} style={debugControls.button}>
            <Text>→</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => movePiece('down')} style={debugControls.button}>
            <Text>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={rotatePiece} style={debugControls.button}>
            <Text>↻</Text>
          </TouchableOpacity>
        </View>
        <View style={debugControls.container}>
          <Text>Скорость: {gameState.gameSpeed}ms</Text>
          <Text>Состояние: {gameState.isPaused ? 'Пауза' : gameState.isGameOver ? 'Конец' : 'Игра'}</Text>
        </View>
      </View>

      {/* Состояние паузы - обновляемое */}
      {gameState.isPaused && (
        <View style={overlayStyles.container}>
          <View style={overlayStyles.message}>
            <Text style={overlayStyles.text}>ПАУЗА</Text>
            
            <TouchableOpacity onPress={handlePause} style={overlayStyles.button}>
              <Text style={overlayStyles.buttonText}>Продолжить</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSaveAndExit} 
              style={[overlayStyles.button, overlayStyles.saveButton]}
              disabled={isSaving}
            >
              <Text style={overlayStyles.buttonText}>
                {isSaving ? 'Сохранение...' : 'Сохранить и выйти'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleExitWithoutSave} 
              style={[overlayStyles.button, overlayStyles.exitButton]}
            >
              <Text style={overlayStyles.buttonText}>Выйти без сохранения</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={initializeGame} 
              style={[overlayStyles.button, overlayStyles.restartButton]}
            >
              <Text style={overlayStyles.buttonText}>Новая игра</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const statPanel = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: '8%',
    paddingTop: '5%',
    paddingBottom: '5%',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 5,
    borderWidth: 3,
  },
  box: {
    width: '25%',
    // borderWidth: 3,
    // margin: 3,
    outlineWidth: 3,
    outlineColor: '#0D1B2A',
    alignSelf: 'center'
  },

  scoreBox: {
    width: '45%',
    height: '120%',
    outlineColor: '#fff',
    outlineWidth: 3,
    borderWidth: 2,
    
  },
  label: {
    textAlign: 'center',
    fontSize: 13,
  },
  value: {
    textAlign: 'center',
    fontSize: 22,
  },
  scoreLabel: {
    textAlign: 'center',
    fontSize: 15,
  },
  scoreValue: {
    textAlign: 'center',
    fontSize: 24,
  },
});

const pausePanel = StyleSheet.create({
  container: {
    width: '9%',
    borderWidth: 3,
  },

  pauseIcon: {
    // top: '7%'
  },
});

const gameComponents = StyleSheet.create({
  container: {
    // flex: 1,
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-around',
  },
  box: {
    outlineWidth: 3,

    width: 60,
    minHeight: 60,
  },
  label: {
    textAlign: 'center',
    fontSize: 10,
    padding: 1
  },
  block: {
    height: 50,
  }
});

// Добавим новые стили для паузы
const overlayStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    minWidth: 200,
    alignItems: 'center',
    marginVertical: 5,
  },
  saveButton: {
  },
  exitButton: {
  },
  restartButton: {
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

const debugControls = StyleSheet.create({
  outerContainer: {
    alignContent: 'space-around',
    padding: 10,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    minWidth: 40,
    alignItems: 'center',
  },
});