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
    
    return {
      cells,
      position: { x: startX, y: startY },
      rotation: 0
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
    
    // Создаем новую матрицу для повернутых клеток
    const rotatedCells: Cell[][] = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill({
        letter: '',
        color: '#000000',
        isEmpty: true
      }));

    // Поворачиваем матрицу на 90 градусов по часовой стрелке
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