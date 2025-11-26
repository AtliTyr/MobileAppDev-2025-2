// hooks/useGameState.ts - С LOCK DELAY СИСТЕМОЙ

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

export const useGameState = (
  config: GameConfig = DEFAULT_GAME_CONFIG,
  initialGameState?: GameState
) => {
  const [gameState, setGameState] = useState(() =>
    initialGameState || createInitialState(config)
  );

  const boardManager = useBoardManager();
  const collisionDetection = useCollisionDetection();

  // 🔴 НОВОЕ: Lock Delay система
  const lockDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInLockDelayRef = useRef(false);
  const lastLockDelayCheckRef = useRef(false); // Было ли при последней проверке коллизии снизу?
  const LOCK_DELAY_TIME = 300; // 300ms для размещения фигуры

  // Флаг для отслеживания нужно ли приземлить фигуру
  const [shouldLand, setShouldLand] = useState(false);

  // 🔴 НОВОЕ: Функция для проверки коллизии СНИЗУ
  const hasCollisionBelow = useCallback(
    (tetromino: Tetromino | null, board: GameState['board']) => {
      if (!tetromino) return false;
      return collisionDetection.checkCollision(tetromino, board, {
        x: tetromino.position.x,
        y: tetromino.position.y + 1,
      });
    },
    [collisionDetection]
  );

  // 🔴 НОВОЕ: Функция для запуска Lock Delay таймера
  const startLockDelayTimer = useCallback(() => {
    if (lockDelayTimerRef.current) {
      clearTimeout(lockDelayTimerRef.current);
    }

    isInLockDelayRef.current = true;
    console.log('⏱️ Lock Delay активирован (300ms для размещения)');

    lockDelayTimerRef.current = setTimeout(() => {
      console.log('⏱️ Lock Delay истёк - приземляем фигуру');
      setShouldLand(true);
      isInLockDelayRef.current = false;
      lockDelayTimerRef.current = null;
    }, LOCK_DELAY_TIME);
  }, []);

  // 🔴 НОВОЕ: Функция для отключения Lock Delay таймера
  const clearLockDelayTimer = useCallback(() => {
    if (lockDelayTimerRef.current) {
      clearTimeout(lockDelayTimerRef.current);
      lockDelayTimerRef.current = null;
      isInLockDelayRef.current = false;
      console.log('🛑 Lock Delay отменён (коллизии больше нет)');
    }
  }, []);

  // Функция приземления фигуры на доску
  const landTetromino = useCallback(() => {
    clearLockDelayTimer();

    setGameState(prev => {
      if (!prev.currentTetromino) return prev;

      // 1. Помещаем фигуру на доску
      const newBoard = boardManager.placeTetromino(
        prev.currentTetromino,
        prev.board
      );

      // 2. Проверяем и удаляем полные линии
      const { newBoard: boardAfterClear, linesCleared } =
        boardManager.clearCompletedLines(newBoard);

      // 3. Считаем очки и проверяем level up
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

      // 4. Спавним новую фигуру
      const newNextTetrominos = [...prev.nextTetrominos];
      const newCurrentTetromino = newNextTetrominos.shift() || null;

      if (newNextTetrominos.length < 3) {
        const additionalTetrominos = TetrominoFactory.createMultiple(
          3 - newNextTetrominos.length
        );
        newNextTetrominos.push(...additionalTetrominos);
      }

      // 5. Проверяем game over
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

      lastLockDelayCheckRef.current = false; // Сбрасываем флаг

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
    });
  }, [boardManager, collisionDetection, config.speedIncreasePerLevel, clearLockDelayTimer]);

  // Когда shouldLand = true, вызываем landTetromino
  useEffect(() => {
    if (shouldLand) {
      landTetromino();
      setShouldLand(false);
    }
  }, [shouldLand, landTetromino]);

  // Игровой цикл
  useGameLoop({
    gameState,
    onTick: () => {
      setGameState(prev => {
        if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) {
          return prev;
        }

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
          // 🔴 НОВОЕ: Обнаружена коллизия - проверяем Lock Delay
          if (!isInLockDelayRef.current) {
            console.log('💥 Коллизия снизу обнаружена - запускаем Lock Delay');
            startLockDelayTimer();
          }
          return prev;
        }

        // 🔴 НОВОЕ: Коллизии нет - отменяем Lock Delay если был
        if (isInLockDelayRef.current) {
          console.log('✅ Коллизия исчезла - отменяем Lock Delay');
          clearLockDelayTimer();
          lastLockDelayCheckRef.current = false;
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

  // Движение фигуры влево/вправо/вниз
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

      if (hasCollision) {
        // 🔴 НОВОЕ: Если движение вниз привело к коллизии - запускаем Lock Delay
        if (dy > 0 && !isInLockDelayRef.current) {
          console.log('💥 Коллизия снизу (moveTetromino) - запускаем Lock Delay');
          startLockDelayTimer();
        }
        return prev;
      }

      // 🔴 НОВОЕ: Если движение было успешным и мы в Lock Delay - перезапускаем таймер
      if (isInLockDelayRef.current) {
        console.log('🔄 Позиция изменилась - перезапускаем Lock Delay');
        clearLockDelayTimer();
        startLockDelayTimer();
      }

      // 🔴 НОВОЕ: Если коллизия исчезла - отменяем Lock Delay
      if (isInLockDelayRef.current && !hasCollisionBelow(
        { ...prev.currentTetromino, position: newPosition },
        prev.board
      )) {
        console.log('✅ Коллизия исчезла - отменяем Lock Delay');
        clearLockDelayTimer();
      }

      return {
        ...prev,
        currentTetromino: {
          ...prev.currentTetromino,
          position: newPosition,
        },
      };
    });
  }, [collisionDetection, startLockDelayTimer, clearLockDelayTimer, hasCollisionBelow]);

  // Вращение фигуры с wall kick
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
        // 🔴 НОВОЕ: Если поворот успешен и мы в Lock Delay - перезапускаем таймер
        if (isInLockDelayRef.current) {
          console.log('🔄 Поворот успешен - перезапускаем Lock Delay');
          clearLockDelayTimer();
          startLockDelayTimer();
        }

        return {
          ...prev,
          currentTetromino: rotatedTetromino,
        };
      }

      // Wall kick
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
          // 🔴 НОВОЕ: Если wall kick успешен и мы в Lock Delay - перезапускаем таймер
          if (isInLockDelayRef.current) {
            console.log('🔄 Wall kick успешен - перезапускаем Lock Delay');
            clearLockDelayTimer();
            startLockDelayTimer();
          }

          return {
            ...prev,
            currentTetromino: wallKickTetromino,
          };
        }
      }

      // 🔴 НОВОЕ: Если поворот не помещается (даже с wall kick) - таймер не перезапускается
      console.log('❌ Поворот не помещается - Lock Delay НЕ перезапускается');

      return prev;
    });
  }, [collisionDetection, startLockDelayTimer, clearLockDelayTimer]);

  // Hold фигуры
  const holdTetromino = useCallback(() => {
    setGameState(prev => {
      if (!prev.canHold || !prev.currentTetromino || prev.isPaused || prev.isGameOver) {
        return prev;
      }

      // 🔴 НОВОЕ: При hold отменяем Lock Delay
      clearLockDelayTimer();

      if (!prev.heldTetromino) {
        const newHeldTetromino = prev.currentTetromino;
        const newNextTetrominos = [...prev.nextTetrominos];
        const newCurrentTetromino = newNextTetrominos.shift() || null;

        if (newNextTetrominos.length < 3) {
          const additionalTetrominos = TetrominoFactory.createMultiple(
            3 - newNextTetrominos.length
          );
          newNextTetrominos.push(...additionalTetrominos);
        }

        if (newCurrentTetromino) {
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
      const newHeldTetromino = prev.currentTetromino;

      return {
        ...prev,
        currentTetromino: newCurrentTetromino,
        heldTetromino: newHeldTetromino,
        canHold: false,
      };
    });
  }, [clearLockDelayTimer]);

  // Hard drop
  const hardDrop = useCallback(() => {
    // 🔴 НОВОЕ: Hard drop отменяет Lock Delay
    clearLockDelayTimer();

    setGameState(prev => {
      if (!prev.currentTetromino || prev.isPaused || prev.isGameOver) {
        return prev;
      }

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

      const newBoard = boardManager.placeTetromino(finalTetromino, prev.board);

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
    });
  }, [boardManager, collisionDetection, config.speedIncreasePerLevel, clearLockDelayTimer]);

  const pause = useCallback(() => {
    clearLockDelayTimer();
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, [clearLockDelayTimer]);

  const resume = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const restart = useCallback(() => {
    clearLockDelayTimer();
    setGameState(createInitialState(config));
  }, [config, clearLockDelayTimer]);

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
    clearLockDelayTimer();
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
  }, [clearLockDelayTimer]);

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

  // 🔴 НОВОЕ: Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (lockDelayTimerRef.current) {
        clearTimeout(lockDelayTimerRef.current);
      }
    };
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
