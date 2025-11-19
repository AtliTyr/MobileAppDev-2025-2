// hooks/useGameLoop.ts
import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '../types/game';

interface GameLoopProps {
  gameState: GameState;
  onTick: () => void;
}

export const useGameLoop = ({
  gameState,
  onTick
}: GameLoopProps) => {
  const lastTickTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  
  // Используем useRef для колбэков, чтобы они не менялись при перерендере
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
    if (!isPausedRef.current && !isGameOverRef.current) {
      const deltaTime = currentTime - lastTickTime.current;
      
      if (deltaTime > gameSpeedRef.current) {
        onTickRef.current();
        lastTickTime.current = currentTime;
      }
    }
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, []); // Пустой массив зависимостей - функция создается один раз

  // Запуск и остановка игрового цикла
  useEffect(() => {
    lastTickTime.current = performance.now();
    animationFrameId.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop]); // Только gameLoop в зависимостях

  return {};
};