// hooks/useGameState.ts

import { useState, useCallback } from 'react';
import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Tetromino } from '../types/tetromino';
import { TetrominoFactory, TetrominoUtils } from '../utils/tetrominoFactory';
import { useGameLoop } from './useGameLoop';

// Выносим функцию создания начального состояния наружу
const createInitialState = (gameConfig: GameConfig): GameState => {
  const allTetrominos = TetrominoFactory.createMultiple(4);

  return {
    currentTetromino: allTetrominos.shift() || null,
    nextTetrominos: allTetrominos,
    heldTetromino: null,
    canHold: true,
    board: Array(gameConfig.boardHeight)
      .fill(null)
      .map(() => Array(gameConfig.boardWidth).fill(null)),
    score: 0,
    level: 1,
    linesCleared: 0,
    wordsFormed: 0,
    isGameOver: false,
    isPaused: false,
    gameSpeed: gameConfig.initialSpeed,
  };
};

export const useGameState = (
  config: GameConfig = DEFAULT_GAME_CONFIG,
  initialGameState?: GameState
) => {
  const [gameState, setGameState] = useState(() =>
    initialGameState || createInitialState(config)
  );

  // Функция для получения новой фигуры
  const spawnNewTetromino = useCallback(() => {
    setGameState(prev => {
      const newNextTetrominos = [...prev.nextTetrominos];
      const newCurrentTetromino = newNextTetrominos.shift() || null;

      // Если следующих фигур осталось меньше 3, добавляем новые
      if (newNextTetrominos.length < 3) {
        const additionalTetrominos = TetrominoFactory.createMultiple(
          3 - newNextTetrominos.length
        );
        newNextTetrominos.push(...additionalTetrominos);
      }

      return {
        ...prev,
        currentTetromino: newCurrentTetromino,
        nextTetrominos: newNextTetrominos,
      };
    });
  }, []);

  // Обработчик завершения игры
  const handleGameOver = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
    }));
  }, []);

  // Интегрируем игровой цикл
  useGameLoop({
    gameState,
    onTick: () => {
      // Автоматическое падение фигуры вниз
      setGameState(prev => ({
        ...prev,
        currentTetromino: prev.currentTetromino
          ? {
              ...prev.currentTetromino,
              position: {
                ...prev.currentTetromino.position,
                y: prev.currentTetromino.position.y + 1,
              },
            }
          : null,
      }));
    },
  });

  // Действия для изменения состояния
  const moveTetromino = useCallback((dx: number, dy: number) => {
    setGameState(prev => ({
      ...prev,
      currentTetromino: prev.currentTetromino
        ? {
            ...prev.currentTetromino,
            position: {
              x: prev.currentTetromino.position.x + dx,
              y: prev.currentTetromino.position.y + dy,
            },
          }
        : null,
    }));
  }, []);

  const rotateTetromino = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentTetromino: prev.currentTetromino
        ? TetrominoUtils.rotate(prev.currentTetromino)
        : null,
    }));
  }, []);

  const holdTetromino = useCallback(() => {
    setGameState(prev => {
      if (!prev.canHold || !prev.currentTetromino) return prev;

      const newHeldTetromino = prev.currentTetromino;
      const newCurrentTetromino = prev.nextTetrominos[0] || null;
      const newNextTetrominos = prev.nextTetrominos.slice(1);

      // Добавляем новую фигуру в очередь если нужно
      const finalNextTetrominos =
        newNextTetrominos.length >= 3
          ? newNextTetrominos
          : [
              ...newNextTetrominos,
              ...TetrominoFactory.createMultiple(
                3 - newNextTetrominos.length
              ),
            ];

      if (newCurrentTetromino) {
        return {
          ...prev,
          currentTetromino: newCurrentTetromino,
          nextTetrominos: finalNextTetrominos,
          heldTetromino: newHeldTetromino,
          canHold: false,
        };
      }

      return prev;
    });
  }, []);

  const hardDrop = useCallback(() => {
    setGameState(prev => {
      return {
        ...prev,
        currentTetromino: prev.currentTetromino
          ? {
              ...prev.currentTetromino,
              position: {
                ...prev.currentTetromino.position,
                y: prev.currentTetromino.position.y + 10, // Быстрое падение
              },
            }
          : null,
      };
    });
  }, []);

  const pause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const restart = useCallback(() => {
    setGameState(createInitialState(config));
  }, [config]);

  const addScore = useCallback((points: number) => {
    setGameState(prev => ({ ...prev, score: prev.score + points }));
  }, []);

  const addLines = useCallback((lines: number) => {
    setGameState(prev => ({
      ...prev,
      linesCleared: prev.linesCleared + lines,
    }));
  }, []);

  const addWord = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      wordsFormed: prev.wordsFormed + 1,
    }));
  }, []);

  const levelUp = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      gameSpeed: Math.max(100, prev.gameSpeed - config.speedIncreasePerLevel),
    }));
  }, [config.speedIncreasePerLevel]);

  const setCurrentTetromino = useCallback((tetromino: Tetromino | null) => {
    setGameState(prev => ({ ...prev, currentTetromino: tetromino }));
  }, []);

  const setNextTetrominos = useCallback((tetrominos: Tetromino[]) => {
    setGameState(prev => ({ ...prev, nextTetrominos: tetrominos }));
  }, []);

  const setBoard = useCallback((board: GameState['board']) => {
    setGameState(prev => ({ ...prev, board }));
  }, []);

  const setGameOver = useCallback((isGameOver: boolean) => {
    setGameState(prev => ({ ...prev, isGameOver }));
  }, []);

  const setCanHold = useCallback((canHold: boolean) => {
    setGameState(prev => ({ ...prev, canHold }));
  }, []);

  return {
    gameState,
    actions: {
      moveTetromino,
      rotateTetromino,
      holdTetromino,
      hardDrop,
      pause,
      resume,
      restart,
      addScore,
      addLines,
      addWord,
      levelUp,
      setCurrentTetromino,
      setNextTetrominos,
      setBoard,
      setGameOver,
      setCanHold,
      spawnNew: spawnNewTetromino,
    },
  };
};
