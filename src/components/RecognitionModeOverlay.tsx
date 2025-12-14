// src/components/RecognitionModeOverlay.tsx
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

// Размер ячейки
const CELL_SIZE = 30;

export const RecognitionModeOverlay: React.FC<RecognitionModeOverlayProps> = ({
  isVisible,
  board,
  timerRemaining,
  onClose,
  onTimerTick,
}) => {
  const safeBoard: Board = Array.isArray(board) ? board : [];

  const { startPath, addToPath, getPath, clearPath } =
    useWordRecognition(safeBoard); // [file:208]

  const [path, setPath] = useState<LetterPosition[]>([]);
  const [isSwiping, setIsSwiping] = useState(false);

  const boardRef = useRef<RNView | null>(null);
  const boardOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const boardMeasuredRef = useRef(false);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);

  // Сброс пути при скрытии оверлея
  useEffect(() => {
    if (!isVisible) {
      clearPath();
      setPath([]);
      setIsSwiping(false);
      lastCellRef.current = null;
      boardMeasuredRef.current = false;
      console.log('🔄 Overlay скрыт, путь сброшен');
    }
  }, [isVisible, clearPath]);

  const measureBoardPosition = () => {
    if (!boardRef.current) return;
    boardRef.current.measureInWindow((x, y, width, height) => {
      boardOffsetRef.current = { x, y };
      boardMeasuredRef.current = true;
      console.log('BOARD OFFSET TOP', y, 'CELL_SIZE', CELL_SIZE);
    });
  };

  const HIT_RADIUS = CELL_SIZE * 0.9;

  // более мягкий выбор клетки
  const getCellFromPoint = (x: number, y: number) => {
    const rows = safeBoard.length;
    const cols = rows > 0 ? safeBoard[0].length : 0;
    if (!rows || !cols) return null;

    const approxCol = Math.floor(x / CELL_SIZE);
    const approxRow = Math.floor(y / CELL_SIZE);

    if (
      approxCol < 0 ||
      approxCol >= cols ||
      approxRow < 0 ||
      approxRow >= rows
    ) {
      return null;
    }

    const centerX = approxCol * CELL_SIZE + CELL_SIZE / 2;
    const centerY = approxRow * CELL_SIZE + CELL_SIZE / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist2 = dx * dx + dy * dy;

    if (dist2 > HIT_RADIUS * HIT_RADIUS) {
      return null;
    }

    return { row: approxRow, col: approxCol };
  };

  const handleCellTouch = (rowIndex: number, colIndex: number) => {
    const boardX = colIndex;
    const boardY = rowIndex;
    const cell = safeBoard[boardY]?.[boardX];
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
    const { pageX, pageY } = evt.nativeEvent;
    const { x: boardX, y: boardY } = boardOffsetRef.current;

    if (!boardMeasuredRef.current) {
      measureBoardPosition();
      return;
    }

    const relX = pageX - boardX;
    const relY = pageY - boardY;

    const cell = getCellFromPoint(relX, relY);
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

  const panResponder: PanResponderInstance = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: e => {
      setIsSwiping(true);
      clearPath();
      setPath([]);
      lastCellRef.current = null;
      handlePointFromEvent(e); // старт
    },

    onPanResponderMove: e => {
      if (!isSwiping) return;
      handlePointFromEvent(e); // продолжение
    },

    onPanResponderRelease: () => {
      finishAndClose();
    },

    onPanResponderTerminate: () => {
      finishAndClose();
    },
  });

  if (!isVisible) return null;

  const composedWord = path.map(p => p.letter).join('');
  const displayWord =
    composedWord.length > 18
      ? composedWord.slice(0, 18) + '…'
      : composedWord;

  return (
    <View style={styles.container}>
      <View style={styles.cardShadow}>
        {/* БЕЗ cardTilted */}
        <View style={styles.card}>
          {/* Заголовок + таймер */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>🔍 НАЙДИТЕ СЛОВО</Text>
            <View style={styles.headerTimer}>
              <Text style={styles.headerTimerLabel}>⏱</Text>
              <Text
                style={[
                  styles.headerTimerValue,
                  timerRemaining <= 10 ? styles.headerTimerWarning : null,
                ]}
              >
                {timerRemaining.toFixed(1)}s
              </Text>
            </View>
          </View>

          {/* Доска с буквами */}
          <View style={styles.boardOuter}>
            <RNView
              ref={boardRef}
              style={styles.board}
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
                          key={`${rowIndex}-${colIndex}`}
                          style={[
                            styles.cell,
                            isInPath && styles.cellActive,
                          ]}
                        >
                          <Text style={styles.cellLetter}>
                            {cell.letter}
                          </Text>
                          {isInPath && (
                            <View style={styles.cellIndexBadge}>
                              <Text style={styles.cellIndexText}>
                                {pathIndex + 1}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
            </RNView>
          </View>

          {/* Информация о слове */}
          <View style={styles.wordInfo}>
            <Text style={styles.wordLabel}>СЛОВО:</Text>
            <Text style={styles.wordValue}>
              {displayWord  || '(нет)'}
            </Text>
            <Text style={styles.wordLength}>Букв: {path.length}</Text>
          </View>
        </View>
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

  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  // cardTilted: {
  //   transform: [{ rotate: '-4deg' }],
  // },
  card: {
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: 340,          // фикс вместо minWidth
    alignItems: 'stretch',
  },

  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  headerTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerTimerLabel: {
    fontSize: 14,
    color: '#E7ECEF',
    marginRight: 4,
  },
  headerTimerValue: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
  },
  headerTimerWarning: {
    color: '#FFE066',
  },

  boardOuter: {
    alignSelf: 'center',
    marginVertical: 8,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    backgroundColor: '#0D1B2A',
  },
  board: {
    backgroundColor: '#1B263B',
  },
  boardRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#415A77',
    backgroundColor: '#6096BA',
  },
  cellActive: {
    backgroundColor: '#FFE066',
  },
  cellLetter: {
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  cellIndexBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    borderRadius: 6,
    paddingHorizontal: 3,
    backgroundColor: 'rgba(13,27,42,0.9)',
  },
  cellIndexText: {
    fontSize: 9,
    color: '#E7ECEF',
    fontFamily: 'Unbounded',
  },

  wordInfo: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#6096BA',
    borderWidth: 2,
    borderColor: '#0D1B2A',
  },
  wordLabel: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 2,
  },
  wordValue: {
    fontSize: 18,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 2,
    maxWidth: '100%',
  },
  wordLength: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#0D1B2A',
    textAlign: 'center',
  },
});
