// hooks/useSwipeControls.ts
import { useCallback, useRef } from 'react';
import { PanResponder, GestureResponderEvent } from 'react-native';

interface SwipeCallbacks {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: (speed: 'slow' | 'fast' | 'instant') => void;
  onSwipeUp: () => void;
  onTap?: () => void;
}

export const useSwipeControls = (callbacks: SwipeCallbacks) => {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    const { pageX: x, pageY: y } = event.nativeEvent;
    touchStart.current = { x, y, time: Date.now() };
    console.log('🟢 Touch START at:', x, y);
  }, []);

  const handleTouchMove = useCallback((event: GestureResponderEvent) => {
    // Можно добавить логику для drag, если нужно
  }, []);

  const handleTouchEnd = useCallback((event: GestureResponderEvent) => {
    if (!touchStart.current) {
      console.log('❌ No touch start data');
      return;
    }

    const { pageX: endX, pageY: endY } = event.nativeEvent;
    const { x: startX, y: startY, time: startTime } = touchStart.current;
    const endTime = Date.now();

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const duration = endTime - startTime;
    
    console.log(`📍 Swipe: deltaX=${deltaX.toFixed(1)}, deltaY=${deltaY.toFixed(1)}, duration=${duration}ms`);

    const minSwipe = 30; // минимальное расстояние для свайпа
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Горизонтальный свайп
      if (Math.abs(deltaX) > minSwipe) {
        if (deltaX > 0) {
          console.log('➡️ Swipe RIGHT');
          callbacks.onSwipeRight();
        } else {
          console.log('⬅️ Swipe LEFT');
          callbacks.onSwipeLeft();
        }
      }
    } else {
      // Вертикальный свайп
      if (Math.abs(deltaY) > minSwipe) {
        if (deltaY > 0) {
          // Свайп вниз - определяем скорость
          let speed: 'slow' | 'fast' | 'instant' = 'slow';
          const velocity = Math.abs(deltaY) / duration;
          
          console.log('⬇️ Swipe DOWN, velocity:', velocity.toFixed(2));
          
          if (Math.abs(deltaY) > 150 && velocity > 2.0) {
            speed = 'instant';
          } else if (Math.abs(deltaY) > 80 && velocity > 1.0) {
            speed = 'fast';
          }
          
          callbacks.onSwipeDown(speed);
        } else {
          console.log('⬆️ Swipe UP');
          callbacks.onSwipeUp();
        }
      } else {
        // Тап
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && duration < 200 && callbacks.onTap) {
          console.log('👆 Tap');
          callbacks.onTap();
        }
      }
    }

    touchStart.current = null;
  }, [callbacks]);

  // Создаём PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false, // Только тапы, не драги
      onPanResponderGrant: handleTouchStart,
      onPanResponderMove: handleTouchMove,
      onPanResponderRelease: handleTouchEnd,
      onPanResponderTerminate: handleTouchEnd,
    })
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
  };
};