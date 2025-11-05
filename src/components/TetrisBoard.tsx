// Компонент игрового поля Tetris (лабораторная №2)
// Отрисовывает визуально похожее поле на классический Tetris с синим оформлением.

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { GameBoard, Tetromino } from '../types';

interface Props {
  style?: ViewStyle | ViewStyle[];
  board: GameBoard;
  currentPiece?: Tetromino | null;
}

// Константы, описывающие размеры игрового поля
const ROWS = 20;
const COLS = 10;

export default function TetrisBoard({ style, board, currentPiece }: Props) {
  // Функция для отрисовки ячейки
  const renderCell = (row: number, col: number) => {
    let cellColor = 'transparent';
    
    // Проверяем, находится ли здесь текущая фигура
    if (currentPiece) {
      const { shape, position, color } = currentPiece;
      const localX = col - position.x;
      const localY = row - position.y;
      
      if (
        localY >= 0 && localY < shape.length &&
        localX >= 0 && localX < shape[0].length &&
        shape[localY][localX]
      ) {
        cellColor = color;
      }
    }
    
    // Проверяем статичные блоки на поле
    if (board[row] && board[row][col]) {
      cellColor = board[row][col] as string;
    }

    return (
      <View 
        key={`${row}-${col}`} 
        style={[
          styles.cell, 
          { backgroundColor: cellColor },
          cellColor != 'transparent' ? { borderColor: 'black', borderWidth: 0.2 } : {} 
        ]} 
      />
    );
  };

  return (
    <View style={[styles.boardOuter, style]}>
      <View style={styles.boardInner}>
        {Array.from({ length: ROWS }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: COLS }, (_, colIndex) => 
              renderCell(rowIndex, colIndex)
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boardOuter: {
    borderWidth: 3,
  },
  boardInner: {
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 25,
    height: 25,
  },
});
