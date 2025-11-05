import { useRef, useCallback, useEffect } from 'react';
import { GameState } from '../types';

interface GameLoopHook {
  startGameLoop: () => void;
  stopGameLoop: () => void;
  pauseGameLoop: () => void;
  resumeGameLoop: () => void;
  isRunning: boolean;
}

interface GameLoopProps {
  gameState: GameState;
  onGameTick: () => void;
  onLineClear?: (clearedLines: number) => void;
  onLevelUp?: (newLevel: number) => void;
  onGameOver?: () => void;
}

export const useGameLoop = ({
  gameState,
  onGameTick,
  onLineClear,
  onLevelUp,
  onGameOver,
}: GameLoopProps): GameLoopHook => {
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const previousLevelRef = useRef<number>(gameState.level);
  const previousLinesRef = useRef<number>(gameState.lines);

  // Используем refs для колбэков, чтобы иметь доступ к актуальным значениям
  const onGameTickRef = useRef(onGameTick);
  const onLineClearRef = useRef(onLineClear);
  const onLevelUpRef = useRef(onLevelUp);
  const onGameOverRef = useRef(onGameOver);

  // Обновляем refs при изменении колбэков
  useEffect(() => {
    onGameTickRef.current = onGameTick;
  }, [onGameTick]);

  useEffect(() => {
    onLineClearRef.current = onLineClear;
  }, [onLineClear]);

  useEffect(() => {
    onLevelUpRef.current = onLevelUp;
  }, [onLevelUp]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // Основной игровой цикл
  const gameLoop = useCallback((currentTime: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (!gameState.isPaused && !gameState.isGameOver) {
      accumulatedTimeRef.current += deltaTime;

      // Интервал обновления в зависимости от скорости игры
      const updateInterval = gameState.gameSpeed;

      while (accumulatedTimeRef.current >= updateInterval) {
        // Вызываем актуальный колбэк через ref
        onGameTickRef.current?.();
        accumulatedTimeRef.current -= updateInterval;
      }

      // Проверка событий (линии, уровни)
      checkGameEvents();
    }

    if (isRunningRef.current) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.isPaused, gameState.isGameOver, gameState.gameSpeed]);

  // Проверка игровых событий
  const checkGameEvents = useCallback(() => {
    // Проверка изменения уровня
    if (gameState.level !== previousLevelRef.current) {
      previousLevelRef.current = gameState.level;
      onLevelUpRef.current?.(gameState.level);
      playLevelUpSound();
    }

    // Проверка очищенных линий
    const linesCleared = gameState.lines - previousLinesRef.current;
    if (linesCleared > 0) {
      previousLinesRef.current = gameState.lines;
      onLineClearRef.current?.(linesCleared);
      playLineClearSound(linesCleared);
    }

    // Проверка конца игры
    if (gameState.isGameOver) {
      onGameOverRef.current?.();
      playGameOverSound();
      stopGameLoop();
    }
  }, [gameState.level, gameState.lines, gameState.isGameOver]);

  // Запуск игрового цикла
  const startGameLoop = useCallback(() => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    lastTimeRef.current = 0;
    accumulatedTimeRef.current = 0;
    previousLevelRef.current = gameState.level;
    previousLinesRef.current = gameState.lines;

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, gameState.level, gameState.lines]);

  // Остановка игрового цикла
  const stopGameLoop = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
  }, []);

  // Пауза игрового цикла
  const pauseGameLoop = useCallback(() => {
    // Можно добавить паузу для аудио
  }, []);

  // Возобновление игрового цикла
  const resumeGameLoop = useCallback(() => {
    // Можно добавить возобновление аудио
  }, []);

  // Заглушки для звуковых функций
  const playLevelUpSound = useCallback(() => {
    console.log('Level up sound would play here');
  }, []);

  const playLineClearSound = useCallback((lines: number) => {
    console.log(`Line clear sound for ${lines} lines would play here`);
  }, []);

  const playGameOverSound = useCallback(() => {
    console.log('Game over sound would play here');
  }, []);

  // Автоматическое управление циклом при изменении состояния игры
  useEffect(() => {
    if (gameState.isGameOver) {
      stopGameLoop();
    }
  }, [gameState.isGameOver, stopGameLoop]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopGameLoop();
    };
  }, [stopGameLoop]);

  return {
    startGameLoop,
    stopGameLoop,
    pauseGameLoop,
    resumeGameLoop,
    isRunning: isRunningRef.current,
  };
};