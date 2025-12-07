// src/components/TetrominoBox.tsx
import React from 'react';
import { View, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Tetromino } from '../types/tetromino';
import { getLetterStyleForColor } from '../utils/textColor';

interface Props {
  tetromino: Tetromino | null;
  size?: 'small' | 'medium';
  showLetters?: boolean;

  containerStyle?: ViewStyle;
  boxStyle?: ViewStyle;
  emptyBoxStyle?: ViewStyle;
  emptyTextStyle?: TextStyle;
  gridContainerStyle?: ViewStyle;
  rowStyle?: ViewStyle;
  cellStyle?: ViewStyle;
  letterStyle?: TextStyle;
  lettersLineStyle?: TextStyle;
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

  if (maxRow === -1) {
    // полностью пустая фигура
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
  containerStyle,
  boxStyle,
  emptyBoxStyle,
  emptyTextStyle,
  gridContainerStyle,
  rowStyle,
  cellStyle,
  letterStyle,
  lettersLineStyle,
}: Props) {
  if (!tetromino) {
    return (
      <View style={[styles.container, styles[size], containerStyle]}>
        <View style={[styles.emptyBox, emptyBoxStyle]}>
          <Text style={[styles.emptyText, emptyTextStyle]}>—</Text>
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

  const trimmed = trimTetromino(tetromino.cells);
  const trimmedRows = trimmed.length;
  const trimmedCols = trimmed[0]?.length ?? 0;

  const baseBoxSize = size === 'medium' ? 70 : 60;
  const padding = 4;

  const maxWidthPx = baseBoxSize - padding * 2;
  const maxHeightPx = baseBoxSize - padding * 2 - 14;

  const gridWidth = trimmedCols * (cellSize + 2);
  const gridHeight = trimmedRows * (cellSize + 2);

  const horizontalPadding = Math.max(0, (maxWidthPx - gridWidth) / 2);
  const verticalPadding = Math.max(0, (maxHeightPx - gridHeight) / 2);

  return (
    <View style={[styles.container, styles[size], containerStyle]}>
      <View style={[styles.box, boxStyle]}>
        <View
          style={[
            styles.miniGrid,
            {
              paddingHorizontal: horizontalPadding,
              paddingVertical: verticalPadding,
            },
            gridContainerStyle,
          ]}
        >
          {trimmed.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.miniRow, rowStyle]}>
              {row.map((cell, colIndex) => {
                const dynamicLetterStyle = getLetterStyleForColor(
                  cell.isEmpty ? '#000000' : cell.color
                );

                return (
                  <View
                    key={colIndex}
                    style={[
                      styles.miniCell,
                      {
                        width: cellSize,
                        height: cellSize,
                      },
                      !cell.isEmpty && {
                        backgroundColor: cell.color + '80',
                      },
                      cellStyle,
                    ]}
                  >
                    {!cell.isEmpty && (
                      <Text
                        style={[
                          styles.miniLetter,
                          { fontSize: size === 'medium' ? 10 : 8 },
                          dynamicLetterStyle,
                          letterStyle,
                        ]}
                      >
                        {cell.letter}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {showLetters && (
          <Text style={[styles.letters, lettersLineStyle]}>
            {letters}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2.5,
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
    // borderWidth: 2,
    // borderColor: '#000',
    // borderRadius: 6,
    padding: 4, 
    justifyContent: 'space-between',
    // backgroundColor: '#fafafa',
  },
  emptyBox: {
    width: '100%',
    height: '100%',
    // borderWidth: 2,
    // borderColor: '#ccc',
    // borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f5f5f5',
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
    color: '#000', // будет переопределён dynamicLetterStyle
  },
  letters: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    color: '#000',
  },
});
