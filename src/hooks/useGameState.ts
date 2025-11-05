import { useState, useCallback } from 'react';
import { GameState, Tetromino, TetrominoType, TETROMINOES, GameBoard } from '../types';

const ROWS = 20;
const COLS = 10;

// Создание пустого поля
const createEmptyBoard = (): GameBoard => 
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// Создание случайной фигуры
const createRandomTetromino = (): Tetromino => {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const { shape, color } = TETROMINOES[randomType];
  
  return {
    type: randomType,
    shape,
    position: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
    color,
  };
};

// Генерация следующих фигур
const generateNextPieces = (): Tetromino[] => {
  return Array.from({ length: 3 }, createRandomTetromino);
};

const INITIAL_STATE: GameState = {
  board: createEmptyBoard(),
  currentPiece: null,
  nextPieces: [],
  heldPiece: null,
  canHold: true,
  score: 0,
  level: 1,
  lines: 0,
  isPaused: false,
  isGameOver: false,
  gameSpeed: 1000,
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  const loadGameState = useCallback((savedState: GameState) => {
    setGameState({
      ...savedState,
      isPaused: false, // Снимаем паузу при загрузке
    });
  }, []);
  
  // Инициализация игры
  const initializeGame = useCallback(() => {
    const nextPieces = generateNextPieces();
    const currentPiece = createRandomTetromino();
    
    setGameState({
      ...INITIAL_STATE,
      currentPiece,
      nextPieces,
    });
  }, []);

  // Пауза игры
  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  // Обновление счета
  const updateScore = useCallback((clearedLines: number) => {
    setGameState(prev => {
      const newLines = prev.lines + clearedLines;
      const newLevel = Math.floor(newLines / 10) + 1;
      const points = [0, 40, 100, 300, 1200]; // Очки за 0,1,2,3,4 линии
      const lineScore = points[clearedLines] * newLevel;
      
      return {
        ...prev,
        score: prev.score + lineScore,
        lines: newLines,
        level: newLevel,
        gameSpeed: Math.max(100, 1000 - (newLevel - 1) * 100),
      };
    });
  }, []);

  // === ХУКИ ДЛЯ ОТЛАДКИ ===

  // Установка конкретного количества очков
  const setScore = useCallback((newScore: number) => {
    setGameState(prev => ({
      ...prev,
      score: Math.max(0, newScore),
    }));
  }, []);

  // Добавление очков
  const addScore = useCallback((points: number) => {
    setGameState(prev => ({
      ...prev,
      score: Math.max(0, prev.score + points),
    }));
  }, []);

  // Установка уровня
  const setLevel = useCallback((newLevel: number) => {
    setGameState(prev => ({
      ...prev,
      level: Math.max(1, newLevel),
      gameSpeed: Math.max(100, 1000 - (newLevel - 1) * 100),
    }));
  }, []);

  // Добавление уровня
  const addLevel = useCallback((levels: number) => {
    setGameState(prev => {
      const newLevel = Math.max(1, prev.level + levels);
      return {
        ...prev,
        level: newLevel,
        gameSpeed: Math.max(100, 1000 - (newLevel - 1) * 100),
      };
    });
  }, []);

  // Установка количества линий
  const setLines = useCallback((newLines: number) => {
    setGameState(prev => ({
      ...prev,
      lines: Math.max(0, newLines),
    }));
  }, []);

  // Добавление линий
  const addLines = useCallback((lines: number) => {
    setGameState(prev => ({
      ...prev,
      lines: Math.max(0, prev.lines + lines),
    }));
  }, []);

  // Очистка поля
  const clearBoard = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: createEmptyBoard(),
    }));
  }, []);

  // Установка конкретной фигуры
  const setCurrentPiece = useCallback((pieceType: TetrominoType) => {
    const { shape, color } = TETROMINOES[pieceType];
    const newPiece: Tetromino = {
      type: pieceType,
      shape,
      position: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
      color,
    };

    setGameState(prev => ({
      ...prev,
      currentPiece: newPiece,
    }));
  }, []);

  // Сброс возможности хода в карман
  const resetHold = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      canHold: true,
    }));
  }, []);

  // Пропуск на следующий уровень (добавляет 10 линий)
  const skipToNextLevel = useCallback(() => {
    setGameState(prev => {
      const currentLevelLines = prev.lines % 10;
      const linesToAdd = 10 - currentLevelLines;
      const newLines = prev.lines + linesToAdd;
      const newLevel = Math.floor(newLines / 10) + 1;
      
      return {
        ...prev,
        lines: newLines,
        level: newLevel,
        gameSpeed: Math.max(100, 1000 - (newLevel - 1) * 100),
      };
    });
  }, []);

  // Сброс игры к начальным настройкам (без перезапуска)
  const resetStats = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      level: 1,
      lines: 0,
      gameSpeed: 1000,
    }));
  }, []);

  // Сохранение фигуры в карман
  const holdPiece = useCallback(() => {
    if (!gameState.canHold || !gameState.currentPiece) return;

    setGameState(prev => {
      const newHeldPiece = prev.currentPiece;
      const newCurrentPiece = prev.heldPiece || prev.nextPieces[0];
      const newNextPieces = prev.heldPiece 
        ? prev.nextPieces.slice(1)
        : [...prev.nextPieces.slice(1), createRandomTetromino()];

      return {
        ...prev,
        heldPiece: newHeldPiece,
        currentPiece: newCurrentPiece,
        nextPieces: newNextPieces,
        canHold: false,
      };
    });
  }, [gameState.canHold, gameState.currentPiece]);

  // Перемещение фигуры
  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (gameState.isPaused || !gameState.currentPiece) return;

    setGameState(prev => {
      const { currentPiece } = prev;
      if (!currentPiece) return prev;

      const newPosition = { ...currentPiece.position };
      
      switch (direction) {
        case 'left':
          newPosition.x -= 1;
          break;
        case 'right':
          newPosition.x += 1;
          break;
        case 'down':
          newPosition.y += 1;
          break;
      }

      // TODO: Добавить проверку коллизий позже
      return {
        ...prev,
        currentPiece: {
          ...currentPiece,
          position: newPosition,
        },
      };
    });
  }, [gameState.isPaused, gameState.currentPiece]);

  // Вращение фигуры
  const rotatePiece = useCallback(() => {
    if (gameState.isPaused || !gameState.currentPiece) return;

    setGameState(prev => {
      const { currentPiece } = prev;
      if (!currentPiece) return prev;

      // Поворот матрицы на 90 градусов
      const rotatedShape = currentPiece.shape[0].map((_, index) =>
        currentPiece.shape.map(row => row[index]).reverse()
      );

      // TODO: Добавить проверку коллизий после поворота
      return {
        ...prev,
        currentPiece: {
          ...currentPiece,
          shape: rotatedShape,
        },
      };
    });
  }, [gameState.isPaused, gameState.currentPiece]);

  return {
    gameState,
    initializeGame,
    togglePause,
    updateScore,
    holdPiece,
    movePiece,
    rotatePiece,
    loadGameState,
    
    // Хуки для отладки
    setScore,
    addScore,
    setLevel,
    addLevel,
    setLines,
    addLines,
    clearBoard,
    setCurrentPiece,
    resetHold,
    skipToNextLevel,
    resetStats,
  };
};

// import { useState, useCallback } from 'react';
// import { GameState, Tetromino, TetrominoType, TETROMINOES, GameBoard } from '../types';

// const ROWS = 20;
// const COLS = 10;

// // Создание пустого поля
// const createEmptyBoard = (): GameBoard => 
//   Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// // Создание случайной фигуры
// const createRandomTetromino = (): Tetromino => {
//   const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
//   const randomType = types[Math.floor(Math.random() * types.length)];
//   const { shape, color } = TETROMINOES[randomType];
  
//   return {
//     type: randomType,
//     shape,
//     position: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
//     color,
//   };
// };

// // Генерация следующих фигур
// const generateNextPieces = (): Tetromino[] => {
//   return Array.from({ length: 3 }, createRandomTetromino);
// };

// const INITIAL_STATE: GameState = {
//   board: createEmptyBoard(),
//   currentPiece: null,
//   nextPieces: [],
//   heldPiece: null,
//   canHold: true,
//   score: 0,
//   level: 1,
//   lines: 0,
//   isPaused: false,
//   isGameOver: false,
//   gameSpeed: 1000,
// };

// export const useGameState = () => {
//   const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

//   // Инициализация игры
//   const initializeGame = useCallback(() => {
//     const nextPieces = generateNextPieces();
//     const currentPiece = createRandomTetromino();
    
//     setGameState({
//       ...INITIAL_STATE,
//       currentPiece,
//       nextPieces,
//     });
//   }, []);

//   // Пауза игры
//   const togglePause = useCallback(() => {
//     setGameState(prev => ({
//       ...prev,
//       isPaused: !prev.isPaused,
//     }));
//   }, []);

//   // Обновление счета
//   const updateScore = useCallback((clearedLines: number) => {
//     setGameState(prev => {
//       const newLines = prev.lines + clearedLines;
//       const newLevel = Math.floor(newLines / 10) + 1;
//       const points = [0, 40, 100, 300, 1200]; // Очки за 0,1,2,3,4 линии
//       const lineScore = points[clearedLines] * newLevel;
      
//       return {
//         ...prev,
//         score: prev.score + lineScore,
//         lines: newLines,
//         level: newLevel,
//         gameSpeed: Math.max(100, 1000 - (newLevel - 1) * 100),
//       };
//     });
//   }, []);

//   // Сохранение фигуры в карман
//   const holdPiece = useCallback(() => {
//     if (!gameState.canHold || !gameState.currentPiece) return;

//     setGameState(prev => {
//       const newHeldPiece = prev.currentPiece;
//       const newCurrentPiece = prev.heldPiece || prev.nextPieces[0];
//       const newNextPieces = prev.heldPiece 
//         ? prev.nextPieces.slice(1)
//         : [...prev.nextPieces.slice(1), createRandomTetromino()];

//       return {
//         ...prev,
//         heldPiece: newHeldPiece,
//         currentPiece: newCurrentPiece,
//         nextPieces: newNextPieces,
//         canHold: false,
//       };
//     });
//   }, [gameState.canHold, gameState.currentPiece]);

//   // Перемещение фигуры
//   const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
//     if (gameState.isPaused || !gameState.currentPiece) return;

//     setGameState(prev => {
//       const { currentPiece } = prev;
//       if (!currentPiece) return prev;

//       const newPosition = { ...currentPiece.position };
      
//       switch (direction) {
//         case 'left':
//           newPosition.x -= 1;
//           break;
//         case 'right':
//           newPosition.x += 1;
//           break;
//         case 'down':
//           newPosition.y += 1;
//           break;
//       }

//       // TODO: Добавить проверку коллизий позже
//       return {
//         ...prev,
//         currentPiece: {
//           ...currentPiece,
//           position: newPosition,
//         },
//       };
//     });
//   }, [gameState.isPaused, gameState.currentPiece]);

//   // Вращение фигуры
//   const rotatePiece = useCallback(() => {
//     if (gameState.isPaused || !gameState.currentPiece) return;

//     setGameState(prev => {
//       const { currentPiece } = prev;
//       if (!currentPiece) return prev;

//       // Поворот матрицы на 90 градусов
//       const rotatedShape = currentPiece.shape[0].map((_, index) =>
//         currentPiece.shape.map(row => row[index]).reverse()
//       );

//       // TODO: Добавить проверку коллизий после поворота
//       return {
//         ...prev,
//         currentPiece: {
//           ...currentPiece,
//           shape: rotatedShape,
//         },
//       };
//     });
//   }, [gameState.isPaused, gameState.currentPiece]);

//   return {
//     gameState,
//     initializeGame,
//     togglePause,
//     updateScore,
//     holdPiece,
//     movePiece,
//     rotatePiece,
//   };
// };