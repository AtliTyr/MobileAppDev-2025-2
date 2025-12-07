// src/components/TetrisBoard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, Text, TextStyle } from 'react-native';
import { GameBoard } from '../types/game';
import { Tetromino } from '../types/tetromino';
import { getLetterStyleForColor } from '../utils/textColor';

interface Props {
  board: GameBoard;
  currentTetromino?: Tetromino | null;
  style?: ViewStyle | ViewStyle[];
}

const ROWS = 20;
const COLS = 10;

export default function TetrisBoard({ board, currentTetromino, style }: Props) {
  const renderCell = (row: number, col: number) => {
    // Текущая падающая фигура
    if (currentTetromino) {
      const { x, y } = currentTetromino.position;

      for (let i = 0; i < currentTetromino.cells.length; i++) {
        for (let j = 0; j < currentTetromino.cells[i].length; j++) {
          const cellData = currentTetromino.cells[i][j];
          if (cellData.isEmpty) continue;

          if (row === y + i && col === x + j) {
            const letterStyle = getLetterStyleForColor(cellData.color);

            return (
              <View
                key={`${row}-${col}`}
                style={[
                  styles.cell,
                  { backgroundColor: cellData.color },
                  {
                    borderWidth: 0.5,
                    borderColor: '#333333',
                  },
                ]}
              >
                <Text style={[styles.letter, letterStyle]}>
                  {cellData.letter}
                </Text>
              </View>
            );
          }
        }
      }
    }

    // Статичная клетка на поле
    const cell = board[row]?.[col];
    if (cell) {
      const letterStyle = getLetterStyleForColor(cell.color);

      return (
        <View
          key={`${row}-${col}`}
          style={[
            styles.cell,
            { backgroundColor: cell.color },
            {
              borderWidth: 0.5,
              borderColor: '#333333',
            },
          ]}
        >
          <Text style={[styles.letter, letterStyle]}>
            {cell.letter}
          </Text>
        </View>
      );
    }

    // Пустая клетка
    return (
      <View
        key={`${row}-${col}`}
        style={[styles.cell, styles.emptyCell]}
      />
    );
  };

  return (
    <View style={[styles.boardOuter, style]}>
      <View style={styles.boardInner}>
        {Array(ROWS)
          .fill(0)
          .map((_, row) => (
            <View key={row} style={styles.row}>
              {Array(COLS)
                .fill(0)
                .map((_, col) => renderCell(row, col))}
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boardOuter: {
    borderWidth: 3,
    padding: 3,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    backgroundColor: '#6096BA',
  },
  boardInner: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {},
  letter: {
    fontWeight: 'bold',
    fontSize: 10,
    // базовые параметры, цвет и тень сверху переопределяем через getLetterStyleForColor
  },
});
