/**
 * 🎯 useBoardManager.ts (ОБНОВЛЕННАЯ ВЕРСИЯ)
 * 
 * Все функции для управления игровой доской:
 * - Поиск и очистка полных линий
 * - Размещение фигур на доске
 * - Расчет очков
 * - Проверка game over
 */

import { useCallback } from 'react';
import { GameBoard } from '../types/game';
import { Tetromino } from '../types/tetromino';

export const useBoardManager = () => {
  /**
   * Поиск всех заполненных линий на доске
   * @param board - игровая доска
   * @returns массив индексов полных линий
   */
  const findCompletedLines = useCallback((board: GameBoard): number[] => {
    const completedLines: number[] = [];
    
    for (let y = 0; y < board.length; y++) {
      // Проверяем что все клетки в линии заполнены (не null)
      const isLineComplete = board[y].every(cell => cell !== null);
      if (isLineComplete) {
        completedLines.push(y);
      }
    }

    return completedLines;
  }, []);

  /**
   * Очищает все полные линии и добавляет пустые сверху
   * @param board - игровая доска
   * @returns { newBoard, linesCleared } - обновленная доска и количество очищенных линий
   */
  const clearCompletedLines = useCallback((board: GameBoard): {
    newBoard: GameBoard;
    linesCleared: number;
  } => {
    const completedLines = findCompletedLines(board);
    
    if (completedLines.length === 0) {
      return { newBoard: board, linesCleared: 0 };
    }

    console.log(`✨ Clearing ${completedLines.length} lines at indices:`, completedLines);

    const newBoard = board.map(row => [...row]); // Делаем копию

    // Удаляем полные линии в обратном порядке (чтобы не сбить индексы)
    for (let i = completedLines.length - 1; i >= 0; i--) {
      newBoard.splice(completedLines[i], 1);
    }

    // Добавляем новые пустые линии сверху
    for (let i = 0; i < completedLines.length; i++) {
      newBoard.unshift(Array(board[0].length).fill(null));
    }

    return {
      newBoard,
      linesCleared: completedLines.length,
    };
  }, [findCompletedLines]);

  /**
   * Расчет очков за очистку линий
   * 
   * Система очков (классический Тетрис):
   * - 1 линия = 100 * уровень
   * - 2 линии = 300 * уровень
   * - 3 линии = 500 * уровень
   * - 4 линии (Tetris!) = 800 * уровень
   * 
   * @param linesCleared - количество очищенных линий
   * @param level - текущий уровень
   * @returns количество очков
   */
  const calculateLineClearScore = useCallback((
    linesCleared: number,
    level: number
  ): number => {
    const baseScores = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 линии
    const baseScore = baseScores[linesCleared] || baseScores[4]; // Если >4, используем 4-линие бонус
    
    return baseScore * level;
  }, []);

  /**
   * Помещает текущую фигуру на доску (делает её статичной)
   * @param tetromino - фигура которую нужно поместить
   * @param board - текущая доска
   * @returns новая доска с размещенной фигурой
   */
  const placeTetromino = useCallback((
    tetromino: Tetromino,
    board: GameBoard
  ): GameBoard => {
    const newBoard = board.map(row => [...row]); // Копируем доску
    const { cells, position } = tetromino;

    // Помещаем каждую клетку фигуры на доску
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[i].length; j++) {
        // Пропускаем пустые клетки в фигуре
        if (cells[i][j].isEmpty) continue;

        const boardX = position.x + j;
        const boardY = position.y + i;

        // Проверяем что клетка в границах доски
        if (
          boardY >= 0 &&
          boardX >= 0 &&
          boardX < newBoard[0].length &&
          boardY < newBoard.length
        ) {
          // Помещаем клетку фигуры на доску
          newBoard[boardY][boardX] = cells[i][j];
        }
      }
    }

    return newBoard;
  }, []);

  /**
   * Проверка game over - если новую фигуру нельзя спавнить
   * @param tetromino - новая фигура которую пытаемся спавнить
   * @param board - текущая доска
   * @returns true если game over, false если можно продолжать
   */
  const checkGameOver = useCallback((
    tetromino: Tetromino,
    board: GameBoard
  ): boolean => {
    const { cells, position } = tetromino;

    // Проверяем каждую клетку фигуры
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[i].length; j++) {
        if (cells[i][j].isEmpty) continue;

        const boardX = position.x + j;
        const boardY = position.y + i;

        // Если клетка выходит за верхнюю границу и там уже есть блоки - game over
        if (boardY < 0) {
          continue; // Это нормально в начале спавна
        }

        // Если клетка занята на доске - game over
        if (board[boardY] && board[boardY][boardX]) {
          console.log(`💀 Game over detected at position (${boardX}, ${boardY})`);
          return true;
        }
      }
    }

    return false;
  }, []);

  /**
   * Получить высоту заполненных клеток в колонне
   * Полезно для AI или визуализации
   * @param board - игровая доска
   * @param col - номер колонны
   * @returns высота от дна
   */
  const getColumnHeight = useCallback((board: GameBoard, col: number): number => {
    for (let y = 0; y < board.length; y++) {
      if (board[y][col] !== null) {
        return board.length - y;
      }
    }
    return 0;
  }, []);

  /**
   * Подсчет общего количества заполненных клеток на доске
   * @param board - игровая доска
   * @returns количество заполненных клеток
   */
  const countFilledCells = useCallback((board: GameBoard): number => {
    let count = 0;
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        if (board[y][x] !== null) {
          count++;
        }
      }
    }
    return count;
  }, []);

  /**
   * Проверить есть ли дыры в столбце (пустые клетки под заполненными)
   * @param board - игровая доска
   * @param col - номер колонны
   * @returns количество дыр
   */
  const countHolesInColumn = useCallback((board: GameBoard, col: number): number => {
    let holes = 0;
    let foundFilled = false;

    // Идем от верхней части доски вниз
    for (let y = 0; y < board.length; y++) {
      if (board[y][col] !== null) {
        foundFilled = true;
      } else if (foundFilled && board[y][col] === null) {
        // Если нашли заполненную клетку, а потом пустую - это дыра
        holes++;
      }
    }

    return holes;
  }, []);

  return {
    findCompletedLines,
    clearCompletedLines,
    calculateLineClearScore,
    placeTetromino,
    checkGameOver,
    getColumnHeight,
    countFilledCells,
    countHolesInColumn,
  };
};
