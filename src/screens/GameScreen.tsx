import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, ImageBackground, Alert } from 'react-native';
import TetrisBoard from '../components/TetrisBoard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useGameState } from '../hooks/useGameState';
import { useGameSave } from '../hooks/useGameSave';

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

  // useEffect(() => {
  //   // Если пришли с флагом загрузки сохранения
  //   if (route.params?.loadSavedState && route.params?.savedGameState) {
  //     loadGameState(route.params.savedGameState);
  //   } else {
  //     initializeGame();
  //   }
  // }, [route.params]); // ← Добавляем зависимость

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  // Функция сохранения и выхода
  const handleSaveAndExit = async () => {
    setIsSaving(true);
    const success = await saveGame(gameState);
    setIsSaving(false);
    
    if (success) {
      Alert.alert('Успех', 'Игра сохранена!', [
        { 
          text: 'OK', 
          onPress: () => { } // Возврат в главное меню через навигацию
        }
      ]);
    } else {
      Alert.alert('Ошибка', 'Не удалось сохранить игру');
    }
  };

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
        <TouchableOpacity onPress={togglePause}>
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
      </View>

      {/* Состояние паузы - обновляемое */}
      {gameState.isPaused && (
        <View style={overlayStyles.container}>
          <View style={overlayStyles.message}>
            <Text style={overlayStyles.text}>ПАУЗА</Text>
            
            <TouchableOpacity onPress={togglePause} style={overlayStyles.button}>
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