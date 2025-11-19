import { Cell, Tetromino } from './tetromino';

// Игровое поле
export type GameBoard = (Cell | null)[][];

// Состояние игры
export interface GameState {
  // Основное состояние
  currentTetromino: Tetromino | null;
  nextTetrominos: Tetromino[]; // Следующие 3 фигуры
  heldTetromino: Tetromino | null; // Фигура в кармане
  canHold: boolean; // Можно ли менять фигуру в кармане
  board: GameBoard;
  
  // Игровые показатели
  score: number;
  level: number;
  linesCleared: number;
  wordsFormed: number;
  
  // Состояние игры
  isGameOver: boolean;
  isPaused: boolean;
  gameSpeed: number; // Интервал в мс
}

// Действия для изменения состояния
export type GameAction =
  | { type: 'MOVE_TETROMINO'; dx: number; dy: number }
  | { type: 'ROTATE_TETROMINO' }
  | { type: 'HOLD_TETROMINO' }
  | { type: 'HARD_DROP' }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'ADD_SCORE'; points: number }
  | { type: 'ADD_LINES'; lines: number }
  | { type: 'ADD_WORD' }
  | { type: 'LEVEL_UP' };

// Конфигурация игры
export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  initialSpeed: number;
  speedIncreasePerLevel: number;
  nextTetrominosCount: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  boardWidth: 10,
  boardHeight: 20,
  initialSpeed: 1000,
  speedIncreasePerLevel: 50,
  nextTetrominosCount: 3
};

// Результат проверки слов
export interface WordCheckResult {
  words: string[];
  positions: number[][][]; // Позиции букв для каждого слова
}

// Утилиты для работы с игровым полем
export const createEmptyBoard = (width: number, height: number): GameBoard => 
  Array(height).fill(null).map(() => Array(width).fill(null));

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
  gameSpeed: config.initialSpeed
});