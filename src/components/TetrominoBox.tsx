// src/components/TetrominoBox.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Tetromino } from '../types/tetromino';

interface Props {
  tetromino: Tetromino | null;
  size?: 'small' | 'medium';
  showLetters?: boolean;
}

// Вырезаем bounding box фигуры из 4x4
function trimTetromino(cells: Tetromino['cells']) {
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;

  let minRow = rows;
  let maxRow = -1;
  let minCol = cols;
  let maxCol = -1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      if (!cell.isEmpty) {
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }

  // если пустая фигура — вернём исходное
  if (maxRow === -1) {
    return cells;
  }

  const h = maxRow - minRow + 1;
  const w = maxCol - minCol + 1;

  const trimmed = Array.from({ length: h }, (_, r) =>
    Array.from({ length: w }, (_, c) => cells[minRow + r][minCol + c])
  );

  return trimmed;
}

export default function TetrominoBox({
  tetromino,
  size = 'medium',
  showLetters = true,
}: Props) {
  if (!tetromino) {
    return (
      <View style={[styles.container, styles[size]]}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>—</Text>
        </View>
      </View>
    );
  }

  const color =
    tetromino.cells.flat().find((cell) => !cell.isEmpty)?.color ||
    '#666666';

  const letters = tetromino.cells
    .flat()
    .filter((cell) => !cell.isEmpty)
    .map((cell) => cell.letter)
    .join('');

  const cellSize = size === 'medium' ? 16 : 14;

  // ключ: вырезаем реальные границы фигуры
  const trimmed = trimTetromino(tetromino.cells);
  const trimmedRows = trimmed.length;
  const trimmedCols = trimmed[0]?.length ?? 0;

  // размеры «коробки» под мини‑грид
  const maxWidthPx = (size === 'medium' ? 70 : 60) - 4 * 2; // ширина box - padding
  const maxHeightPx = (size === 'medium' ? 70 : 60) - 4 * 2 - 14; // минус место под текст

  const gridWidth = trimmedCols * (cellSize + 2);
  const gridHeight = trimmedRows * (cellSize + 2);

  // дополнительное центрирование по box
  const horizontalPadding = Math.max(0, (maxWidthPx - gridWidth) / 2);
  const verticalPadding = Math.max(0, (maxHeightPx - gridHeight) / 2);

  return (
    <View style={[styles.container, styles[size]]}>
      <View style={styles.box}>
        <View
          style={[
            styles.miniGrid,
            {
              paddingHorizontal: horizontalPadding,
              paddingVertical: verticalPadding,
            },
          ]}
        >
          {trimmed.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.miniRow}>
              {row.map((cell, colIndex) => (
                <View
                  key={colIndex}
                  style={[
                    styles.miniCell,
                    {
                      width: cellSize,
                      height: cellSize,
                    },
                    !cell.isEmpty && {
                      backgroundColor: color + '80',
                    },
                  ]}
                >
                  {!cell.isEmpty && (
                    <Text
                      style={[
                        styles.miniLetter,
                        { fontSize: size === 'medium' ? 10 : 8 },
                      ]}
                    >
                      {cell.letter}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {showLetters && <Text style={styles.letters}>{letters}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    width: 60,
    height: 60,
  },
  medium: {
    width: 70,
    height: 70,
  },
  box: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
    padding: 4,
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },
  emptyBox: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  miniGrid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRow: {
    flexDirection: 'row',
  },
  miniCell: {
    margin: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  miniLetter: {
    fontWeight: 'bold',
    color: '#000',
  },
  letters: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    color: '#000',
  },
});