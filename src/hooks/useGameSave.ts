import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../types';

const SAVE_KEY = 'tetris_save_game';

export interface SavedGame {
  gameState: GameState;
  timestamp: number;
}

export const useGameSave = () => {
  // Сохранение игры
  const saveGame = async (gameState: GameState): Promise<boolean> => {
    try {
      const savedGame: SavedGame = {
        gameState: {
          ...gameState,
          isPaused: true, // При сохранении всегда ставим на паузу
        },
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(savedGame));
      console.log('Игра сохранена');
      return true;
    } catch (error) {
      console.error('Ошибка сохранения игры:', error);
      return false;
    }
  };

  // Загрузка игры
  const loadGame = async (): Promise<SavedGame | null> => {
    try {
      const savedData = await AsyncStorage.getItem(SAVE_KEY);
      if (savedData) {
        const savedGame: SavedGame = JSON.parse(savedData);
        console.log('Игра загружена');
        return savedGame;
      }
      return null;
    } catch (error) {
      console.error('Ошибка загрузки игры:', error);
      return null;
    }
  };

  // Проверка наличия сохранения
  const hasSavedGame = async (): Promise<boolean> => {
    try {
      const savedData = await AsyncStorage.getItem(SAVE_KEY);
      return savedData !== null;
    } catch (error) {
      console.error('Ошибка проверки сохранения:', error);
      return false;
    }
  };

  // Удаление сохранения
  const deleteSave = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(SAVE_KEY);
      console.log('Сохранение удалено');
      return true;
    } catch (error) {
      console.error('Ошибка удаления сохранения:', error);
      return false;
    }
  };

  return {
    saveGame,
    loadGame,
    hasSavedGame,
    deleteSave,
  };
};