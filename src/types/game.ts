// types/game.ts

import { Cell, Tetromino } from './tetromino';

// Игровое поле
export type GameBoard = (Cell | null)[][];

// Состояние игры
export interface GameState {
  currentTetromino: Tetromino | null;
  nextTetrominos: Tetromino[];
  heldTetromino: Tetromino | null;
  canHold: boolean;
  board: GameBoard;
  score: number;
  level: number;
  linesCleared: number;
  wordsFormed: number;
  isGameOver: boolean;
  isPaused: boolean;
  gameSpeed: number;
}

// Конфигурация игры (БЕЗ языка)
export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  initialSpeed: number;
  speedIncreasePerLevel: number;
  nextTetrominosCount: number;
  targetWord?: string;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  boardWidth: 10,
  boardHeight: 20,
  initialSpeed: 1000,
  speedIncreasePerLevel: 50,
  nextTetrominosCount: 3,
};

export const createEmptyBoard = (
  width: number,
  height: number
): GameBoard =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

export const createInitialGameState = (config: GameConfig): GameState => ({
  currentTetromino: null,
  nextTetrominos: [],
  heldTetromino: null,
  canHold: true,
  board: createEmptyBoard(config.boardWidth, config.boardHeight),
  score: 0,
  level: 1,
  linesCleared: 0,
  wordsFormed: 0,
  isGameOver: false,
  isPaused: false,
  gameSpeed: config.initialSpeed,
});
