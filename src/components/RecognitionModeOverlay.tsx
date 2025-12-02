import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import { useWordRecognition, LetterPosition } from '../hooks/useWordRecognition';

interface BoardCell {
  letter: string;
  tetrominoId: string | null;
}

type Board = BoardCell[][];

interface RecognitionModeOverlayProps {
  isVisible: boolean;
  board: Board | undefined;
  timerRemaining: number;
  onClose: (word: string) => void;
  onTimerTick: () => void;
}

const CELL_SIZE = 30;

export const RecognitionModeOverlay: React.FC<RecognitionModeOverlayProps> = ({
  isVisible,
  board,
  timerRemaining,
  onClose,
  onTimerTick,
}) => {
  // Подстраховка от undefined
  const safeBoard: Board = Array.isArray(board) ? board : [];

  const {
    startPath,
    addToPath,
    getPath,
    clearPath,
  } = useWordRecognition(safeBoard);  // путь хранится внутри хука [file:53]

  useEffect(() => {
    if (!isVisible) {
      // Любое скрытие — сбрасываем слово
      clearPath();
      setPath([]);
      console.log('🔄 Overlay скрыт, путь сброшен');
    }
  }, [isVisible, clearPath]);  

  // Локальное состояние пути для подсветки и синхронной логики
  const [path, setPath] = useState<LetterPosition[]>([]);

  const handleBoardTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const boardX = Math.floor(locationX / CELL_SIZE);
    const boardY = Math.floor(locationY / CELL_SIZE);

    console.log('tap', boardX, boardY, safeBoard[boardY]?.[boardX]);

    if (
      boardY < 0 ||
      boardY >= safeBoard.length ||
      boardX < 0 ||
      boardX >= safeBoard[boardY].length
    ) {
      return;
    }

    const currentPath = getPath();
    const currentLen = currentPath.length;

    if (currentLen === 0) {
      startPath(boardX, boardY);
      const newPath = getPath();
      if (newPath.length > 0) {
        setPath(newPath);
        onTimerTick(); // первая буква — слово расширилось
        if (newPath.length > 0) {
          console.log('PATH NOW:', newPath.map(p => `${p.letter}@${p.x},${p.y}`).join(' '));
        }
      }
      return;
    }

    const lastPos = currentPath[currentPath.length - 1];
    if (lastPos.x === boardX && lastPos.y === boardY) {
      return;
    }

    const added = addToPath(boardX, boardY);
    if (added) {
      const newPath = getPath();
      setPath(newPath);
      if (newPath.length > currentLen) {
        onTimerTick(); // слово стало длиннее — обновляем таймер
      }
    }
  };

  const handleCellTouch = (rowIndex: number, colIndex: number) => {
    const boardX = colIndex;
    const boardY = rowIndex;

    console.log('cell tap', boardX, boardY, safeBoard[boardY]?.[boardX]);

    if (
      boardY < 0 ||
      boardY >= safeBoard.length ||
      boardX < 0 ||
      boardX >= safeBoard[boardY].length
    ) {
      return;
    }

    const currentPath = getPath();
    const currentLen = currentPath.length;

    if (currentLen === 0) {
      const newPath = startPath(boardX, boardY);
      if (newPath.length > 0) {
        setPath(newPath);
        onTimerTick(); // всегда тикаем на первую букву
        console.log(
          `🔤 Путь начинается с: ${newPath[0].letter} (${boardX}, ${boardY})`
        );
      }
      return;
    }

    const lastPos = currentPath[currentPath.length - 1];
    if (lastPos.x === boardX && lastPos.y === boardY) {
      return;
    }

    const newPath = addToPath(boardX, boardY);
    if (newPath && newPath.length > currentLen) {
      setPath(newPath);
      onTimerTick(); // слово реально удлинилось — обновляем таймер
      console.log(
        'PATH NOW:',
        newPath.map(p => `${p.letter}@${p.x},${p.y}`).join(' ')
      );
    }
  };



  const finishAndClose = () => {
    if (path.length === 0) {
      onClose('');
      return;
    }
    const word = path.map(p => p.letter).join('');
    console.log('📝 Составленное слово:', word);
    onClose(word);
    clearPath();
    setPath([]);
  };


  const handleTouchEnd = () => {
    finishAndClose();
  };

  const handleClearPath = () => {
    clearPath();
    setPath([]);
  };

  const handleExit = () => {
    finishAndClose();
  };

  if (!isVisible) return null;

  const composedWord = path.map(p => p.letter).join('');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🔍 РЕЖИМ РАЗГАДЫВАНИЯ</Text>
      </View>

      {/* Таймер */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>⏱️ Таймер:</Text>
        <Text
          style={[
            styles.timerValue,
            timerRemaining <= 1 && styles.timerWarning,
          ]}
        >
          {timerRemaining.toFixed(1)} сек
        </Text>
      </View>

      {/* Доска с буквами */}
      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {safeBoard.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.boardRow}>
              {row.map((cell, colIndex) => {
                const pathIndex = path.findIndex(
                  p => p.x === colIndex && p.y === rowIndex
                );
                const isInPath = pathIndex !== -1;

                return (
                  <TouchableOpacity
                    key={colIndex}
                    activeOpacity={0.7}
                    onPress={() => handleCellTouch(rowIndex, colIndex)}
                  >
                    <View
                      style={[
                        styles.cell,
                        isInPath && styles.cellSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          isInPath && styles.cellTextSelected,
                        ]}
                      >
                        {cell.letter}
                      </Text>
                      {isInPath && (
                        <View style={styles.pathNumber}>
                          <Text style={styles.pathNumberText}>
                            {pathIndex + 1}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Информация о составленном слове */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Составленное слово:</Text>
        <Text style={styles.infoWord}>{composedWord || '(нет)'}</Text>
        <Text style={styles.infoCount}>Букв: {path.length}</Text>
      </View>

      {/* Кнопки управления */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleClearPath}
        >
          <Text style={styles.buttonText}>🗑️ Очистить</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleExit}
        >
          <Text style={styles.buttonText}>👋 Выход</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    paddingVertical: 10,
    backgroundColor: 'rgba(33, 130, 208, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  timerContainer: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: 'rgba(33, 130, 208, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 12,
    color: 'white',
    marginRight: 8,
  },
  timerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  timerWarning: {
    color: '#FF5454',
  },
  boardContainer: {
    marginTop: 60,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(33, 130, 208, 0.6)',
  },
  board: {
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
  },
  boardRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cellSelected: {
    backgroundColor: 'rgba(50, 184, 198, 0.4)',
    borderColor: 'rgba(50, 184, 198, 0.8)',
  },
  cellText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cellTextSelected: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 16,
  },
  pathNumber: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2182D0',
    justifyContent: 'center',
    alignItems: 'center',
    right: -4,
    top: -4,
  },
  pathNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  infoContainer: {
    backgroundColor: 'rgba(33, 130, 208, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 250,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  infoWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    position: 'absolute',
    bottom: 30,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2182D0',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
});
