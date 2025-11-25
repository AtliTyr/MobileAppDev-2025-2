// hooks/useGamePersistence.ts

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Tetromino } from '../types/tetromino';

// Ключи для AsyncStorage
const STORAGE_KEYS = {
  GAME_STATE: 'tetris_game_state',
  GAME_CONFIG: 'tetris_game_config',
  HIGH_SCORE: 'tetris_high_score',
  STATS: 'tetris_player_stats',
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
  const saveGame = useCallback(
    async (gameState: GameState, config: GameConfig = DEFAULT_GAME_CONFIG): Promise<boolean> => {
      try {
        const saved: SavedGameState = {
          version: '1.0',
          timestamp: Date.now(),
          gameState,
          config,
        };

        await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(saved));
        console.log('Game saved successfully');
        return true;
      } catch (error) {
        console.error('Error saving game:', error);
        return false;
      }
    },
    []
  );

  // Загрузка состояния игры
  const loadGame = useCallback(
    async (): Promise<{ gameState: GameState; config: GameConfig } | null> => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATE);
        if (!saved) {
          console.log('No saved game found');
          return null;
        }

        const data: SavedGameState = JSON.parse(saved);
        console.log('Game loaded successfully');
        return {
          gameState: data.gameState,
          config: data.config,
        };
      } catch (error) {
        console.error('Error loading game:', error);
        return null;
      }
    },
    []
  );

  // Проверка наличия сохранённой игры
  const hasSavedGame = useCallback(async (): Promise<boolean> => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATE);
      return saved !== null;
    } catch (error) {
      console.error('Error checking saved game:', error);
      return false;
    }
  }, []);

  // Очистка сохранённой игры
  const clearSavedGame = useCallback(async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      console.log('Saved game cleared');
      return true;
    } catch (error) {
      console.error('Error clearing saved game:', error);
      return false;
    }
  }, []);

  // Сохранение лучшего счёта
  const saveHighScore = useCallback(
    async (score: number, level: number): Promise<boolean> => {
      try {
        const currentHigh = await AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
        const highScore = currentHigh ? parseInt(currentHigh) : 0;

        if (score > highScore) {
          await AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
          console.log('New high score saved:', score);
        }

        return true;
      } catch (error) {
        console.error('Error saving high score:', error);
        return false;
      }
    },
    []
  );

  // Получение лучшего счёта
  const getHighScore = useCallback(async (): Promise<number> => {
    try {
      const score = await AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      return score ? parseInt(score) : 0;
    } catch (error) {
      console.error('Error getting high score:', error);
      return 0;
    }
  }, []);

  // Сохранение статистики
  const saveStats = useCallback(
    async (stats: PlayerStats): Promise<boolean> => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
        console.log('Stats saved successfully');
        return true;
      } catch (error) {
        console.error('Error saving stats:', error);
        return false;
      }
    },
    []
  );

  // Получение статистики
  const getStats = useCallback(async (): Promise<PlayerStats | null> => {
    try {
      const stats = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }, []);

  return {
    saveGame,
    loadGame,
    hasSavedGame,
    clearSavedGame,
    saveHighScore,
    getHighScore,
    saveStats,
    getStats,
  };
};
