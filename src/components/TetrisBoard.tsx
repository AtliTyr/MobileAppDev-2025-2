// src/components/TetrisBoard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { GameBoard } from '../types/game';
import { Tetromino } from '../types/tetromino';

interface Props {
  board: GameBoard;
  currentTetromino?: Tetromino | null;
  style?: ViewStyle | ViewStyle[];
}

const ROWS = 20;
const COLS = 10;

export default function TetrisBoard({ board, currentTetromino, style }: Props) {
  const renderCell = (row: number, col: number) => {
    // Проверяем, находится ли клетка в текущей тетромино
    if (currentTetromino) {
      const { x, y } = currentTetromino.position;
      
      for (let i = 0; i < currentTetromino.cells.length; i++) {
        for (let j = 0; j < currentTetromino.cells[i].length; j++) {
          if (currentTetromino.cells[i][j].isEmpty) continue;
          
          if (row === y + i && col === x + j) {
            return (
              <View 
                key={`${row}-${col}`} 
                style={[
                  styles.cell, 
                  { backgroundColor: currentTetromino.cells[i][j].color }
                ]}
              >
                <Text style={styles.letter}>
                  {currentTetromino.cells[i][j].letter}
                </Text>
              </View>
            );
          }
        }
      }
    }

    // Проверяем статичные клетки на поле
    const cell = board[row]?.[col];
    if (cell) {
      return (
        <View 
          key={`${row}-${col}`} 
          style={[styles.cell, { backgroundColor: cell.color }]}
        >
          <Text style={styles.letter}>
            {cell.letter}
          </Text>
        </View>
      );
    }

    // Пустая клетка
    return (
      <View key={`${row}-${col}`} style={[styles.cell, styles.emptyCell]} />
    );
  };

  return (
    <View style={[styles.boardOuter, style]}>
      <View style={styles.boardInner}>
        {Array(ROWS).fill(0).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array(COLS).fill(0).map((_, col) => renderCell(row, col))}
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
    backgroundColor: '#000000',
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
    borderWidth: 0.5,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {
    backgroundColor: '#111111',
  },
  letter: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});