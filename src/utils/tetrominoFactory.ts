// utils/tetrominoFactory.ts - БЕЗ НИКАКИХ РОТАЦИЙ, ПРОСТО ИСПОЛЬЗУЕМ SHAPES

import {
  Tetromino,
  TetrominoType,
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
  Cell,
  LETTER_FREQUENCIES
} from '../types/tetromino';

export class TetrominoFactory {
  static create(
    type: TetrominoType,
    letters: string[] = [],
    startX: number = 3,
    startY: number = 0
  ): Tetromino {
    const shape = TETROMINO_SHAPES[type];
    const color = TETROMINO_COLORS[type];
    const finalLetters = letters.length > 0
      ? letters
      : this.generateWeightedLetters(this.countCells(shape));
    
    const cells = this.createCellsFromShape(shape, finalLetters, color);

    // 🔴 БЕЗ РОТАЦИЙ! Просто возвращаем cells как есть
    return {
      cells,
      position: { x: startX, y: startY },
      rotation: 0,
      type: type,
    };
  }

  static createRandom(letters?: string[]): Tetromino {
    const types = Object.keys(TETROMINO_SHAPES) as TetrominoType[];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return this.create(randomType, letters);
  }

  static createMultiple(count: number): Tetromino[] {
    return Array(count).fill(null).map(() => this.createRandom());
  }

  private static countCells(shape: number[][]): number {
    return shape.flat().filter(cell => cell === 1).length;
  }

  private static generateWeightedLetters(count: number): string[] {
    const letters: string[] = [];
    for (let i = 0; i < count; i++) {
      const random = Math.random() * 100;
      const letterData = LETTER_FREQUENCIES.find(freq => random <= freq.cumulative);
      letters.push(letterData ? letterData.letter : 'о');
    }
    return letters;
  }

  private static createCellsFromShape(
    shape: number[][],
    letters: string[],
    color: string
  ): Cell[][] {
    let letterIndex = 0;
    const cells: Cell[][] = [];

    for (let i = 0; i < shape.length; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] === 1) {
          row.push({
            letter: letters[letterIndex++],
            color,
            isEmpty: false
          });
        } else {
          row.push({
            letter: '',
            color: '#000000',
            isEmpty: true
          });
        }
      }
      cells.push(row);
    }

    return cells;
  }
}

// Утилиты для работы с тетромино
export class TetrominoUtils {
  static rotate(tetromino: Tetromino): Tetromino {
    const cells = tetromino.cells;
    const rows = cells.length;
    const cols = cells[0].length;

    // Специальная обработка для I тетромино
    if (cells.length === 4 && cells[0].length === 1) {
      // Вертикальная I (4x1) → горизонтальная (1x4)
      const rotatedCells: Cell[][] = [
        [cells[0][0], cells[1][0], cells[2][0], cells[3][0]],
      ];
      return {
        ...tetromino,
        cells: rotatedCells,
        rotation: (tetromino.rotation + 1) % 4,
      };
    } else if (cells.length === 1 && cells[0].length === 4) {
      // Горизонтальная I (1x4) → вертикальная (4x1)
      const rotatedCells: Cell[][] = [
        [cells[0][0]],
        [cells[0][1]],
        [cells[0][2]],
        [cells[0][3]],
      ];
      return {
        ...tetromino,
        cells: rotatedCells,
        rotation: (tetromino.rotation + 1) % 4,
      };
    }

    // Стандартная ротация для остальных
    const rotatedCells: Cell[][] = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill({
        letter: '',
        color: '#000000',
        isEmpty: true
      }));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotatedCells[j][rows - 1 - i] = {
          ...cells[i][j],
          isEmpty: cells[i][j].isEmpty
        };
      }
    }

    return {
      ...tetromino,
      cells: rotatedCells,
      rotation: (tetromino.rotation + 1) % 4
    };
  }

  static move(tetromino: Tetromino, dx: number, dy: number): Tetromino {
    return {
      ...tetromino,
      position: {
        x: tetromino.position.x + dx,
        y: tetromino.position.y + dy
      }
    };
  }

  static resetPosition(tetromino: Tetromino, startX: number = 3, startY: number = 0): Tetromino {
    return {
      ...tetromino,
      position: { x: startX, y: startY },
      rotation: 0
    };
  }

  static getBounds(tetromino: Tetromino): { width: number; height: number } {
    return {
      width: tetromino.cells[0]?.length || 0,
      height: tetromino.cells.length
    };
  }
}
