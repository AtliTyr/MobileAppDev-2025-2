// hooks/useSwipeControls.ts - С ИСПРАВЛЕННОЙ ОБРАБОТКОЙ ТАПОВ

import { useCallback, useRef, useEffect } from 'react';
import { PanResponder, GestureResponderEvent } from 'react-native';

interface SwipeCallbacks {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: (speed: 'slow' | 'fast' | 'instant') => void;
  onSwipeUp: () => void;
  onTap?: () => void;
  onContinuousLeft?: () => void;
  onContinuousRight?: () => void;
  onContinuousDown?: () => void;
  onContinuousEnd?: () => void;
}

export const useSwipeControls = (callbacks: SwipeCallbacks) => {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentTouchPos = useRef<{ x: number; y: number } | null>(null);
  const currentDirectionRef = useRef<'left' | 'right' | 'down' | null>(null);
  const moveIntervalId = useRef<number | null>(null);
  const continuousMovesTimeoutId = useRef<number | null>(null);
  const isInContinuousModeRef = useRef(false);
  const hasProcessedAsSwipeRef = useRef(false);

  // 🔧 ВОССТАНАВЛИВАЕМ ОРИГИНАЛЬНЫЕ НАСТРОЙКИ ДЛЯ ТАПОВ
  const MOVE_THRESHOLD = 15;
  const HOLD_TIME_FOR_CONTINUOUS = 300;
  const CONTINUOUS_MOVE_INTERVAL = 80;

  const startContinuousMove = useCallback(
    (direction: 'left' | 'right' | 'down') => {
      if (moveIntervalId.current) {
        clearInterval(moveIntervalId.current);
        moveIntervalId.current = null;
      }

      currentDirectionRef.current = direction;
      isInContinuousModeRef.current = true;
      console.log(`🔁 Continuous mode: ${direction}`);

      if (direction === 'left' && callbacks.onContinuousLeft) {
        callbacks.onContinuousLeft();
      } else if (direction === 'right' && callbacks.onContinuousRight) {
        callbacks.onContinuousRight();
      } else if (direction === 'down' && callbacks.onContinuousDown) {
        callbacks.onContinuousDown();
      }

      moveIntervalId.current = setInterval(() => {
        if (direction === 'left' && callbacks.onContinuousLeft) {
          callbacks.onContinuousLeft();
        } else if (direction === 'right' && callbacks.onContinuousRight) {
          callbacks.onContinuousRight();
        } else if (direction === 'down' && callbacks.onContinuousDown) {
          callbacks.onContinuousDown();
        }
      }, CONTINUOUS_MOVE_INTERVAL) as unknown as number;
    },
    [callbacks]
  );

  const stopContinuousMove = useCallback(() => {
    if (moveIntervalId.current) {
      console.log(`🛑 Stopping continuous move`);
      clearInterval(moveIntervalId.current);
      moveIntervalId.current = null;
      isInContinuousModeRef.current = false;
      currentDirectionRef.current = null;

      if (callbacks.onContinuousEnd) {
        callbacks.onContinuousEnd();
      }
    }
  }, [callbacks]);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    const { pageX: x, pageY: y } = event.nativeEvent;
    touchStart.current = { x, y, time: Date.now() };
    currentTouchPos.current = { x, y };
    isInContinuousModeRef.current = false;
    hasProcessedAsSwipeRef.current = false;

    console.log('🟢 Touch START at:', x, y);

    if (continuousMovesTimeoutId.current) {
      clearTimeout(continuousMovesTimeoutId.current);
    }

    continuousMovesTimeoutId.current = setTimeout(() => {
      if (!hasProcessedAsSwipeRef.current && touchStart.current) {
        console.log('⏱️ Удержание 300ms - переходим в режим CONTINUOUS');
        isInContinuousModeRef.current = true;
      }
    }, HOLD_TIME_FOR_CONTINUOUS) as unknown as number;
  }, [HOLD_TIME_FOR_CONTINUOUS]);

  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!touchStart.current) return;

      const { pageX: currentX, pageY: currentY } = event.nativeEvent;
      const deltaX = currentX - touchStart.current.x;
      const deltaY = currentY - touchStart.current.y;
      const currentTime = Date.now();
      const duration = currentTime - touchStart.current.time;

      // 🔥 КРИТИЧНО: Если уже прошло 300ms И есть движение - переходим в continuous
      if (duration >= HOLD_TIME_FOR_CONTINUOUS && !isInContinuousModeRef.current) {
        console.log('⏱️ Время истекло + движение = CONTINUOUS MODE');
        isInContinuousModeRef.current = true;
      }

      // Если мы уже в continuous режиме - используем коллбэки для continuous
      if (isInContinuousModeRef.current) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (Math.abs(deltaX) > MOVE_THRESHOLD) {
            const newDirection = deltaX > 0 ? 'right' : 'left';
            if (currentDirectionRef.current !== newDirection) {
              stopContinuousMove();
              startContinuousMove(newDirection);
            }
          }
        } else {
          if (Math.abs(deltaY) > MOVE_THRESHOLD) {
            if (currentDirectionRef.current !== 'down') {
              stopContinuousMove();
              startContinuousMove('down');
            }
          }
        }
      }

      currentTouchPos.current = { x: currentX, y: currentY };
    },
    [startContinuousMove, stopContinuousMove]
  );

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      // Очищаем таймер удержания
      if (continuousMovesTimeoutId.current) {
        clearTimeout(continuousMovesTimeoutId.current);
        continuousMovesTimeoutId.current = null;
      }

      // Останавливаем continuous движение если оно было
      stopContinuousMove();

      if (!touchStart.current) {
        console.log('❌ No touch start data');
        return;
      }

      // 🔥 КРИТИЧНО: Если мы в continuous режиме - не обрабатываем как свайп
      if (isInContinuousModeRef.current) {
        console.log('✋ Были в CONTINUOUS режиме - игнорируем свайп');
        touchStart.current = null;
        currentTouchPos.current = null;
        return;
      }

      const { pageX: endX, pageY: endY } = event.nativeEvent;
      const { x: startX, y: startY, time: startTime } = touchStart.current;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const duration = endTime - startTime;

      console.log(
        `📍 Свайп: deltaX=${deltaX.toFixed(1)}, deltaY=${deltaY.toFixed(
          1
        )}, duration=${duration}ms`
      );

      hasProcessedAsSwipeRef.current = true;

      // 🔥 ВАЖНОЕ ИСПРАВЛЕНИЕ: Возвращаем оригинальную логику определения тапа
      // Эта логика была в вашем оригинальном коде и она работала правильно
      const TAP_DISTANCE_THRESHOLD = 10; // Пикселей
      const TAP_TIME_THRESHOLD = 150; // Миллисекунд
      
      if (
        Math.abs(deltaX) < TAP_DISTANCE_THRESHOLD &&
        Math.abs(deltaY) < TAP_DISTANCE_THRESHOLD &&
        duration < TAP_TIME_THRESHOLD
      ) {
        console.log('👆 TAP detected - duration:', duration, 'ms, distance:', Math.sqrt(deltaX*deltaX + deltaY*deltaY).toFixed(1), 'px');
        if (callbacks.onTap) {
          callbacks.onTap();
        }
        touchStart.current = null;
        currentTouchPos.current = null;
        return;
      }

      // 🔥 ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Если был очень короткий тап, но с небольшим движением
      // (защита от случайных микродвижений при тапе)
      const MAX_TAP_WITH_MOVEMENT = 15; // Максимальное движение для тапа
      const MAX_TAP_TIME_WITH_MOVEMENT = 200; // Максимальное время для тапа с движением
      
      if (
        Math.abs(deltaX) < MAX_TAP_WITH_MOVEMENT &&
        Math.abs(deltaY) < MAX_TAP_WITH_MOVEMENT &&
        duration < MAX_TAP_TIME_WITH_MOVEMENT &&
        (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) // Но движение должно быть заметным
      ) {
        console.log('👆 TAP with small movement detected');
        if (callbacks.onTap) {
          callbacks.onTap();
        }
        touchStart.current = null;
        currentTouchPos.current = null;
        return;
      }

      const minSwipe = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Горизонтальный свайп
        if (Math.abs(deltaX) > minSwipe) {
          if (deltaX > 0) {
            console.log('➡️ Свайп RIGHT');
            callbacks.onSwipeRight();
          } else {
            console.log('⬅️ Свайп LEFT');
            callbacks.onSwipeLeft();
          }
        }
      } else {
        // Вертикальный свайп
        if (Math.abs(deltaY) > minSwipe) {
          if (deltaY > 0) {
            // Hard drop логика
            let speed: 'slow' | 'fast' | 'instant' = 'slow';
            const velocity = Math.abs(deltaY) / duration;

            console.log(
              `⬇️ Свайп DOWN: velocity=${velocity.toFixed(
                2
              )}, deltaY=${deltaY.toFixed(1)}`
            );

            if (Math.abs(deltaY) > 120 && velocity > 1.5) {
              speed = 'instant';
              console.log('💥 HARD DROP');
            } else if (Math.abs(deltaY) > 80 && velocity > 1.0) {
              speed = 'fast';
              console.log('⚡ FAST DROP');
            } else {
              console.log('🐢 SOFT DROP');
            }

            callbacks.onSwipeDown(speed);
          } else {
            console.log('⬆️ Свайп UP');
            callbacks.onSwipeUp();
          }
        }
      }

      touchStart.current = null;
      currentTouchPos.current = null;
    },
    [callbacks, stopContinuousMove]
  );

  useEffect(() => {
    return () => {
      if (moveIntervalId.current) {
        clearInterval(moveIntervalId.current);
      }
      if (continuousMovesTimeoutId.current) {
        clearTimeout(continuousMovesTimeoutId.current);
      }
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouchStart,
      onPanResponderMove: handleTouchMove,
      onPanResponderRelease: handleTouchEnd,
      onPanResponderTerminate: handleTouchEnd,
    })
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
    forceStopContinuous: () => {
      console.log('🛑 Forced stop continuous mode');
      stopContinuousMove();
      if (continuousMovesTimeoutId.current) {
        clearTimeout(continuousMovesTimeoutId.current);
        continuousMovesTimeoutId.current = null;
      }
    },
  };
};