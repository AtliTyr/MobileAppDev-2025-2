/**
 * 💾 useGamePersistence.ts - Система сохранения и загрузки игры
 */

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Tetromino } from '../types/tetromino';

// ========================================
// 📦 КОНСТАНТЫ И КЛЮЧИ
// ========================================

const STORAGE_KEYS = {
  GAME_STATE: 'tetris_game_state',
  GAME_CONFIG: 'tetris_game_config',
  HIGH_SCORE: 'tetris_high_score',
  STATS: 'tetris_player_stats',
};

// ========================================
// 📊 ИНТЕРФЕЙСЫ
// ========================================

interface SavedGameState {
  version: string;
  timestamp: number;
  gameState: Omit<GameState, 'currentTetromino' | 'nextTetrominos'> & {
    currentTetromino: Tetromino | null;
    nextTetrominos: Tetromino[];
  };
  config: GameConfig;
  wordSetId?: string;

  // ✨ новое:
  currentTargetWord?: string | null;
  currentTargetId?: string | null;
}


interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  totalLines: number;
  totalWords: number;
  bestScore: number;
  bestLevel: number;
}

// Тип того, что возвращается в GameScreen:
export type LoadedGameData = {
  gameState: GameState;
  config: GameConfig;
  wordSetId?: string;
  currentTargetWord?: string | null;
  currentTargetId?: string | null;
};

// ========================================
// 🪝 ГЛАВНЫЙ ХУК
// ========================================

export const useGamePersistence = () => {
  // ========================================
  // 💾 СОХРАНЕНИЕ ИГРЫ
  // ========================================

  const saveGame = useCallback(
    async (
      gameState: GameState,
      wordSetId?: string,
      currentTargetWord?: string | null,
      currentTargetId?: string | null,
    ): Promise<void> => {
      try {
        const savedState: SavedGameState = {
          version: '1.0',
          timestamp: Date.now(),
          gameState: {
            ...(gameState as any),
            currentTetromino: gameState.currentTetromino,
            nextTetrominos: gameState.nextTetrominos,
          },
          config: DEFAULT_GAME_CONFIG,
          wordSetId,
          currentTargetWord,
          currentTargetId,
        };

        const jsonData = JSON.stringify(savedState);
        await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATE, jsonData);
        console.log('✅ Game saved successfully');
      } catch (error) {
        console.error('❌ Error saving game:', error);
        throw error;
      }
    },
    []
  );


  // ========================================
  // 📂 ЗАГРУЗКА ИГРЫ
  // ========================================

  const loadGame = useCallback(async (): Promise<LoadedGameData | null> => {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (!jsonData) {
        console.log('ℹ️ No saved game found');
        return null;
      }

      const savedState: SavedGameState = JSON.parse(jsonData);

      if (savedState.version !== '1.0') {
        console.warn('⚠️ Saved game version mismatch');
      }

      console.log('✅ Game loaded successfully');

      return {
        gameState: savedState.gameState as GameState,
        config: savedState.config,
        wordSetId: savedState.wordSetId,
        currentTargetWord: savedState.currentTargetWord,
        currentTargetId: savedState.currentTargetId,
      };
    } catch (error) {
      console.error('❌ Error loading game:', error);
      return null;
    }
  }, []);


  // ========================================
  // 🔍 ПРОВЕРКА НАЛИЧИЯ СОХРАНЕНИЯ
  // ========================================

  const hasSavedGame = useCallback(async (): Promise<boolean> => {
    try {
      const exists = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATE);
      return exists !== null;
    } catch (error) {
      console.error('❌ Error checking saved game:', error);
      return false;
    }
  }, []);

  // ========================================
  // 🗑️ УДАЛЕНИЕ СОХРАНЕНИЯ
  // ========================================

  const clearSavedGame = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      console.log('✅ Saved game cleared');
    } catch (error) {
      console.error('❌ Error clearing saved game:', error);
      throw error;
    }
  }, []);

  // ========================================
  // 📊 СТАТИСТИКА
  // ========================================

  const updateStats = useCallback(
    async (score: number, level: number, lines: number, words: number): Promise<void> => {
      try {
        const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
        const currentStats: PlayerStats = statsJson
          ? JSON.parse(statsJson)
          : {
              gamesPlayed: 0,
              totalScore: 0,
              totalLines: 0,
              totalWords: 0,
              bestScore: 0,
              bestLevel: 0,
            };

        currentStats.gamesPlayed += 1;
        currentStats.totalScore += score;
        currentStats.totalLines += lines;
        currentStats.totalWords += words;

        if (score > currentStats.bestScore) currentStats.bestScore = score;
        if (level > currentStats.bestLevel) currentStats.bestLevel = level;

        await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(currentStats));
        console.log('✅ Stats updated');
      } catch (error) {
        console.error('❌ Error updating stats:', error);
      }
    },
    []
  );

  const getStats = useCallback(async (): Promise<PlayerStats | null> => {
    try {
      const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      if (!statsJson) return null;
      const stats: PlayerStats = JSON.parse(statsJson);
      return stats;
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      return null;
    }
  }, []);

  const resetStats = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.STATS);
      console.log('✅ Stats reset');
    } catch (error) {
      console.error('❌ Error resetting stats:', error);
      throw error;
    }
  }, []);

  return {
    saveGame,
    loadGame,
    hasSavedGame,
    clearSavedGame,
    updateStats,
    getStats,
    resetStats,
  };
};
