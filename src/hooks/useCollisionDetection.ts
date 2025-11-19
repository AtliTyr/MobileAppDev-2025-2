// hooks/useCollisionDetection.ts
import { useCallback } from 'react';
import { Tetromino } from '../types/tetromino';
import { GameBoard } from '../types/game';

export const useCollisionDetection = () => {
  // Основная функция проверки коллизий
  const checkCollision = useCallback((
    tetromino: Tetromino, 
    board: GameBoard,
    position?: { x: number; y: number }
  ): boolean => {
    const { cells } = tetromino;
    const pos = position || tetromino.position;
    
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[i].length; j++) {
        if (cells[i][j].isEmpty) continue;
        
        const boardX = pos.x + j;
        const boardY = pos.y + i;
        
        // Проверка выхода за границы по бокам
        if (boardX < 0 || boardX >= board[0].length) {
          return true;
        }
        
        // Проверка выхода за нижнюю границу
        if (boardY >= board.length) {
          return true;
        }
        
        // Проверка столкновения с другими фигурами (только если внутри поля)
        if (boardY >= 0 && board[boardY]?.[boardX]) {
          return true;
        }
      }
    }
    
    return false;
  }, []);

  // Проверка конкретного движения
  const checkMove = useCallback((
    tetromino: Tetromino,
    board: GameBoard,
    dx: number,
    dy: number
  ): boolean => {
    const newPosition = {
      x: tetromino.position.x + dx,
      y: tetromino.position.y + dy
    };
    
    return checkCollision(tetromino, board, newPosition);
  }, [checkCollision]);

  // Проверка возможности вращения
  const checkRotation = useCallback((
    tetromino: Tetromino,
    board: GameBoard
  ): boolean => {
    const rotatedTetromino = {
      ...tetromino,
      cells: rotateMatrix(tetromino.cells)
    };
    
    return checkCollision(rotatedTetromino, board);
  }, [checkCollision]);

  // Проверка возможности спавна новой фигуры
  const canSpawn = useCallback((
    tetromino: Tetromino,
    board: GameBoard
  ): boolean => {
    return !checkCollision(tetromino, board);
  }, [checkCollision]);

  // Поиск валидной позиции при движении
  const getValidPosition = useCallback((
    tetromino: Tetromino,
    board: GameBoard,
    direction: 'left' | 'right' | 'down'
  ): { x: number; y: number } | null => {
    const { position } = tetromino;
    let dx = 0, dy = 0;
    
    switch (direction) {
      case 'left': dx = -1; break;
      case 'right': dx = 1; break;
      case 'down': dy = 1; break;
    }
    
    const newPosition = {
      x: position.x + dx,
      y: position.y + dy
    };
    
    if (!checkCollision(tetromino, board, newPosition)) {
      return newPosition;
    }
    
    return null;
  }, [checkCollision]);

  // Проверка "приземления" - когда фигура достигла дна
  const hasLanded = useCallback((
    tetromino: Tetromino,
    board: GameBoard
  ): boolean => {
    const positionBelow = {
      x: tetromino.position.x,
      y: tetromino.position.y + 1
    };
    
    return checkCollision(tetromino, board, positionBelow);
  }, [checkCollision]);

  return {
    checkCollision,
    checkMove,
    checkRotation,
    canSpawn,
    getValidPosition,
    hasLanded
  };
};

// Вспомогательная функция для вращения матрицы (временно здесь)
const rotateMatrix = (cells: Tetromino['cells']): Tetromino['cells'] => {
  const rows = cells.length;
  const cols = cells[0].length;
  
  const rotatedCells: Tetromino['cells'] = Array(cols)
    .fill(null)
    .map(() => Array(rows).fill({
      letter: '',
      color: '#000000',
      isEmpty: true
    }));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rotatedCells[j][rows - 1 - i] = {
        ...cells[i][j],
        isEmpty: cells[i][j].isEmpty
      };
    }
  }

  return rotatedCells;
};