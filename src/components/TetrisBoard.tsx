// Компонент игрового поля Tetris
// Отрисовывает визуально похожее поле на классический Tetris.

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
interface Props {
  style?: ViewStyle | ViewStyle[];
}

// Константы, описывающие размеры игрового поля
const ROWS = 20;
const COLS = 10;

export default function TetrisBoard({ style }: Props) {
  // По умолчанию поле - пустое
  const rows = new Array(ROWS).fill(0);
  const cols = new Array(COLS).fill(0);

  return (
    <View style={[styles.boardOuter, style]}>
        {/* Отрисовка игрового поля */}
        <View>
        {rows.map((_, rIdx) => (
            <View key={rIdx} style={styles.row}>
            {cols.map((_, cIdx) => (
                <View key={cIdx} style={styles.cell} />
            ))}
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
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 25,
    height: 25,
  },
});
