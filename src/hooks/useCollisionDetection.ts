// hooks/useCollisionDetection.ts

import { useCallback } from 'react';
import { Tetromino } from '../types/tetromino';
import { GameBoard } from '../types/game';
import { rotateWithSRS, RotateDir } from '../utils/srcRotation';

export const useCollisionDetection = () => {
  const checkCollision = useCallback(
    (tetromino: Tetromino, board: GameBoard, position?: { x: number; y: number }): boolean => {
      const { cells } = tetromino;
      const pos = position || tetromino.position;

      for (let i = 0; i < cells.length; i++) {
        for (let j = 0; j < cells[i].length; j++) {
          if (cells[i][j].isEmpty) continue;

          const boardX = pos.x + j;
          const boardY = pos.y + i;

          if (boardX < 0 || boardX >= board[0].length) {
            return true;
          }

          if (boardY >= board.length) {
            return true;
          }

          if (boardY >= 0 && board[boardY]?.[boardX]) {
            return true;
          }
        }
      }

      return false;
    },
    []
  );

  const checkMove = useCallback(
    (tetromino: Tetromino, board: GameBoard, dx: number, dy: number): boolean => {
      const newPosition = {
        x: tetromino.position.x + dx,
        y: tetromino.position.y + dy,
      };

      return checkCollision(tetromino, board, newPosition);
    },
    [checkCollision]
  );

  const tryRotation = useCallback(
    (tetromino: Tetromino, board: GameBoard, dir: RotateDir = 'CW'): Tetromino | null => {
      return rotateWithSRS(tetromino, board, dir);
    },
    []
  );

  const checkRotation = useCallback(
    (tetromino: Tetromino, board: GameBoard): boolean => {
      return rotateWithSRS(tetromino, board, 'CW') !== null;
    },
    []
  );

  const canSpawn = useCallback(
    (tetromino: Tetromino, board: GameBoard): boolean => {
      return !checkCollision(tetromino, board);
    },
    [checkCollision]
  );

  const getValidPosition = useCallback(
    (
      tetromino: Tetromino,
      board: GameBoard,
      direction: 'left' | 'right' | 'down'
    ): { x: number; y: number } | null => {
      const { position } = tetromino;
      let dx = 0,
        dy = 0;

      switch (direction) {
        case 'left':
          dx = -1;
          break;
        case 'right':
          dx = 1;
          break;
        case 'down':
          dy = 1;
          break;
      }

      const newPosition = {
        x: position.x + dx,
        y: position.y + dy,
      };

      if (!checkCollision(tetromino, board, newPosition)) {
        return newPosition;
      }

      return null;
    },
    [checkCollision]
  );

  const hasLanded = useCallback(
    (tetromino: Tetromino, board: GameBoard): boolean => {
      const positionBelow = {
        x: tetromino.position.x,
        y: tetromino.position.y + 1,
      };

      return checkCollision(tetromino, board, positionBelow);
    },
    [checkCollision]
  );

  return {
    checkCollision,
    checkMove,
    checkRotation,
    canSpawn,
    getValidPosition,
    hasLanded,
    tryRotation,
  };
};
