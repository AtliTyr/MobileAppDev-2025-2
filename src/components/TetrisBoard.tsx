// src/components/TetrisBoard.tsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Text,
  Animated,
  Easing,
} from 'react-native';
import { GameBoard } from '../types/game';
import { Tetromino } from '../types/tetromino';
import { getLetterStyleForColor } from '../utils/textColor';

interface Props {
  board: GameBoard;
  currentTetromino?: Tetromino | null;
  ghostTetrominoY?: number;
  style?: ViewStyle | ViewStyle[];
}

// Методы, которыми будет управлять GameScreen
export type TetrisBoardHandle = {
  shake: () => void;
  celebrate: () => void;
};

const ROWS = 20;
const COLS = 10;

const TetrisBoard = forwardRef<TetrisBoardHandle, Props>(
  ({ board, currentTetromino, style, ghostTetrominoY }, ref) => {
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;

    // Простое дрожание
    const shake = () => {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 60,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Вспышка + лёгкий скейл (tetris / слово)
    const celebrate = () => {
      scaleAnim.setValue(1);
      flashAnim.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 120,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.7,
            duration: 80,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    useImperativeHandle(ref, () => ({
      shake,
      celebrate,
    }));

    const renderCell = (row: number, col: number) => {
      // Текущая падающая фигура (рендерится ПЕРВОЙ - самый приоритет!)
      if (currentTetromino) {
        const { x, y } = currentTetromino.position;

        for (let i = 0; i < currentTetromino.cells.length; i++) {
          for (let j = 0; j < currentTetromino.cells[i].length; j++) {
            const cellData = currentTetromino.cells[i][j];
            if (cellData.isEmpty) continue;

            if (row === y + i && col === x + j) {
              const letterStyle = getLetterStyleForColor(cellData.color);
              
              // Определяем цвет буквы из letterStyle (белые или чёрные)
              const isWhiteText = letterStyle.color === '#FFFFFF';

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
                  <Text
                    style={[
                      styles.letter,
                      letterStyle,
                      {
                        fontSize: 12,
                        fontWeight: '800',
                        // Добавляем тень только для белых букв (для контраста)
                        ...(isWhiteText && {
                          textShadowColor: 'rgba(0, 0, 0, 0.5)',
                          textShadowOffset: { width: 1, height: 1 },
                          textShadowRadius: 2,
                        }),
                      },
                    ]}
                  >
                    {cellData.letter}
                  </Text>
                </View>
              );
            }
          }
        }
      }

      // 👻 Призрак - рендерится ВТОРЫМ (видно только если активный не занимает ячейку)
      if (currentTetromino && ghostTetrominoY !== undefined) {
        const { x, y } = currentTetromino.position;

        // Не рендерим призрак если он совпадает с активным тетромино по позиции
        if (ghostTetrominoY !== y) {
          for (let i = 0; i < currentTetromino.cells.length; i++) {
            for (let j = 0; j < currentTetromino.cells[i].length; j++) {
              const cellData = currentTetromino.cells[i][j];
              if (cellData.isEmpty) continue;

              if (row === ghostTetrominoY + i && col === x + j) {
                return (
                  <View
                    key={`${row}-${col}-ghost`}
                    style={[
                      styles.cell,
                      {
                        borderWidth: 2.5,
                        borderColor: cellData.color,
                        backgroundColor: cellData.color,
                        opacity: 0.25,
                        shadowColor: cellData.color,
                        shadowOpacity: 0.6,
                        shadowRadius: 3,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 2,
                      },
                    ]}
                  />
                );
              }
            }
          }
        }
      }

      // Статичная клетка
      const cell = board[row]?.[col];
      if (cell) {
        const letterStyle = getLetterStyleForColor(cell.color);
        
        // Определяем цвет буквы из letterStyle (белые или чёрные)
        const isWhiteText = letterStyle.color === '#FFFFFF';

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
            <Text
              style={[
                styles.letter,
                letterStyle,
                {
                  fontSize: 12,
                  fontWeight: '800',
                  // Добавляем тень только для белых букв (для контраста)
                  ...(isWhiteText && {
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                  }),
                },
              ]}
            >
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

    const translateX = shakeAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: [-4, 4],
    });

    return (
      <Animated.View
        style={[
          styles.boardOuter,
          style,
          {
            transform: [
              { translateX },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
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

        {/* вспышка поверх доски */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: '#FFFFFF',
              opacity: flashAnim,
            },
          ]}
        />
      </Animated.View>
    );
  }
);

export default TetrisBoard;

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
  },
});
