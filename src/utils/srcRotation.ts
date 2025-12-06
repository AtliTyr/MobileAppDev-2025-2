// utils/srcRotation.ts — SRS-повороты для 4×4 фигур

import { Tetromino, TetrominoType } from '../types/tetromino';
import { GameBoard } from '../types/game';

type Orientation = 0 | 1 | 2 | 3; // 0=spawn, 1=R, 2=2, 3=L
type KickKey = `${Orientation}-${Orientation}`;
type KickOffset = { x: number; y: number };
type KickTable = Partial<Record<KickKey, KickOffset[]>>;

// JLSTZ/O kicks (SRS) [web:161][web:162]
const JLSTZ_KICKS: KickTable = {
  '0-1': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ],
  '1-0': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  '1-2': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  '2-1': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ],
  '2-3': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ],
  '3-2': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ],
  '3-0': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ],
  '0-3': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ],
};

// I kicks (SRS) [web:161][web:162]
const I_KICKS: KickTable = {
  '0-1': [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: -1 },
    { x: 1, y: 2 },
  ],
  '1-0': [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 1 },
    { x: -1, y: -2 },
  ],
  '1-2': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 2 },
    { x: 2, y: -1 },
  ],
  '2-1': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: -2 },
    { x: -2, y: 1 },
  ],
  '2-3': [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 1 },
    { x: -1, y: -2 },
  ],
  '3-2': [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: -1 },
    { x: 1, y: 2 },
  ],
  '3-0': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: -2 },
    { x: -2, y: 1 },
  ],
  '0-3': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 2 },
    { x: 2, y: -1 },
  ],
};

const isIPiece = (t: Tetromino): boolean => t.type === 'I';

const getOrientation = (t: Tetromino): Orientation => {
  const r = t.rotation ?? 0;
  return (((r % 4) + 4) % 4) as Orientation;
};

const rotateMatrixCW = (cells: Tetromino['cells']): Tetromino['cells'] => {
  const size = 4;
  const rotated: Tetromino['cells'] = Array(size)
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
      rotated[x][size - 1 - y] = { ...cells[y][x] };
    }
  }
  return rotated;
};

const rotateMatrixCCW = (cells: Tetromino['cells']): Tetromino['cells'] => {
  const size = 4;
  const rotated: Tetromino['cells'] = Array(size)
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
      rotated[size - 1 - x][y] = { ...cells[y][x] };
    }
  }
  return rotated;
};

const checkCollisionAt = (
  t: Tetromino,
  board: GameBoard,
  pos: { x: number; y: number }
): boolean => {
  const { cells } = t;
  const height = board.length;
  const width = board[0].length;

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

export type RotateDir = 'CW' | 'CCW';

export const rotateWithSRS = (
  tetromino: Tetromino,
  board: GameBoard,
  dir: RotateDir
): Tetromino | null => {
  if (!tetromino) return null;

  const from = getOrientation(tetromino);
  const to: Orientation =
    dir === 'CW'
      ? (((from + 1) % 4) as Orientation)
      : (((from + 3) % 4) as Orientation);

  const key = `${from}-${to}` as KickKey;
  const kicks = (isIPiece(tetromino) ? I_KICKS[key] : JLSTZ_KICKS[key]) ?? [
    { x: 0, y: 0 },
  ];

  const rotatedCells =
    dir === 'CW'
      ? rotateMatrixCW(tetromino.cells)
      : rotateMatrixCCW(tetromino.cells);

  for (const { x: dx, y: dy } of kicks) {
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
