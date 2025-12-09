// utils/srcRotation.ts — Pivot-based rotation (как в классическом тетрисе)

import { Tetromino, TetrominoType } from '../types/tetromino';
import { GameBoard } from '../types/game';

type Orientation = 0 | 1 | 2 | 3;

// ========================================
// 📍 PIVOT POINTS (точки вращения)
// ========================================
// Для каждой фигуры в матрице 4×4 определена центральная точка

const PIVOT_POINTS: Record<TetrominoType, { x: number; y: number }> = {
  I: { x: 1.5, y: 1.5 }, // Центр между блоками
  O: { x: 1.5, y: 1.5 }, // Центр квадрата 2×2
  T: { x: 1, y: 1 },     // Центральный блок буквы T
  L: { x: 1, y: 1 },     // Угол буквы L
  J: { x: 1, y: 1 },     // Угол буквы J
  S: { x: 1, y: 1 },     // Центральный блок
  Z: { x: 1, y: 1 },     // Центральный блок
};

// ========================================
// 🔄 ВРАЩЕНИЕ ВОКРУГ PIVOT POINT
// ========================================

const getOrientation = (t: Tetromino): Orientation => {
  const r = t.rotation ?? 0;
  return (((r % 4) + 4) % 4) as Orientation;
};

/**
 * Вращает фигуру вокруг pivot point (опорной точки)
 * Формула вращения на 90° CW: (x', y') = (pivot.x - (y - pivot.y), pivot.y + (x - pivot.x))
 */
const rotateCellsAroundPivot = (
  cells: Tetromino['cells'],
  pivot: { x: number; y: number },
  direction: 'CW' | 'CCW'
): Tetromino['cells'] => {
  const size = 4;
  const newCells: Tetromino['cells'] = Array(size)
    .fill(null)
    .map(() =>
      Array(size).fill({
        letter: '',
        color: '#000000',
        isEmpty: true,
      })
    );

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y][x].isEmpty) continue;

      let newX: number, newY: number;

      if (direction === 'CW') {
        // Вращение по часовой стрелке вокруг pivot
        newX = Math.round(pivot.x - (y - pivot.y));
        newY = Math.round(pivot.y + (x - pivot.x));
      } else {
        // Вращение против часовой стрелки
        newX = Math.round(pivot.x + (y - pivot.y));
        newY = Math.round(pivot.y - (x - pivot.x));
      }

      // Проверка границ матрицы 4×4
      if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
        newCells[newY][newX] = { ...cells[y][x] };
      }
    }
  }

  return newCells;
};

/**
 * Проверяет коллизию на заданной позиции
 */
const checkCollisionAt = (
  t: Tetromino,
  board: GameBoard,
  pos: { x: number; y: number }
): boolean => {
  const { cells } = t;
  const height = board.length;
  const width = board[0]?.length ?? 10;

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (cells[i][j].isEmpty) continue;

      const bx = pos.x + j;
      const by = pos.y + i;

      if (bx < 0 || bx >= width) return true;
      if (by >= height) return true;
      if (by >= 0 && board[by]?.[bx]) return true;
    }
  }

  return false;
};

/**
 * Базовые wall kicks (упрощённые)
 * Только минимальные смещения для предотвращения застревания в стенах
 */
const BASIC_KICKS = [
  { x: 0, y: 0 },   // Без смещения
  { x: -1, y: 0 },  // Влево
  { x: 1, y: 0 },   // Вправо
  { x: 0, y: -1 },  // Вверх
  { x: -1, y: -1 }, // Влево-вверх
  { x: 1, y: -1 },  // Вправо-вверх
];

/**
 * Специальное вращение для O-фигуры
 */
const rotateOPiece = (tetromino: Tetromino, dir: 'CW' | 'CCW'): Tetromino => {
  const from = getOrientation(tetromino);
  const to: Orientation =
    dir === 'CW'
      ? (((from + 1) % 4) as Orientation)
      : (((from + 3) % 4) as Orientation);

  const cells = tetromino.cells.map(row => row.map(cell => ({ ...cell })));
  
  const active: { y: number; x: number; cell: any }[] = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (!cells[y][x].isEmpty) {
        active.push({ y, x, cell: cells[y][x] });
      }
    }
  }

  if (active.length === 4) {
    const letters = active.map(a => a.cell.letter);
    const rotated = dir === 'CW'
      ? [letters[3], letters[0], letters[1], letters[2]]
      : [letters[1], letters[2], letters[3], letters[0]];
    
    active.forEach((a, i) => {
      cells[a.y][a.x].letter = rotated[i];
    });
  }

  return {
    ...tetromino,
    cells,
    rotation: to,
  };
};

// ========================================
// 🎮 ОСНОВНАЯ ФУНКЦИЯ
// ========================================

export type RotateDir = 'CW' | 'CCW';

/**
 * Вращает тетромино вокруг pivot point с минимальными wall kicks
 * Это обеспечивает "стабильное" вращение как в классическом тетрисе
 */
export const rotateWithSRS = (
  tetromino: Tetromino,
  board: GameBoard,
  dir: RotateDir
): Tetromino | null => {
  if (!tetromino) return null;

  // Специальная обработка для O-фигуры
  if (tetromino.type === 'O') {
    return rotateOPiece(tetromino, dir);
  }

  const from = getOrientation(tetromino);
  const to: Orientation =
    dir === 'CW'
      ? (((from + 1) % 4) as Orientation)
      : (((from + 3) % 4) as Orientation);

  // Получаем pivot point для данной фигуры
  const pivot = PIVOT_POINTS[tetromino.type];

  // Вращаем матрицу вокруг pivot
  const rotatedCells = rotateCellsAroundPivot(tetromino.cells, pivot, dir);

  // Пробуем базовые kicks
  for (const { x: dx, y: dy } of BASIC_KICKS) {
    const newPos = {
      x: tetromino.position.x + dx,
      y: tetromino.position.y + dy,
    };

    const candidate: Tetromino = {
      ...tetromino,
      cells: rotatedCells,
      position: newPos,
      rotation: to,
    };

    if (!checkCollisionAt(candidate, board, newPos)) {
      return candidate;
    }
  }

  return null;
};
