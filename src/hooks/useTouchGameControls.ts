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
  onSoftDrop
}: TouchControlsProps) => {
  const handleSwipeDown = useCallback((speed: 'slow' | 'fast' | 'instant') => {
    console.log('🎯 Drop speed:', speed);
    switch (speed) {
      case 'instant':
        onHardDrop(); // Мгновенное падение
        break;
      case 'fast':
        // Fast drop - несколько быстрых движений вниз
        for (let i = 0; i < 5; i++) {
          setTimeout(() => onSoftDrop(50), i * 50);
        }
        break;
      case 'slow':
        onSoftDrop(300); // Медленная скорость
        break;
    }
  }, [onHardDrop, onSoftDrop]);

  const swipeCallbacks = {
    onSwipeLeft: onMoveLeft,
    onSwipeRight: onMoveRight,
    onSwipeDown: handleSwipeDown,
    onSwipeUp: onRotate,
    onTap: onRotate,
  };

  const swipeControls = useSwipeControls(swipeCallbacks);

  return {
    ...swipeControls,
  };
};