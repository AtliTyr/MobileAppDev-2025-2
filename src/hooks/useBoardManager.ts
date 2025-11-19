// hooks/useBoardManager.ts
import { useCallback } from 'react';
import { GameBoard } from '../types/game';
import { Tetromino } from '../types/tetromino';

export const useBoardManager = () => {
  // Поиск заполненных линий
  const findCompletedLines = useCallback((board: GameBoard): number[] => {
    const completedLines: number[] = [];
    
    for (let y = 0; y < board.length; y++) {
      const isLineComplete = board[y].every(cell => cell !== null);
      if (isLineComplete) {
        completedLines.push(y);
      }
    }
    
    return completedLines;
  }, []);

  // Очистка заполненных линий
  const clearCompletedLines = useCallback((board: GameBoard): {
    newBoard: GameBoard;
    linesCleared: number;
  } => {
    const completedLines = findCompletedLines(board);
    if (completedLines.length === 0) {
      return { newBoard: board, linesCleared: 0 };
    }

    const newBoard = [...board];
    
    // Удаляем заполненные линии и добавляем пустые сверху
    completedLines.forEach(lineIndex => {
      newBoard.splice(lineIndex, 1);
      newBoard.unshift(Array(board[0].length).fill(null));
    });

    return {
      newBoard,
      linesCleared: completedLines.length
    };
  }, [findCompletedLines]);

  // Подсчёт очков за очистку линий
  const calculateLineClearScore = useCallback((
    linesCleared: number,
    level: number
  ): number => {
    const baseScores = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 линии
    const score = baseScores[linesCleared] || 0;
    return score * level;
  }, []);

  // Обновление поля после фиксации фигуры
  const placeTetromino = useCallback((
    tetromino: Tetromino,
    board: GameBoard
  ): GameBoard => {
    const newBoard = board.map(row => [...row]);
    const { cells, position } = tetromino;
    
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[i].length; j++) {
        if (cells[i][j].isEmpty) continue;
        
        const boardX = position.x + j;
        const boardY = position.y + i;
        
        if (boardY >= 0 && boardX >= 0 && boardX < newBoard[0].length && boardY < newBoard.length) {
          newBoard[boardY][boardX] = cells[i][j];
        }
      }
    }
    
    return newBoard;
  }, []);

  // Проверка game over (если новая фигура не может появиться)
  const checkGameOver = useCallback((
    tetromino: Tetromino,
    board: GameBoard
  ): boolean => {
    // Если фигура уже сталкивается на стартовой позиции - game over
    for (let i = 0; i < tetromino.cells.length; i++) {
      for (let j = 0; j < tetromino.cells[i].length; j++) {
        if (tetromino.cells[i][j].isEmpty) continue;
        
        const boardX = tetromino.position.x + j;
        const boardY = tetromino.position.y + i;
        
        if (boardY >= 0 && board[boardY]?.[boardX]) {
          return true;
        }
      }
    }
    
    return false;
  }, []);

  // Поиск слов на поле (заглушка для будущей реализации)
  const findWords = useCallback((board: GameBoard): string[] => {
    // TODO: Реализовать поиск слов
    // Пока возвращаем пустой массив
    return [];
  }, []);

  return {
    findCompletedLines,
    clearCompletedLines,
    calculateLineClearScore,
    placeTetromino,
    checkGameOver,
    findWords
  };
};