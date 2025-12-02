// hooks/useGameState.ts - ИСПРАВЛЕНИЕ: Lock Delay обновляется ТОЛЬКО при реальном движении

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Tetromino } from '../types/tetromino';
import { TetrominoFactory, TetrominoUtils } from '../utils/tetrominoFactory';
import { useGameLoop } from './useGameLoop';
import { useBoardManager } from './useBoardManager';
import { useCollisionDetection } from './useCollisionDetection';

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

// ========================================
// ⏱️ LOCK DELAY КОНСТАНТЫ
// ========================================

const LOCK_DELAY_TIME = 500; // 500ms - стандартный Тетрис

export const useGameState = (
  config: GameConfig = DEFAULT_GAME_CONFIG,
  initialGameState?: GameState
) => {
  const [gameState, setGameState] = useState(() =>
    initialGameState || createInitialState(config)
  );

  const boardManager = useBoardManager();
  const collisionDetection = useCollisionDetection();

  // ========================================
  // 🔴 LOCK DELAY REFS
  // ========================================

  const lockDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockDelayActiveRef = useRef(false);
  const lockDelayElapsedRef = useRef(0);

  // ========================================
  // 🧹 ОЧИСТКА Lock Delay
  // ========================================

  const clearLockDelay = useCallback(() => {
    if (lockDelayTimerRef.current) {
      clearTimeout(lockDelayTimerRef.current);
      lockDelayTimerRef.current = null;
      lockDelayActiveRef.current = false;
      lockDelayElapsedRef.current = 0;
      console.log('🧹 Lock Delay очищен');
    }
  }, []);

  // ========================================
  // ⏱️ АКТИВАЦИЯ Lock Delay
  // ========================================

  const activateLockDelay = useCallback(() => {
    // Отменяем старый таймер
    if (lockDelayTimerRef.current) {
      clearTimeout(lockDelayTimerRef.current);
    }

    lockDelayActiveRef.current = true;
    lockDelayElapsedRef.current = 0;

    console.log(`⏱️ Lock Delay АКТИВИРОВАН (${LOCK_DELAY_TIME}ms)`);

    lockDelayTimerRef.current = setTimeout(() => {
      console.log('⏰ Lock Delay время истекло! Приземляем фигуру');
      lockDelayTimerRef.current = null;
      lockDelayActiveRef.current = false;

      // ЭТО КРИТИЧНО: используем setGameState чтобы приземлить фигуру
      setGameState(prev => {
        if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) {
          return prev;
        }
        return landTetrominoImmediate(prev);
      });
    }, LOCK_DELAY_TIME);
  }, []);

  // ========================================
  // 🛬 ПРИЗЕМЛЕНИЕ ФИГУРЫ
  // ========================================

  const landTetrominoImmediate = (prev: GameState): GameState => {
    if (!prev.currentTetromino) return prev;

    const newBoard = boardManager.placeTetromino(
      prev.currentTetromino,
      prev.board
    );

    const { newBoard: boardAfterClear, linesCleared } =
      boardManager.clearCompletedLines(newBoard);

    let newScore = prev.score;
    let newLevel = prev.level;
    let newGameSpeed = prev.gameSpeed;

    if (linesCleared > 0) {
      const lineClearScore = boardManager.calculateLineClearScore(
        linesCleared,
        prev.level
      );
      newScore = prev.score + lineClearScore;

      const totalLines = prev.linesCleared + linesCleared;
      if (Math.floor(totalLines / 10) > Math.floor(prev.linesCleared / 10)) {
        newLevel = prev.level + 1;
        newGameSpeed = Math.max(
          100,
          prev.gameSpeed - config.speedIncreasePerLevel
        );
      }
    }

    const newNextTetrominos = [...prev.nextTetrominos];
    const newCurrentTetromino = newNextTetrominos.shift() || null;

    if (newNextTetrominos.length < 3) {
      const additionalTetrominos = TetrominoFactory.createMultiple(
        3 - newNextTetrominos.length
      );
      newNextTetrominos.push(...additionalTetrominos);
    }

    let isGameOver = false;
    if (newCurrentTetromino) {
      const canSpawn = !collisionDetection.checkCollision(
        newCurrentTetromino,
        boardAfterClear
      );
      if (!canSpawn) {
        isGameOver = true;
      }
    }

    // 🧹 Очищаем Lock Delay при приземлении
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
      isGameOver: isGameOver,
      canHold: true,
    };
  };

  // ========================================
  // 🎮 ИГРОВОЙ ЦИКЛ
  // ========================================

  useGameLoop({
    gameState,
    onTick: () => {
      setGameState(prev => {
        if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) {
          return prev;
        }

        // 🔴 НОВОЕ: Если Lock Delay активен, просто пропускаем падение
        if (lockDelayActiveRef.current) {
          console.log('⏳ Lock Delay активен, не падаем');
          return prev;
        }

        // Обычное падение
        const newPosition = {
          x: prev.currentTetromino.position.x,
          y: prev.currentTetromino.position.y + 1,
        };

        const hasCollision = collisionDetection.checkCollision(
          prev.currentTetromino,
          prev.board,
          newPosition
        );

        if (hasCollision) {
          // 🔴 НОВОЕ: Активируем Lock Delay вместо setShouldLand
          console.log('💥 Коллизия снизу! Активируем Lock Delay');
          activateLockDelay();
          return prev;
        }

        return {
          ...prev,
          currentTetromino: {
            ...prev.currentTetromino,
            position: newPosition,
          },
        };
      });
    },
  });

  // ========================================
  // 👈 ДВИЖЕНИЕ ФИГУРЫ - КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ
  // ========================================

  /**
   * 🔴 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ:
   * Lock Delay обновляется ТОЛЬКО если фигура РЕАЛЬНО ДВИНУЛАСЬ
   * (не просто попыталась упасть, когда уже внизу)
   */
  const moveTetromino = useCallback((dx: number, dy: number) => {
    setGameState(prev => {
      if (!prev.currentTetromino || prev.isPaused || prev.isGameOver)
        return prev;

      const newPosition = {
        x: prev.currentTetromino.position.x + dx,
        y: prev.currentTetromino.position.y + dy,
      };

      const hasCollision = collisionDetection.checkCollision(
        prev.currentTetromino,
        prev.board,
        newPosition
      );

      // Если не можем двинуться в эту сторону
      if (hasCollision) {
        // 🔴 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: 
        // Активируем Lock Delay ТОЛЬКО если это вертикальное движение (dy > 0)
        // И ТОЛЬКО если фигура реально упёрлась (не просто попыталась)
        if (dy > 0) {
          // Это попытка упасть вниз
          // Если нету Lock Delay - активируем, иначе игнорируем
          if (!lockDelayActiveRef.current) {
            console.log('💥 Первый раз упёрлись! Активируем Lock Delay');
            activateLockDelay();
          } else {
            // Lock Delay уже активен
            // Игнорируем попытку упасть - не обновляем таймер!
            console.log('⏳ Lock Delay уже активен, игнорируем попытку упасть');
          }
        }
        return prev;
      }

      // ✅ Успешно двинулись! Обновляем позицию
      const updatedTetromino = {
        ...prev.currentTetromino,
        position: newPosition,
      };

      // 🔴 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ:
      // Проверяем коллизию СНИЗУ в НОВОЙ позиции ТОЛЬКО для горизонтального движения (dx != 0)
      // или для вертикального движения вверх (dy < 0)
      
      // Для горизонтального движения - проверяем коллизию снизу
      if (dx !== 0) {
        const nextPosition = {
          x: newPosition.x,
          y: newPosition.y + 1,
        };

        const hasBottomCollision = collisionDetection.checkCollision(
          prev.currentTetromino,
          prev.board,
          nextPosition
        );

        if (hasBottomCollision) {
          // Коллизия снизу после горизонтального движения → ПЕРЕЗАПУСКАЕМ Lock Delay
          console.log('⏱️ Горизонтальное движение - коллизия снизу! Перезапускаем Lock Delay');
          activateLockDelay();
        } else {
          // НЕТ коллизии → ОТМЕНЯЕМ Lock Delay (фигура ушла от дна)
          if (lockDelayActiveRef.current) {
            console.log('✅ После горизонтального движения - нет коллизии! Отменяем Lock Delay');
            clearLockDelay();
          }
        }
      }

      return {
        ...prev,
        currentTetromino: updatedTetromino,
      };
    });
  }, [collisionDetection, activateLockDelay, clearLockDelay]);

  // ========================================
  // 🔄 ВРАЩЕНИЕ ФИГУРЫ
  // ========================================

  const rotateTetromino = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentTetromino || prev.isPaused || prev.isGameOver)
        return prev;

      const rotatedTetromino = TetrominoUtils.rotate(prev.currentTetromino);

      const hasCollision = collisionDetection.checkCollision(
        rotatedTetromino,
        prev.board
      );

      if (!hasCollision) {
        // 🔴 Проверяем коллизию снизу после вращения
        const nextPosition = {
          x: rotatedTetromino.position.x,
          y: rotatedTetromino.position.y + 1,
        };

        const hasBottomCollision = collisionDetection.checkCollision(
          rotatedTetromino,
          prev.board,
          nextPosition
        );

        if (hasBottomCollision && !lockDelayActiveRef.current) {
          console.log('⏱️ После вращения - коллизия снизу! Активируем Lock Delay');
          activateLockDelay();
        } else if (!hasBottomCollision && lockDelayActiveRef.current) {
          console.log('✅ После вращения - нет коллизии! Отменяем Lock Delay');
          clearLockDelay();
        }

        return {
          ...prev,
          currentTetromino: rotatedTetromino,
        };
      }

      // Wall kick логика
      const wallKickOffsets = [-1, 1, -2, 2];

      for (const offset of wallKickOffsets) {
        const wallKickPosition = {
          x: rotatedTetromino.position.x + offset,
          y: rotatedTetromino.position.y,
        };

        const wallKickTetromino = {
          ...rotatedTetromino,
          position: wallKickPosition,
        };

        const hasWallKickCollision = collisionDetection.checkCollision(
          wallKickTetromino,
          prev.board
        );

        if (!hasWallKickCollision) {
          // 🔴 Проверяем коллизию снизу после wall kick
          const nextPosition = {
            x: wallKickPosition.x,
            y: wallKickPosition.y + 1,
          };

          const hasBottomCollision = collisionDetection.checkCollision(
            wallKickTetromino,
            prev.board,
            nextPosition
          );

          if (hasBottomCollision && !lockDelayActiveRef.current) {
            console.log('⏱️ После wall kick - коллизия снизу! Активируем Lock Delay');
            activateLockDelay();
          } else if (!hasBottomCollision && lockDelayActiveRef.current) {
            console.log('✅ После wall kick - нет коллизии! Отменяем Lock Delay');
            clearLockDelay();
          }

          return {
            ...prev,
            currentTetromino: wallKickTetromino,
          };
        }
      }

      return prev;
    });
  }, [collisionDetection, activateLockDelay, clearLockDelay]);

  // ========================================
  // 🎯 HOLD ФИГУРЫ
  // ========================================

  const holdTetromino = useCallback(() => {
    setGameState(prev => {
      if (!prev.canHold || !prev.currentTetromino || prev.isPaused || prev.isGameOver) {
        return prev;
      }

      if (!prev.heldTetromino) {
        const letters = prev.currentTetromino.cells
          .flat()
          .filter(cell => !cell.isEmpty)
          .map(cell => cell.letter);

        const newHeldTetromino = prev.currentTetromino.type
          ? TetrominoFactory.create(prev.currentTetromino.type, letters)
          : prev.currentTetromino;

        const newNextTetrominos = [...prev.nextTetrominos];
        const newCurrentTetromino = newNextTetrominos.shift() || null;

        if (newNextTetrominos.length < 3) {
          const additionalTetrominos = TetrominoFactory.createMultiple(
            3 - newNextTetrominos.length
          );
          newNextTetrominos.push(...additionalTetrominos);
        }

        if (newCurrentTetromino) {
          clearLockDelay();

          return {
            ...prev,
            currentTetromino: newCurrentTetromino,
            nextTetrominos: newNextTetrominos,
            heldTetromino: newHeldTetromino,
            canHold: false,
          };
        }

        return prev;
      }

      const newCurrentTetromino = prev.heldTetromino;

      const letters = prev.currentTetromino.cells
        .flat()
        .filter(cell => !cell.isEmpty)
        .map(cell => cell.letter);

      const newHeldTetromino = prev.currentTetromino.type
        ? TetrominoFactory.create(prev.currentTetromino.type, letters)
        : prev.currentTetromino;

      clearLockDelay();

      return {
        ...prev,
        currentTetromino: newCurrentTetromino,
        heldTetromino: newHeldTetromino,
        canHold: false,
      };
    });
  }, [clearLockDelay]);

  // ========================================
  // 💨 HARD DROP
  // ========================================

  const hardDrop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentTetromino || prev.isPaused || prev.isGameOver)
        return prev;

      let y = prev.currentTetromino.position.y;

      while (
        !collisionDetection.checkCollision(prev.currentTetromino, prev.board, {
          x: prev.currentTetromino.position.x,
          y: y + 1,
        })
      ) {
        y += 1;
      }

      const finalTetromino = {
        ...prev.currentTetromino,
        position: {
          x: prev.currentTetromino.position.x,
          y: y,
        },
      };

      clearLockDelay();

      return landTetrominoImmediate({
        ...prev,
        currentTetromino: finalTetromino,
      });
    });
  }, [collisionDetection, clearLockDelay]);

  // ========================================
  // ⏸️ ПАУЗА / ВОЗОБНОВЛЕНИЕ
  // ========================================

  const pause = useCallback(() => {
    clearLockDelay();
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, [clearLockDelay]);

  const resume = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // ========================================
  // 🔄 ПЕРЕЗАГРУЗКА ИГРЫ
  // ========================================

  const restart = useCallback(() => {
    clearLockDelay();
    setGameState(createInitialState(config));
  }, [config, clearLockDelay]);

  // ========================================
  // 📊 ПРОСТЫЕ ДЕЙСТВИЯ
  // ========================================

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
      gameSpeed: Math.max(
        100,
        prev.gameSpeed - config.speedIncreasePerLevel
      ),
    }));
  }, [config.speedIncreasePerLevel]);

  const spawnNewTetromino = useCallback(() => {
    setGameState(prev => {
      const newNextTetrominos = [...prev.nextTetrominos];
      const newCurrentTetromino = newNextTetrominos.shift() || null;

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
        canHold: true,
      };
    });
  }, []);

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
    clearLockDelay();
    setGameState(prev => ({ ...prev, isGameOver }));
  }, [clearLockDelay]);

  const setCanHold = useCallback((canHold: boolean) => {
    setGameState(prev => ({ ...prev, canHold }));
  }, []);

  // ========================================
  // 🧹 CLEANUP ПРИ РАЗМОНТИРОВАНИИ
  // ========================================

  useEffect(() => {
    return () => {
      console.log('🧹 useGameState размонтируется - ОЧИЩАЕМ Lock Delay');
      clearLockDelay();
    };
  }, [clearLockDelay]);

  // ========================================
  // 📤 ВОЗВРАЩАЕМОЕ ЗНАЧЕНИЕ
  // ========================================

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
