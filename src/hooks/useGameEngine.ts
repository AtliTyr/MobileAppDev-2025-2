/**
 * 🎮 useGameEngine.ts - Главный координатор игровых систем
 * 
 * Этот хук объединяет все игровые механики:
 * - Физика падения фигур
 * - Проверка коллизий
 * - Очистка линий
 * - Система очков и уровней
 * - Обработка game over
 * 
 * Это "сердце" игры - здесь происходит вся логика игрового процесса
 */

import { useCallback, useRef, useEffect } from 'react';
import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Tetromino } from '../types/tetromino';
import { useGameState } from './useGameState';
import { useBoardManager } from './useBoardManager';
import { useCollisionDetection } from './useCollisionDetection';
import { TetrominoFactory, TetrominoUtils } from '../utils/tetrominoFactory';
import { GameEventManager, createGameEvent } from '../types/gameEvents';

// ========================================
// 📊 ТИПЫ И ИНТЕРФЕЙСЫ
// ========================================

export interface GameEngineReturn {
  gameState: GameState;
  actions: {
    moveTetromino: (dx: number, dy: number) => boolean;
    rotateTetromino: () => boolean;
    softDrop: () => void;
    hardDrop: () => void;
    holdTetromino: () => void;
    pause: () => void;
    resume: () => void;
    restart: () => void;
  };
  eventManager: GameEventManager;
}

// ========================================
// 🎮 ГЛАВНЫЙ ХУК ИГРОВОГО ДВИГАТЕЛЯ
// ========================================

export const useGameEngine = (
  config: GameConfig = DEFAULT_GAME_CONFIG,
  initialGameState?: GameState
): GameEngineReturn => {
  // ========================================
  // 🪝 ИНИЦИАЛИЗАЦИЯ ПОДСИСТЕМ
  // ========================================

  const { gameState, actions: gameStateActions } = useGameState(config, initialGameState);
  const boardManager = useBoardManager();
  const collisionDetector = useCollisionDetection();
  const eventManagerRef = useRef(new GameEventManager());

  // ========================================
  // 📦 СОСТОЯНИЕ ДВИГАТЕЛЯ
  // ========================================

  /**
   * isProcessingTick - флаг что мы обрабатываем текущий tick
   * Предотвращает конкурентные операции
   */
  const isProcessingTickRef = useRef(false);

  /**
   * dropAccumulator - накопитель для отслеживания "мягкого падения"
   * Используется для более плавного падения фигур
   */
  const dropAccumulatorRef = useRef(0);

  // ========================================
  // 🎯 ДЕЙСТВИЯ С ФИГУРАМИ
  // ========================================

  /**
   * Попытка переместить текущую фигуру на dx клеток горизонтально
   * @param dx - перемещение по оси X (-1 = влево, 1 = вправо)
   * @returns true если успешно, false если коллизия
   */
  const moveTetromino = useCallback((dx: number, dy: number = 0): boolean => {
    if (!gameState.currentTetromino || gameState.isPaused || gameState.isGameOver) {
      return false;
    }

    const newTetromino = TetrominoUtils.move(gameState.currentTetromino, dx, dy);

    // Проверяем коллизию с новой позицией
    if (!collisionDetector.checkCollision(newTetromino, gameState.board)) {
      gameStateActions.setCurrentTetromino(newTetromino);
      eventManagerRef.current.emit(createGameEvent.tetrominoMoved());
      return true;
    }

    return false;
  }, [gameState.currentTetromino, gameState.board, gameState.isPaused, gameState.isGameOver]);

  /**
   * Попытка повернуть текущую фигуру на 90 градусов
   * @returns true если успешно, false если коллизия
   */
  const rotateTetromino = useCallback((): boolean => {
    if (!gameState.currentTetromino || gameState.isPaused || gameState.isGameOver) {
      return false;
    }

    const rotatedTetromino = TetrominoUtils.rotate(gameState.currentTetromino);

    // Проверяем коллизию в новой ориентации
    if (!collisionDetector.checkCollision(rotatedTetromino, gameState.board)) {
      gameStateActions.setCurrentTetromino(rotatedTetromino);
      eventManagerRef.current.emit(createGameEvent.tetrominoRotated());
      return true;
    }

    // Система "wall kick" - пытаемся сдвинуть влево/вправо если вращение не проходит
    const wallKickOffsets = [-1, 1, -2, 2];
    for (const offset of wallKickOffsets) {
      const adjustedTetromino = TetrominoUtils.move(rotatedTetromino, offset, 0);
      if (!collisionDetector.checkCollision(adjustedTetromino, gameState.board)) {
        gameStateActions.setCurrentTetromino(adjustedTetromino);
        eventManagerRef.current.emit(createGameEvent.tetrominoRotated());
        return true;
      }
    }

    return false;
  }, [gameState.currentTetromino, gameState.board, gameState.isPaused, gameState.isGameOver]);

  /**
   * Мягкое падение - ускоренное падение фигуры при свайпе вниз
   * Фигура падает быстрее но не мгновенно
   */
  const softDrop = useCallback((): void => {
    if (!gameState.currentTetromino || gameState.isPaused || gameState.isGameOver) {
      return;
    }

    // Пытаемся переместить вниз на 3 клетки быстро
    for (let i = 0; i < 3; i++) {
      if (!moveTetromino(0, 1)) {
        break; // Если коллизия, останавливаемся
      }
    }

    eventManagerRef.current.emit(createGameEvent.softDrop());
  }, [gameState.currentTetromino, gameState.isPaused, gameState.isGameOver, moveTetromino]);

  /**
   * Мгновенное падение - фигура падает на дно за один раз
   */
  const hardDrop = useCallback((): void => {
    if (!gameState.currentTetromino || gameState.isPaused || gameState.isGameOver) {
      return;
    }

    // Ищем самую нижнюю позицию где фигура не коллидирует
    let droppedTetromino = gameState.currentTetromino;
    let dropDistance = 0;

    while (!collisionDetector.checkCollision(
      TetrominoUtils.move(droppedTetromino, 0, 1),
      gameState.board
    )) {
      droppedTetromino = TetrominoUtils.move(droppedTetromino, 0, 1);
      dropDistance++;
    }

    if (dropDistance > 0) {
      gameStateActions.setCurrentTetromino(droppedTetromino);
      // Добавляем бонус очков за hard drop (2 очка за клетку)
      gameStateActions.addScore(dropDistance * 2);
      eventManagerRef.current.emit(createGameEvent.hardDrop());
    }

    // Сразу же приземляем фигуру
    landTetromino();
  }, [gameState.currentTetromino, gameState.board, gameState.isPaused, gameState.isGameOver]);

  /**
   * Удержать текущую фигуру в "кармане" и вытащить хранимую
   */
  const holdTetromino = useCallback((): void => {
    gameStateActions.holdTetromino();
  }, []);

  // ========================================
  // 🎯 ЦЕНТРАЛЬНАЯ ЛОГИКА ИГРЫ
  // ========================================

  /**
   * Приземление фигуры на доску
   * Это момент когда фигура становится частью статичного поля
   */
  const landTetromino = useCallback((): void => {
    if (!gameState.currentTetromino) return;

    console.log('🎯 Tetromino landing...');

    // 1️⃣ ПОМЕЩАЕМ ФИГУРУ НА ДОСКУ
    const newBoard = boardManager.placeTetromino(gameState.currentTetromino, gameState.board);
    gameStateActions.setBoard(newBoard);

    // Издаём событие приземления
    eventManagerRef.current.emit(createGameEvent.tetrominoLanded());

    // 2️⃣ ПРОВЕРЯЕМ ПОЛНЫЕ ЛИНИИ И ОЧИЩАЕМ ИХ
    processLineClears(newBoard);

    // 3️⃣ СПАВНИМ НОВУЮ ФИГУРУ
    spawnNewTetromino();
  }, [gameState.currentTetromino, gameState.board]);

  /**
   * Обработка очистки полных линий
   * Это включает: поиск, удаление, начисление очков
   */
  const processLineClears = useCallback((board: GameState['board']): void => {
    const { newBoard, linesCleared } = boardManager.clearCompletedLines(board);

    if (linesCleared > 0) {
      console.log(`✨ Lines cleared: ${linesCleared}`);

      // Обновляем доску
      gameStateActions.setBoard(newBoard);
      gameStateActions.addLines(linesCleared);

      // Вычисляем очки за очистку линий
      const score = boardManager.calculateLineClearScore(linesCleared, gameState.level);
      gameStateActions.addScore(score);

      // Издаём событие очистки линий
      eventManagerRef.current.emit(createGameEvent.linesCleared(
        linesCleared,
        score,
        gameState.level
      ));

      // Проверяем нужно ли повышать уровень
      checkLevelUp();
    }
  }, [gameState.level, gameState.linesCleared]);

  /**
   * Проверка и повышение уровня если нужно
   * Уровень повышается каждые 10 очищенных линий
   */
  const checkLevelUp = useCallback((): void => {
    const linesForLevelUp = 10;
    const currentLevel = gameState.level;
    const newLevel = 1 + Math.floor(gameState.linesCleared / linesForLevelUp);

    if (newLevel > currentLevel) {
      console.log(`🆙 LEVEL UP! ${currentLevel} → ${newLevel}`);
      gameStateActions.levelUp();
      eventManagerRef.current.emit(createGameEvent.levelUp(newLevel));
    }
  }, [gameState.level, gameState.linesCleared]);

  /**
   * Спавнит новую фигуру в верхней части доски
   * Проверяет game over если не может спавнить
   */
  const spawnNewTetromino = useCallback((): void => {
    gameStateActions.spawnNew();

    // После спавна получаем новую фигуру
    const newCurrentTetromino = gameState.nextTetrominos[0] || TetrominoFactory.createRandom();

    // Проверяем может ли новая фигура появиться (не коллидирует ли сразу)
    if (boardManager.checkGameOver(newCurrentTetromino, gameState.board)) {
      console.log('💀 GAME OVER!');
      gameStateActions.setGameOver(true);
      eventManagerRef.current.emit(createGameEvent.gameOver());
    } else {
      eventManagerRef.current.emit(createGameEvent.tetrominoSpawned());
    }
  }, [gameState.board, gameState.nextTetrominos]);

  // ========================================
  // ⏱️ ИГРОВОЙ ЦИКЛ
  // ========================================

  /**
   * Основной тик игрового цикла
   * Вызывается каждый gameSpeed миллисекунд
   */
  const onGameTick = useCallback((): void => {
    // Предотвращаем конкурентные обработки
    if (isProcessingTickRef.current || gameState.isPaused || gameState.isGameOver) {
      return;
    }

    isProcessingTickRef.current = true;

    try {
      if (!gameState.currentTetromino) {
        spawnNewTetromino();
        isProcessingTickRef.current = false;
        return;
      }

      // Пытаемся переместить фигуру вниз
      const moved = moveTetromino(0, 1);

      if (!moved) {
        // Фигура не может дальше падать - приземляем её
        landTetromino();
      }
    } catch (error) {
      console.error('❌ Error in game tick:', error);
    } finally {
      isProcessingTickRef.current = false;
    }
  }, [gameState.currentTetromino, gameState.isPaused, gameState.isGameOver]);

  // Используем useGameLoop из gameState для основного цикла
  // Он будет вызывать onGameTick каждый gameSpeed миллисекунд

  // ========================================
  // 🎛️ УПРАВЛЕНИЕ ПАУЗОЙ
  // ========================================

  const pause = useCallback((): void => {
    if (!gameState.isGameOver) {
      gameStateActions.pause();
      eventManagerRef.current.emit(createGameEvent.gamePaused());
    }
  }, [gameState.isGameOver]);

  const resume = useCallback((): void => {
    if (gameState.isPaused && !gameState.isGameOver) {
      gameStateActions.resume();
      eventManagerRef.current.emit(createGameEvent.gameResumed());
    }
  }, [gameState.isPaused, gameState.isGameOver]);

  const restart = useCallback((): void => {
    gameStateActions.restart();
    eventManagerRef.current.clear();
    eventManagerRef.current = new GameEventManager();
    console.log('🔄 Game restarted');
  }, []);

  // ========================================
  // 🪝 ИНТЕГРАЦИЯ С USEgameloop
  // ========================================

  /**
   * Переопределяем onTick из useGameLoop для своей логики
   * Это происходит внутри useGameState через useGameLoop
   */
  useEffect(() => {
    // Перехватываем основной цикл
    // Поскольку useGameLoop уже используется в useGameState,
    // нам нужно создать свой механизм для обработки ticks

    const tickInterval = setInterval(() => {
      onGameTick();
    }, gameState.gameSpeed);

    return () => clearInterval(tickInterval);
  }, [gameState.gameSpeed, onGameTick]);

  // ========================================
  // 📊 ВОЗВРАЩАЕМОЕ ЗНАЧЕНИЕ
  // ========================================

  return {
    gameState,
    actions: {
      moveTetromino: (dx: number, dy: number) => moveTetromino(dx, dy),
      rotateTetromino,
      softDrop,
      hardDrop,
      holdTetromino,
      pause,
      resume,
      restart,
    },
    eventManager: eventManagerRef.current,
  };
};
