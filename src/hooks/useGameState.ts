// hooks/useGameState.ts

import { useState, useCallback, useEffect, useRef } from 'react';

import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Tetromino } from '../types/tetromino';
import { TetrominoFactory } from '../utils/tetrominoFactory';

import { useGameLoop } from './useGameLoop';
import { useBoardManager } from './useBoardManager';
import { useCollisionDetection } from './useCollisionDetection';

export const useGameState = (
  config: GameConfig = DEFAULT_GAME_CONFIG,
  initialGameState?: GameState,
  onLinesCleared?: (count: number) => void,
  onLevelUp?: () => void,
) => {
  const LOCK_DELAY_TIME = 500;
  const MAX_LEVEL = 14; 
  /**
   * ✅ ФИКС: храним актуальные буквы целевого слова в ref.
   * Тогда любая “доливка” очереди (после 3 next-ов) продолжит учитывать цель.
   */
  const targetLettersRef = useRef<string[] | undefined>(
    config.targetWord?.split('') ?? undefined
  );

  /**
   * ✅ Новый action: обновлять ref при смене целевого слова (из GameScreen).
   */
  const setTargetWordLetters = useCallback((letters?: string[]) => {
    targetLettersRef.current = letters && letters.length > 0 ? letters : undefined;
  }, []);

  const createInitialState = (): GameState => {
    const allTetrominos = TetrominoFactory.createMultiple(
      config.nextTetrominosCount + 1,
      {
        targetWordLetters: targetLettersRef.current,
      }
    );

    return {
      currentTetromino: allTetrominos.shift() || null,
      nextTetrominos: allTetrominos,
      heldTetromino: null,
      canHold: true,
      board: Array(config.boardHeight)
        .fill(null)
        .map(() => Array(config.boardWidth).fill(null)),
      score: 0,
      level: 1,
      linesCleared: 0,
      wordsFormed: 0,
      isGameOver: false,
      isPaused: false,
      gameSpeed: config.initialSpeed,
      ghostTetrominoY: 0,
    };
  };

  const [gameState, setGameState] = useState(() => initialGameState || createInitialState());

  const boardManager = useBoardManager();
  const { checkCollision, tryRotation } = useCollisionDetection();

  const lockDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockDelayActiveRef = useRef(false);

  const getGhostTetrominoY = useCallback(
    (tetromino: Tetromino | null, board: typeof gameState.board): number => {
      if (!tetromino) return 0;
      let y = tetromino.position.y;

      while (
        !checkCollision(tetromino, board, {
          x: tetromino.position.x,
          y: y + 1,
        })
      ) {
        y += 1;
      }

      return y;
    },
    [checkCollision]
  );

  const clearLockDelay = useCallback(() => {
    if (lockDelayTimerRef.current) {
      clearTimeout(lockDelayTimerRef.current);
      lockDelayTimerRef.current = null;
    }
    lockDelayActiveRef.current = false;
  }, []);

  const landTetrominoImmediate = useCallback(
    (prev: GameState): GameState => {
      if (!prev.currentTetromino) return prev;

      const newBoard = boardManager.placeTetromino(prev.currentTetromino, prev.board);
      const { newBoard: boardAfterClear, linesCleared } = boardManager.clearCompletedLines(newBoard);

      let newScore = prev.score;
      let newLevel = prev.level;
      let newGameSpeed = prev.gameSpeed;

      if (linesCleared > 0) {
        onLinesCleared?.(linesCleared);

        const lineClearScore = boardManager.calculateLineClearScore(linesCleared, prev.level);
        newScore = prev.score + lineClearScore;

        const totalLines = prev.linesCleared + linesCleared;
        if (Math.floor(totalLines / 10) > Math.floor(prev.linesCleared / 10)) {
          if (prev.level < MAX_LEVEL) {
            newLevel = prev.level + 1;
            newGameSpeed = Math.max(100, prev.gameSpeed - config.speedIncreasePerLevel);
            onLevelUp?.();
          } else {
            newLevel = MAX_LEVEL;
            newGameSpeed = prev.gameSpeed; // не ускоряем дальше
          }
        }
      }

      const newNextTetrominos = [...prev.nextTetrominos];
      const newCurrentTetromino = newNextTetrominos.shift() || null;

      // ✅ ФИКС: доливаем очередь с актуальными targetLettersRef.current
      if (newNextTetrominos.length < config.nextTetrominosCount) {
        const additionalTetrominos = TetrominoFactory.createMultiple(
          config.nextTetrominosCount - newNextTetrominos.length,
          { targetWordLetters: targetLettersRef.current }
        );
        newNextTetrominos.push(...additionalTetrominos);
      }

      let isGameOver = false;
      if (newCurrentTetromino) {
        const canSpawn = !checkCollision(newCurrentTetromino, boardAfterClear);
        if (!canSpawn) isGameOver = true;
      }

      const ghostY = newCurrentTetromino
        ? getGhostTetrominoY(newCurrentTetromino, boardAfterClear)
        : 0;

      clearLockDelay();

      return {
        ...prev,
        board: boardAfterClear,
        currentTetromino: newCurrentTetromino,
        nextTetrominos: newNextTetrominos,
        score: newScore,
        level: newLevel,
        gameSpeed: newGameSpeed,
        linesCleared: prev.linesCleared + linesCleared,
        isGameOver,
        canHold: true,
        ghostTetrominoY: ghostY,
      };
    },
    [
      boardManager,
      checkCollision,
      clearLockDelay,
      config.nextTetrominosCount,
      config.speedIncreasePerLevel,
      getGhostTetrominoY,
      onLevelUp,
      onLinesCleared,
    ]
  );

  const activateLockDelay = useCallback(() => {
    if (lockDelayTimerRef.current) clearTimeout(lockDelayTimerRef.current);

    lockDelayActiveRef.current = true;
    lockDelayTimerRef.current = setTimeout(() => {
      lockDelayTimerRef.current = null;
      lockDelayActiveRef.current = false;

      setGameState((prev) => {
        if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) return prev;
        return landTetrominoImmediate(prev);
      });
    }, LOCK_DELAY_TIME);
  }, [landTetrominoImmediate]);

  const { resetTick } = useGameLoop({
    gameState,
    onTick: () => {
      setGameState((prev) => {
        if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) return prev;
        if (lockDelayActiveRef.current) return prev;

        const newPosition = {
          x: prev.currentTetromino.position.x,
          y: prev.currentTetromino.position.y + 1,
        };

        const collision = checkCollision(prev.currentTetromino, prev.board, newPosition);

        if (collision) {
          activateLockDelay();
          return prev;
        }

        const ghostY = getGhostTetrominoY(prev.currentTetromino, prev.board);

        return {
          ...prev,
          currentTetromino: {
            ...prev.currentTetromino,
            position: newPosition,
          },
          ghostTetrominoY: ghostY,
        };
      });
    },
  });

  const moveTetromino = useCallback(
    (dx: number, dy: number) => {
      setGameState((prev) => {
        if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) return prev;

        const newPosition = {
          x: prev.currentTetromino.position.x + dx,
          y: prev.currentTetromino.position.y + dy,
        };

        const collision = checkCollision(prev.currentTetromino, prev.board, newPosition);
        if (collision) {
          if (dy > 0 && !lockDelayActiveRef.current) activateLockDelay();
          return prev;
        }

        const updatedTetromino = { ...prev.currentTetromino, position: newPosition };

        // если двигаем по X — проверим, не упёрлись ли в "низ", и управляем lock-delay
        if (dx !== 0) {
          const nextPosition = { x: newPosition.x, y: newPosition.y + 1 };
          const hasBottomCollision = checkCollision(prev.currentTetromino, prev.board, nextPosition);

          if (hasBottomCollision && !lockDelayActiveRef.current) activateLockDelay();
          else if (!hasBottomCollision && lockDelayActiveRef.current) clearLockDelay();
        }

        const ghostY = getGhostTetrominoY(updatedTetromino, prev.board);

        return {
          ...prev,
          currentTetromino: updatedTetromino,
          ghostTetrominoY: ghostY,
        };
      });
    },
    [activateLockDelay, checkCollision, clearLockDelay, getGhostTetrominoY]
  );

  const rotateTetromino = useCallback(
    (dir: 'CW' | 'CCW' = 'CW') => {
      setGameState((prev) => {
        if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) return prev;

        const rotated = tryRotation(prev.currentTetromino, prev.board, dir);
        if (!rotated) return prev;

        const nextPos = { x: rotated.position.x, y: rotated.position.y + 1 };
        const touchesBottom = checkCollision(rotated, prev.board, nextPos);

        if (touchesBottom && !lockDelayActiveRef.current) activateLockDelay();
        else if (!touchesBottom && lockDelayActiveRef.current) clearLockDelay();

        const ghostY = getGhostTetrominoY(rotated, prev.board);

        return {
          ...prev,
          currentTetromino: rotated,
          ghostTetrominoY: ghostY,
        };
      });
    },
    [activateLockDelay, checkCollision, clearLockDelay, getGhostTetrominoY, tryRotation]
  );

  const holdTetromino = useCallback(() => {
    setGameState((prev) => {
      if (!prev.canHold || !prev.currentTetromino || prev.isPaused || prev.isGameOver) return prev;

      // кладём в hold текущую фигуру
      if (!prev.heldTetromino) {
        const letters = prev.currentTetromino.cells
          .flat()
          .filter((cell) => !cell.isEmpty)
          .map((cell) => cell.letter);

        const newHeldTetromino = TetrominoFactory.create(prev.currentTetromino.type, letters, 3, 0, {
          targetWordLetters: targetLettersRef.current,
        });

        const newNextTetrominos = [...prev.nextTetrominos];
        const newCurrentTetromino = newNextTetrominos.shift() || null;

        if (newNextTetrominos.length < config.nextTetrominosCount) {
          const additionalTetrominos = TetrominoFactory.createMultiple(
            config.nextTetrominosCount - newNextTetrominos.length,
            { targetWordLetters: targetLettersRef.current }
          );
          newNextTetrominos.push(...additionalTetrominos);
        }

        clearLockDelay();
        resetTick(80);

        const ghostY = newCurrentTetromino ? getGhostTetrominoY(newCurrentTetromino, prev.board) : 0;

        return {
          ...prev,
          currentTetromino: newCurrentTetromino,
          nextTetrominos: newNextTetrominos,
          heldTetromino: newHeldTetromino,
          canHold: false,
          ghostTetrominoY: ghostY,
        };
      }

      // меняем current <-> held
      const newCurrentTetromino = prev.heldTetromino;

      const letters = prev.currentTetromino.cells
        .flat()
        .filter((cell) => !cell.isEmpty)
        .map((cell) => cell.letter);

      const newHeldTetromino = TetrominoFactory.create(prev.currentTetromino.type, letters, 3, 0, {
        targetWordLetters: targetLettersRef.current,
      });

      clearLockDelay();
      resetTick(80);

      const ghostY = getGhostTetrominoY(newCurrentTetromino, prev.board);

      return {
        ...prev,
        currentTetromino: newCurrentTetromino,
        heldTetromino: newHeldTetromino,
        canHold: false,
        ghostTetrominoY: ghostY,
      };
    });
  }, [clearLockDelay, config.nextTetrominosCount, getGhostTetrominoY, resetTick]);

  const hardDrop = useCallback(() => {
    setGameState((prev) => {
      if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) return prev;

      let y = prev.currentTetromino.position.y;
      while (
        !checkCollision(prev.currentTetromino, prev.board, {
          x: prev.currentTetromino.position.x,
          y: y + 1,
        })
      ) {
        y += 1;
      }

      const finalTetromino: Tetromino = {
        ...prev.currentTetromino,
        position: { x: prev.currentTetromino.position.x, y },
      };

      clearLockDelay();
      return landTetrominoImmediate({ ...prev, currentTetromino: finalTetromino });
    });

    resetTick(80);
  }, [checkCollision, clearLockDelay, landTetrominoImmediate, resetTick]);

  const pause = useCallback(() => {
    clearLockDelay();
    setGameState((prev) => ({ ...prev, isPaused: true }));
  }, [clearLockDelay]);

  const resume = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const restart = useCallback(() => {
    const initial = createInitialState();
    setGameState(initial);
    resetTick(80);
  }, [resetTick]);

  const addScore = useCallback((points: number) => {
    setGameState((prev) => ({ ...prev, score: prev.score + points }));
  }, []);

  const addLines = useCallback((lines: number) => {
    setGameState((prev) => ({ ...prev, linesCleared: prev.linesCleared + lines }));
  }, []);

  const addWord = useCallback(() => {
    setGameState((prev) => ({ ...prev, wordsFormed: prev.wordsFormed + 1 }));
  }, []);

  const levelUp = useCallback(() => {
    setGameState((prev) => {
      if (prev.level >= MAX_LEVEL) return prev;

      return {
        ...prev,
        level: prev.level + 1,
        gameSpeed: Math.max(100, prev.gameSpeed - config.speedIncreasePerLevel),
      };
    });
  }, [config.speedIncreasePerLevel]);

  const spawnNewTetromino = useCallback(() => {
    setGameState((prev) => {
      const newNextTetrominos = [...prev.nextTetrominos];
      const newCurrentTetromino = newNextTetrominos.shift() || null;

      if (newNextTetrominos.length < config.nextTetrominosCount) {
        const additionalTetrominos = TetrominoFactory.createMultiple(
          config.nextTetrominosCount - newNextTetrominos.length,
          { targetWordLetters: targetLettersRef.current }
        );
        newNextTetrominos.push(...additionalTetrominos);
      }

      if (!newCurrentTetromino) return prev;

      const ghostY = getGhostTetrominoY(newCurrentTetromino, prev.board);

      return {
        ...prev,
        currentTetromino: newCurrentTetromino,
        nextTetrominos: newNextTetrominos,
        canHold: true,
        ghostTetrominoY: ghostY,
      };
    });

    resetTick(80);
  }, [config.nextTetrominosCount, getGhostTetrominoY, resetTick]);

  const setCurrentTetromino = useCallback((tetromino: Tetromino | null) => {
    setGameState((prev) => ({ ...prev, currentTetromino: tetromino }));
  }, []);

  const setNextTetrominos = useCallback((tetrominos: Tetromino[]) => {
    setGameState((prev) => ({ ...prev, nextTetrominos: tetrominos }));
  }, []);

  const updateCurrentTetromino = useCallback((newCurrentTetromino: Tetromino) => {
    setGameState((prev) => ({ ...prev, currentTetromino: newCurrentTetromino }));
  }, []);

  const updateNextTetrominos = useCallback((newNextTetrominos: Tetromino[]) => {
    console.log('🎮 updateNextTetrominos:', newNextTetrominos.length, 'тетромино');
    setGameState((prev) => ({ ...prev, nextTetrominos: newNextTetrominos }));
  }, []);

  const setBoard = useCallback((board: GameState['board']) => {
    setGameState((prev) => ({ ...prev, board }));
  }, []);

  const setGameOver = useCallback(
    (isGameOver: boolean) => {
      clearLockDelay();
      setGameState((prev) => ({ ...prev, isGameOver }));
    },
    [clearLockDelay]
  );

  const setCanHold = useCallback((canHold: boolean) => {
    setGameState((prev) => ({ ...prev, canHold }));
  }, []);

  useEffect(() => {
    return () => {
      clearLockDelay();
    };
  }, [clearLockDelay]);

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
      updateCurrentTetromino,
      updateNextTetrominos,
      setBoard,
      setGameOver,
      setCanHold,
      setTargetWordLetters, // ✅ НОВОЕ
      spawnNew: spawnNewTetromino,
      applyWordResult: (word: string) => {
        const len = (word || '').trim().length;
        const bonus = len > 2 ? (len - 2) * 50 : 0;
        addWord();
        if (bonus > 0) addScore(bonus);
      },
    },
  };
};
