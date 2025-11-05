import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TETROMINOES, TetrominoType } from '../types';

interface Props {
  style?: ViewStyle | ViewStyle[];
  tetrominoType: TetrominoType;
}

export default function TetrominoBox({ style, tetrominoType }: Props) {
  const { shape, color } = TETROMINOES[tetrominoType];
  
  // Создаем массив только с видимыми клетками
  const visibleCells: { row: number; col: number }[] = [];
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        visibleCells.push({ row, col });
      }
    }
  }

  // Находим границы фигуры для правильного позиционирования
  const minRow = Math.min(...visibleCells.map(cell => cell.row));
  const maxRow = Math.max(...visibleCells.map(cell => cell.row));
  const minCol = Math.min(...visibleCells.map(cell => cell.col));
  const maxCol = Math.max(...visibleCells.map(cell => cell.col));

  const figureWidth = maxCol - minCol + 1;
  const figureHeight = maxRow - minRow + 1;

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.figureContainer,
        { 
          width: figureWidth * 14 + 4, // 12px ячейка + 2px margin
          height: figureHeight * 14 + 4
        }
      ]}>
        {visibleCells.map((cell, index) => (
          <View
            key={`cell-${index}`}
            style={[
              styles.cell,
              {
                backgroundColor: color,
                position: 'absolute',
                left: (cell.col - minCol) * 14, // 12px + 2px margin
                top: (cell.row - minRow) * 14,
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40, // Минимальная высота для консистентности
    minWidth: 40,  // Минимальная ширина для консистентности
  },
  figureContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    width: 15,
    height: 15,
    borderWidth: 0.5,
    margin: 1,
  },
});