/**
 * 📡 gameEvents.ts - Система событий игры
 * 
 * Определяет все события которые происходят в игре
 * Используется для коммуникации между компонентами
 * без прямого связывания зависимостей
 */

// ========================================
// 🎯 ТИПЫ СОБЫТИЙ
// ========================================

/**
 * GameEventType - все возможные события в игре
 */
export type GameEventType = 
  | 'tetromino-landed'      // Фигура приземлилась
  | 'lines-cleared'         // Линии очищены
  | 'tetromino-spawned'     // Новая фигура спавнена
  | 'tetromino-rotated'     // Фигура повернута
  | 'tetromino-moved'       // Фигура переместилась
  | 'level-up'              // Повышение уровня
  | 'game-over'             // Конец игры
  | 'score-changed'         // Изменение очков
  | 'soft-drop'             // Мягкое падение
  | 'hard-drop'             // Мгновенное падение
  | 'game-resumed'          // Игра возобновлена
  | 'game-paused';          // Игра поставлена на паузу

/**
 * GameEvent - структура события
 */
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  payload?: {
    linesCleared?: number;
    score?: number;
    level?: number;
    multiplier?: number;
    [key: string]: any;
  };
}

/**
 * EventListener - функция-слушатель события
 */
export type EventListener = (event: GameEvent) => void;

// ========================================
// 📦 МЕНЕДЖЕР СОБЫТИЙ
// ========================================

/**
 * GameEventManager - простая система pub/sub для событий игры
 * 
 * Используется для слабого связывания компонентов
 */
export class GameEventManager {
  private listeners: Map<GameEventType, EventListener[]> = new Map();

  /**
   * Подписаться на событие
   * @param eventType - тип события
   * @param listener - функция-обработчик
   * @returns функция отписания
   */
  on(eventType: GameEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener);

    // Возвращаем функцию отписания
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(listener);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Подписаться на событие только один раз
   * @param eventType - тип события
   * @param listener - функция-обработчик
   */
  once(eventType: GameEventType, listener: EventListener): void {
    const wrapper: EventListener = (event) => {
      listener(event);
      unsubscribe();
    };

    const unsubscribe = this.on(eventType, wrapper);
  }

  /**
   * Издать событие
   * @param event - объект события
   */
  emit(event: GameEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Отписаться от всех событий типа
   * @param eventType - тип события
   */
  off(eventType: GameEventType): void {
    this.listeners.delete(eventType);
  }

  /**
   * Очистить все слушатели
   */
  clear(): void {
    this.listeners.clear();
  }
}

// ========================================
// 🏭 ФАБРИКА СОБЫТИЙ
// ========================================

/**
 * Создатель событий для удобства
 */
export const createGameEvent = {
  tetrominoLanded: (linesCleared: number = 0): GameEvent => ({
    type: 'tetromino-landed',
    timestamp: Date.now(),
    payload: { linesCleared },
  }),

  linesCleared: (count: number, score: number, multiplier: number = 1): GameEvent => ({
    type: 'lines-cleared',
    timestamp: Date.now(),
    payload: { linesCleared: count, score, multiplier },
  }),

  tetrominoSpawned: (): GameEvent => ({
    type: 'tetromino-spawned',
    timestamp: Date.now(),
  }),

  tetrominoRotated: (): GameEvent => ({
    type: 'tetromino-rotated',
    timestamp: Date.now(),
  }),

  tetrominoMoved: (): GameEvent => ({
    type: 'tetromino-moved',
    timestamp: Date.now(),
  }),

  levelUp: (level: number): GameEvent => ({
    type: 'level-up',
    timestamp: Date.now(),
    payload: { level },
  }),

  gameOver: (): GameEvent => ({
    type: 'game-over',
    timestamp: Date.now(),
  }),

  scoreChanged: (score: number): GameEvent => ({
    type: 'score-changed',
    timestamp: Date.now(),
    payload: { score },
  }),

  softDrop: (): GameEvent => ({
    type: 'soft-drop',
    timestamp: Date.now(),
  }),

  hardDrop: (): GameEvent => ({
    type: 'hard-drop',
    timestamp: Date.now(),
  }),

  gameResumed: (): GameEvent => ({
    type: 'game-resumed',
    timestamp: Date.now(),
  }),

  gamePaused: (): GameEvent => ({
    type: 'game-paused',
    timestamp: Date.now(),
  }),
};
