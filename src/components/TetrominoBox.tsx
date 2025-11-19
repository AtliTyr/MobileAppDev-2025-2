// src/components/TetrominoBox.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Tetromino } from '../types/tetromino';

interface Props {
  tetromino: Tetromino | null;
  size?: 'small' | 'medium';
  showLetters?: boolean;
}

export default function TetrominoBox({ tetromino, size = 'medium', showLetters = true }: Props) {
  if (!tetromino) {
    return (
      <View style={[styles.container, styles[size]]}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>—</Text>
        </View>
      </View>
    );
  }

  const color = tetromino.cells.flat().find(cell => !cell.isEmpty)?.color || '#666666';
  const letters = tetromino.cells.flat()
    .filter(cell => !cell.isEmpty)
    .map(cell => cell.letter)
    .join('');

  const cellSize = size === 'medium' ? 16 : 14;

  return (
    <View style={[styles.container, styles[size]]}>
      <View style={styles.box}>
        {/* Мини-поле с увеличенными клетками */}
        <View style={styles.miniGrid}>
          {tetromino.cells.map((row, rowIndex) => (
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
                      backgroundColor: color + '80', // Менее прозрачный
                    }
                  ]}
                >
                  {!cell.isEmpty && (
                    <Text style={[
                      styles.miniLetter,
                      { fontSize: size === 'medium' ? 10 : 8 }
                    ]}>
                      {cell.letter}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
        
        {/* Буквы фигуры - показываем только если нужно */}
        {showLetters && (
          <Text style={styles.letters}>
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
    borderColor: '#000', // Черная граница
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