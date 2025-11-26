import { Cell, Tetromino } from './tetromino';

// Игровое поле
export type GameBoard = (Cell | null)[][];

// Состояние игры
export interface GameState {
  // Основное состояние
  currentTetromino: Tetromino | null;
  nextTetrominos: Tetromino[]; // Следующие 3 фигуры
  heldTetromino: Tetromino | null; // Фигура в кармане (hold)
  canHold: boolean; // Можно ли менять фигуру в кармане (сбрасывается при спавне)
  board: GameBoard;

  // Игровые показатели
  score: number;
  level: number;
  linesCleared: number;
  wordsFormed: number; // Пока не используется, для будущей фишки со словами

  // Состояние игры
  isGameOver: boolean;
  isPaused: boolean;
  gameSpeed: number; // Интервал в мс между падением на 1 клетку
}

// Действия для изменения состояния (используется в useGameState)
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
  boardWidth: number; // Ширина доски (10 клеток)
  boardHeight: number; // Высота доски (20 клеток)
  initialSpeed: number; // Начальная скорость падения в мс (1000 = 1 сек)
  speedIncreasePerLevel: number; // На сколько мс ускориться при level up (50-100)
  nextTetrominosCount: number; // Сколько следующих фигур показывать (3)
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  boardWidth: 10,
  boardHeight: 20,
  initialSpeed: 1000, // Фигура падает на 1 клетку каждую секунду
  speedIncreasePerLevel: 50, // При каждом уровне ускоряется на 50ms
  nextTetrominosCount: 3,
};

// Результат проверки слов (для будущей фазы)
export interface WordCheckResult {
  words: string[];
  positions: number[][][]; // Позиции букв для каждого слова
}


/**
 * Создание пустой доски
 */
export const createEmptyBoard = (width: number, height: number): GameBoard =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

/**
 * Создание начального состояния игры
 */
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

/**
 * Проверка является ли клетка корректной позицией на доске
 */
export const isValidBoardPosition = (
  x: number,
  y: number,
  config: GameConfig
): boolean => {
  return x >= 0 && x < config.boardWidth && y >= 0 && y < config.boardHeight;
};

/**
 * Получить информацию о доске (для debug)
 */
export const getBoardInfo = (board: GameBoard) => {
  let filledCells = 0;
  let emptyRows = 0;

  for (let y = 0; y < board.length; y++) {
    let rowFilled = 0;
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] !== null) {
        rowFilled++;
        filledCells++;
      }
    }
    if (rowFilled === 0) {
      emptyRows++;
    }
  }

  return {
    filledCells,
    emptyRows,
    totalCells: board.length * board[0].length,
    fillPercentage: ((filledCells / (board.length * board[0].length)) * 100).toFixed(1),
  };
};