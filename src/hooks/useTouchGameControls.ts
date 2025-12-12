// hooks/useTouchGameControls.ts

import { useCallback } from 'react';
import { useSwipeControls } from './useSwipeControls';

interface TouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotate: () => void;
  onHardDrop: () => void;
  onSoftDrop: (speed: number) => void;
}

export const useTouchGameControls = ({
  onMoveLeft,
  onMoveRight,
  onRotate,
  onHardDrop,
  onSoftDrop,
}: TouchControlsProps) => {
  // 🔴 Обработчик для быстрого свайпа вниз
  const handleSwipeDown = useCallback(
    (speed: 'slow' | 'fast' | 'instant') => {
      console.log('🎯 Свайп вниз, скорость:', speed);
      switch (speed) {
        case 'instant':
          onHardDrop();
          break;
        case 'fast':
          // 🔥 Упрощаем для лучшей отзывчивости
          setTimeout(() => onSoftDrop(50), 0);
          setTimeout(() => onSoftDrop(50), 50);
          setTimeout(() => onSoftDrop(50), 100);
          break;
        case 'slow':
          onSoftDrop(300);
          break;
      }
    },
    [onHardDrop, onSoftDrop]
  );

  // 🔴 Обработчик для непрерывного движения влево
  const handleContinuousLeft = useCallback(() => {
    console.log('◀️ Непрерывное движение влево');
    onMoveLeft();
  }, [onMoveLeft]);

  // 🔴 Обработчик для непрерывного движения вправо
  const handleContinuousRight = useCallback(() => {
    console.log('▶️ Непрерывное движение вправо');
    onMoveRight();
  }, [onMoveRight]);

  // 🔴 Обработчик для непрерывного движения вниз
  const handleContinuousDown = useCallback(() => {
    console.log('⬇️ Непрерывное движение вниз');
    onSoftDrop(100);
  }, [onSoftDrop]);

  // 🔴 Обработчик остановки движения
  const handleContinuousEnd = useCallback(() => {
    console.log('🛑 Непрерывное движение остановлено');
  }, []);

  // 🔴 Важное исправление: убедитесь, что onTap передается правильно
  const swipeCallbacks = {
    onSwipeLeft: onMoveLeft,
    onSwipeRight: onMoveRight,
    onSwipeDown: handleSwipeDown,
    onSwipeUp: onRotate, // Свайп вверх = поворот
    onTap: onRotate, // 🔥 Тап = поворот (ВАЖНО!)
    onContinuousLeft: handleContinuousLeft,
    onContinuousRight: handleContinuousRight,
    onContinuousDown: handleContinuousDown,
    onContinuousEnd: handleContinuousEnd,
  };

  const swipeControls = useSwipeControls(swipeCallbacks);

  return {
    ...swipeControls,
  };
};