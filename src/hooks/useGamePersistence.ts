// hooks/useGamePersistence.ts
import { useCallback } from 'react';
import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Tetromino } from '../types/tetromino';

// Ключи для localStorage
const STORAGE_KEYS = {
  GAME_STATE: 'tetris_game_state',
  GAME_CONFIG: 'tetris_game_config',
  HIGH_SCORE: 'tetris_high_score',
  STATS: 'tetris_player_stats'
};

// Интерфейс для сохранённых данных
interface SavedGameState {
  version: string;
  timestamp: number;
  gameState: Omit<GameState, 'currentTetromino' | 'nextTetrominos'> & {
    currentTetromino: Tetromino | null;
    nextTetrominos: Tetromino[];
  };
  config: GameConfig;
}

// Интерфейс для статистики игрока
interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  totalLines: number;
  totalWords: number;
  bestScore: number;
  bestLevel: number;
}

export const useGamePersistence = () => {
  // Сохранение текущего состояния игры
  const saveGame = useCallback((gameState: GameState, config: GameConfig = DEFAULT_GAME_CONFIG): boolean => {
    try {
      const savedState: SavedGameState = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: {
          ...gameState,
        },
        config
      };

      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(savedState));
      console.log('✅ Игра сохранена');
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения игры:', error);
      return false;
    }
  }, []);

  // Загрузка сохранённой игры
  const loadGame = useCallback((): { gameState: GameState; config: GameConfig } | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (!saved) return null;

      const savedData: SavedGameState = JSON.parse(saved);
      
      // Простая проверка версии (можно расширить при необходимости)
      if (savedData.version !== '1.0.0') {
        console.warn('⚠️ Версия сохранения не совпадает, но попробуем загрузить');
        // Можно добавить миграцию данных между версиями
      }

      console.log('✅ Игра загружена');
      return {
        gameState: savedData.gameState,
        config: savedData.config
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки игры:', error);
      return null;
    }
  }, []);

  // Удаление сохранённой игры
  const clearSavedGame = useCallback((): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      console.log('✅ Сохранение игры удалено');
    } catch (error) {
      console.error('❌ Ошибка удаления сохранения:', error);
    }
  }, []);

  // Проверка наличия сохранённой игры
  const hasSavedGame = useCallback((): boolean => {
    return localStorage.getItem(STORAGE_KEYS.GAME_STATE) !== null;
  }, []);

  // Сохранение рекорда
  const saveHighScore = useCallback((score: number): void => {
    try {
      const currentHigh = getHighScore();
      if (score > currentHigh) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
        console.log('🎉 Новый рекорд:', score);
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения рекорда:', error);
    }
  }, []);

  // Получение рекорда
  const getHighScore = useCallback((): number => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.error('❌ Ошибка получения рекорда:', error);
      return 0;
    }
  }, []);

  // Обновление статистики игрока
  const updatePlayerStats = useCallback((gameState: GameState): void => {
    try {
      const currentStats = getPlayerStats();
      
      const updatedStats: PlayerStats = {
        gamesPlayed: currentStats.gamesPlayed + 1,
        totalScore: currentStats.totalScore + gameState.score,
        totalLines: currentStats.totalLines + gameState.linesCleared,
        totalWords: currentStats.totalWords + gameState.wordsFormed,
        bestScore: Math.max(currentStats.bestScore, gameState.score),
        bestLevel: Math.max(currentStats.bestLevel, gameState.level)
      };

      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('❌ Ошибка обновления статистики:', error);
    }
  }, []);

  // Получение статистики игрока
  const getPlayerStats = useCallback((): PlayerStats => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
    }

    // Статистика по умолчанию
    return {
      gamesPlayed: 0,
      totalScore: 0,
      totalLines: 0,
      totalWords: 0,
      bestScore: 0,
      bestLevel: 1
    };
  }, []);

  // Автосохранение при выходе из страницы
  const setupAutoSave = useCallback((gameState: GameState, config: GameConfig) => {
    const handleBeforeUnload = () => {
      if (!gameState.isGameOver) {
        saveGame(gameState, config);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Функция для очистки
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveGame]);

  // Экспорт данных игры (для бэкапа)
  const exportGameData = useCallback((): string => {
    try {
      const gameData = {
        savedGame: localStorage.getItem(STORAGE_KEYS.GAME_STATE),
        highScore: localStorage.getItem(STORAGE_KEYS.HIGH_SCORE),
        stats: localStorage.getItem(STORAGE_KEYS.STATS),
        exportTimestamp: Date.now()
      };
      return JSON.stringify(gameData, null, 2);
    } catch (error) {
      console.error('❌ Ошибка экспорта данных:', error);
      return '';
    }
  }, []);

  // Импорт данных игры (из бэкапа)
  const importGameData = useCallback((data: string): boolean => {
    try {
      const gameData = JSON.parse(data);
      
      if (gameData.savedGame) {
        localStorage.setItem(STORAGE_KEYS.GAME_STATE, gameData.savedGame);
      }
      if (gameData.highScore) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, gameData.highScore);
      }
      if (gameData.stats) {
        localStorage.setItem(STORAGE_KEYS.STATS, gameData.stats);
      }
      
      console.log('✅ Данные игры импортированы');
      return true;
    } catch (error) {
      console.error('❌ Ошибка импорта данных:', error);
      return false;
    }
  }, []);

  // Полная очистка всех данных игры
  const clearAllGameData = useCallback((): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
      localStorage.removeItem(STORAGE_KEYS.STATS);
      console.log('✅ Все данные игры очищены');
    } catch (error) {
      console.error('❌ Ошибка очистки данных:', error);
    }
  }, []);

  return {
    // Основные методы сохранения/загрузки
    saveGame,
    loadGame,
    clearSavedGame,
    hasSavedGame,
    
    // Рекорды и статистика
    saveHighScore,
    getHighScore,
    updatePlayerStats,
    getPlayerStats,
    
    // Автосохранение
    setupAutoSave,
    
    // Импорт/экспорт
    exportGameData,
    importGameData,
    
    // Очистка
    clearAllGameData
  };
};