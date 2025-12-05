import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  PanResponderInstance,
  View as RNView,
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

// Размер ячейки: ИСПОЛЬЗУЕМ и для верстки, и для расчёта координат
const CELL_SIZE = 30;

export const RecognitionModeOverlay: React.FC<RecognitionModeOverlayProps> = ({
  isVisible,
  board,
  timerRemaining,
  onClose,
  onTimerTick,
}) => {
  const safeBoard: Board = Array.isArray(board) ? board : [];

  const {
    startPath,
    addToPath,
    getPath,
    clearPath,
  } = useWordRecognition(safeBoard); // твой хук [file:69]

  const [path, setPath] = useState<LetterPosition[]>([]);
  const [isSwiping, setIsSwiping] = useState(false);

  const boardRef = useRef<RNView | null>(null);
  // Позиция борда на экране (координаты левого верхнего угла)
  const boardOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Чтобы не дёргать measure слишком рано
  const boardMeasuredRef = useRef(false);

  const lastCellRef = useRef<{ row: number; col: number } | null>(null);

  // Сброс пути при скрытии оверлея
  useEffect(() => {
    if (!isVisible) {
      clearPath();
      setPath([]);
      setIsSwiping(false);
      lastCellRef.current = null;
      console.log('🔄 Overlay скрыт, путь сброшен');
    }
  }, [isVisible, clearPath]);

  // Замеряем позицию борда на экране (глобальные координаты)
  const measureBoardPosition = () => {
    if (!boardRef.current) return;

    boardRef.current.measureInWindow((x, y, width, height) => {
      boardOffsetRef.current = { x, y };
      boardMeasuredRef.current = true;
      console.log('📐 BOARD OFFSET', { x, y, width, height });
    });
  };

  const HIT_RADIUS = CELL_SIZE * 0.6; // 60% от клетки

  const getCellFromPoint = (x: number, y: number) => {
    const rows = safeBoard.length;
    const cols = rows > 0 ? safeBoard[0].length : 0;
    if (!rows || !cols) return null;

    const approxCol = Math.round((x - CELL_SIZE / 2) / CELL_SIZE);
    const approxRow = Math.round((y - CELL_SIZE / 2) / CELL_SIZE);

    if (approxCol < 0 || approxCol >= cols || approxRow < 0 || approxRow >= rows) {
      return null;
    }

    const centerX = approxCol * CELL_SIZE + CELL_SIZE / 2;
    const centerY = approxRow * CELL_SIZE + CELL_SIZE / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist2 = dx * dx + dy * dy;

    if (dist2 > HIT_RADIUS * HIT_RADIUS) {
      // Слишком далеко от центра — считаем промахом, не двигаем путь
      return null;
    }

    return { row: approxRow, col: approxCol };
  };

  const handleCellTouch = (rowIndex: number, colIndex: number) => {
    const boardX = colIndex;
    const boardY = rowIndex;
    const cell = safeBoard[boardY]?.[boardX];

    console.log('cell', boardX, boardY, cell);

    if (!cell || !cell.letter) return;

    const currentPath = getPath();
    const currentLen = currentPath.length;

    if (currentLen === 0) {
      const newPath = startPath(boardX, boardY);
      if (newPath.length > 0) {
        setPath(newPath);
        onTimerTick();
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
      onTimerTick();
    }
  };

  const handlePointFromEvent = (evt: any) => {
    const { pageX, pageY } = evt.nativeEvent; // глобальные координаты касания [web:76]
    const { x: boardX, y: boardY } = boardOffsetRef.current;

    // Если по каким-то причинам ещё не замерили борд — попробуем замерить сейчас
    if (!boardMeasuredRef.current) {
      console.log('⚠️ board not measured yet, measuring on the fly');
      measureBoardPosition();
      return;
    }

    // Координаты касания в системе борда
    const relX = pageX - boardX;
    const relY = pageY - boardY;

    console.log('POINT', { pageX, pageY, relX, relY });

    const cell = getCellFromPoint(relX, relY);
    console.log('HIT CELL', cell);

    if (!cell) return;

    const last = lastCellRef.current;
    if (last && last.row === cell.row && last.col === cell.col) {
      return;
    }
    lastCellRef.current = cell;

    handleCellTouch(cell.row, cell.col);
  };

  const finishAndClose = () => {
    const finalPath = getPath();
    if (!finalPath.length) {
      onClose('');
    } else {
      const word = finalPath.map(p => p.letter).join('');
      console.log('📝 Слово из режима разгадывания:', word);
      onClose(word);
    }
    clearPath();
    setPath([]);
    setIsSwiping(false);
    lastCellRef.current = null;
  };

  // Создаём PanResponder на каждый рендер, чтобы коллбеки видели актуальный стейт [web:79]
  const panResponder: PanResponderInstance = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => {
      console.log('grant');
      setIsSwiping(true);
      clearPath();
      setPath([]);
      lastCellRef.current = null;
      handlePointFromEvent(e); // опорная буква по нажатию
    },
    onPanResponderMove: e => {
      if (!isSwiping) return;
      handlePointFromEvent(e); // расширение слова при движении
    },
    onPanResponderRelease: () => {
      console.log('release');
      finishAndClose();
    },
    onPanResponderTerminate: () => {
      finishAndClose();
    },
  });

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
        <View
          style={styles.board}
          ref={boardRef}
          onLayout={() => {
            console.log('BOARD onLayout -> measure');
            measureBoardPosition();
          }}
          {...panResponder.panHandlers}
        >
          {safeBoard.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.boardRow}>
              {row.map((cell, colIndex) => {
                const pathIndex = path.findIndex(
                  p => p.x === colIndex && p.y === rowIndex
                );
                const isInPath = pathIndex !== -1;

                return (
                  <View
                    key={colIndex}
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
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Информация о слове */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Составленное слово:</Text>
        <Text style={styles.infoWord}>{composedWord || '(нет)'}</Text>
        <Text style={styles.infoCount}>Букв: {path.length}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    position: 'absolute',
    top: 20, left: 0, right: 0,
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
});
