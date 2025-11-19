// hooks/useAcceleratedDrop.ts
import { useCallback, useRef, useEffect } from 'react';

interface DropConfig {
  slowSpeed: number; // Базовая скорость (мс)
  fastSpeed: number; // Ускоренная скорость (мс)
  instantDrop: boolean; // Мгновенное падение
}

export const useAcceleratedDrop = () => {
  const dropConfig = useRef<DropConfig>({
    slowSpeed: 1000,
    fastSpeed: 100,
    instantDrop: false
  });

  const activeDropMode = useRef<'normal' | 'fast' | 'instant'>('normal');
  const dropTimeout = useRef<NodeJS.Timeout | null>(null);

  // Установка режима падения на основе свайпа
  const setDropSpeed = useCallback((speed: 'slow' | 'fast' | 'instant') => {
    switch (speed) {
      case 'instant':
        activeDropMode.current = 'instant';
        dropConfig.current.instantDrop = true;
        break;
      case 'fast':
        activeDropMode.current = 'fast';
        dropConfig.current.instantDrop = false;
        break;
      case 'slow':
      default:
        activeDropMode.current = 'normal';
        dropConfig.current.instantDrop = false;
        break;
    }
  }, []);

  // Сброс к нормальной скорости
  const resetDropSpeed = useCallback(() => {
    activeDropMode.current = 'normal';
    dropConfig.current.instantDrop = false;
  }, []);

  // Получение текущей скорости падения
  const getDropSpeed = useCallback((): number => {
    switch (activeDropMode.current) {
      case 'instant':
        return 0; // Мгновенное падение
      case 'fast':
        return dropConfig.current.fastSpeed;
      case 'normal':
      default:
        return dropConfig.current.slowSpeed;
    }
  }, []);

  // Проверка, активно ли мгновенное падение
  const isInstantDrop = useCallback((): boolean => {
    return activeDropMode.current === 'instant';
  }, []);

  // Настройка скоростей
  const configureSpeeds = useCallback((slow: number, fast: number) => {
    dropConfig.current.slowSpeed = slow;
    dropConfig.current.fastSpeed = fast;
  }, []);

  // Автоматический сброс ускорения через время
  useEffect(() => {
    if (activeDropMode.current === 'fast') {
      if (dropTimeout.current) {
        clearTimeout(dropTimeout.current);
      }
      
      dropTimeout.current = setTimeout(() => {
        resetDropSpeed();
      }, 2000); // Сбрасываем через 2 секунды
    }

    return () => {
      if (dropTimeout.current) {
        clearTimeout(dropTimeout.current);
      }
    };
  }, [activeDropMode.current, resetDropSpeed]);

  return {
    setDropSpeed,
    resetDropSpeed,
    getDropSpeed,
    isInstantDrop,
    configureSpeeds,
    getCurrentMode: () => activeDropMode.current
  };
};