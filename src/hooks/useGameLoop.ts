// hooks/useGameLoop.ts

import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '../types/game';

interface GameLoopProps {
  gameState: GameState;
  onTick: () => void;
}

export const useGameLoop = ({ gameState, onTick }: GameLoopProps) => {
  const lastTickTime = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const isRunningRef = useRef(true);

  const onTickRef = useRef(onTick);
  const isPausedRef = useRef(gameState.isPaused);
  const isGameOverRef = useRef(gameState.isGameOver);
  const gameSpeedRef = useRef(gameState.gameSpeed);

  // Обновляем ref'ы при изменении пропсов
  useEffect(() => {
    onTickRef.current = onTick;
    isPausedRef.current = gameState.isPaused;
    isGameOverRef.current = gameState.isGameOver;
    gameSpeedRef.current = gameState.gameSpeed;
  }, [onTick, gameState.isPaused, gameState.isGameOver, gameState.gameSpeed]);

  // Основной игровой цикл
  const gameLoop = useCallback((currentTime: number) => {
    if (!isRunningRef.current) {
      console.log('🛑 Game loop остановлен');
      return;
    }

    if (!isPausedRef.current && !isGameOverRef.current) {
      const deltaTime = currentTime - lastTickTime.current;
      if (deltaTime > gameSpeedRef.current) {
        onTickRef.current();
        lastTickTime.current = currentTime;
      }
    }

    if (isRunningRef.current) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
  }, []);

  // Запуск и остановка игрового цикла
  useEffect(() => {
    console.log('▶️ useGameLoop монтируется, запускаем цикл');
    isRunningRef.current = true;
    lastTickTime.current = performance.now();
    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      console.log('⏹️ useGameLoop размонтируется, ОСТАНАВЛИВАЕМ цикл');
      isRunningRef.current = false;
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [gameLoop]);

  return {};
};