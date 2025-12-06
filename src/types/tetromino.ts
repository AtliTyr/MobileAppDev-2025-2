// types/tetromino.ts — 4×4 SRS-совместимые фигуры

export type LetterFrequency = {
  letter: string;
  frequency: number;
  cumulative: number;
};

export type LetterLanguage = 'ru' | 'en';

export const LETTER_FREQUENCIES_RU: LetterFrequency[] = [
  { letter: 'О', frequency: 10.97, cumulative: 10.97 },
  { letter: 'Е', frequency: 8.45, cumulative: 19.42 },
  { letter: 'А', frequency: 8.01, cumulative: 27.43 },
  { letter: 'И', frequency: 7.35, cumulative: 34.78 },
  { letter: 'Н', frequency: 6.70, cumulative: 41.48 },
  { letter: 'Т', frequency: 6.26, cumulative: 47.74 },
  { letter: 'С', frequency: 5.47, cumulative: 53.21 },
  { letter: 'Р', frequency: 4.73, cumulative: 57.94 },
  { letter: 'В', frequency: 4.54, cumulative: 62.48 },
  { letter: 'Л', frequency: 4.40, cumulative: 66.88 },
  { letter: 'К', frequency: 3.49, cumulative: 70.37 },
  { letter: 'М', frequency: 3.21, cumulative: 73.58 },
  { letter: 'Д', frequency: 2.98, cumulative: 76.56 },
  { letter: 'П', frequency: 2.81, cumulative: 79.37 },
  { letter: 'У', frequency: 2.62, cumulative: 81.99 },
  { letter: 'Я', frequency: 2.01, cumulative: 84.0 },
  { letter: 'Ы', frequency: 1.90, cumulative: 85.9 },
  { letter: 'Ь', frequency: 1.74, cumulative: 87.64 },
  { letter: 'Г', frequency: 1.70, cumulative: 89.34 },
  { letter: 'З', frequency: 1.65, cumulative: 90.99 },
  { letter: 'Б', frequency: 1.59, cumulative: 92.58 },
  { letter: 'Ч', frequency: 1.44, cumulative: 94.02 },
  { letter: 'Ф', frequency: 1.21, cumulative: 95.23 },
  { letter: 'Х', frequency: 0.97, cumulative: 96.2 },
  { letter: 'Ц', frequency: 0.94, cumulative: 97.14 },
  { letter: 'Щ', frequency: 0.73, cumulative: 97.87 },
  { letter: 'Ж', frequency: 0.64, cumulative: 98.51 },
  { letter: 'Ш', frequency: 0.48, cumulative: 98.99 },
  { letter: 'Э', frequency: 0.36, cumulative: 99.35 },
  { letter: 'Ю', frequency: 0.32, cumulative: 99.67 },
  { letter: 'Ъ', frequency: 0.26, cumulative: 99.93 },
  { letter: 'Й', frequency: 0.04, cumulative: 99.97 },
  { letter: 'Ё', frequency: 0.04, cumulative: 100.0 },
];

export const LETTER_FREQUENCIES_EN: LetterFrequency[] = [
  // примерные значения, можно подкрутить под баланс [web:17][web:21]
  { letter: 'E', frequency: 12.02, cumulative: 12.02 },
  { letter: 'T', frequency: 9.10, cumulative: 21.12 },
  { letter: 'A', frequency: 8.12, cumulative: 29.24 },
  { letter: 'O', frequency: 7.68, cumulative: 36.92 },
  { letter: 'I', frequency: 7.31, cumulative: 44.23 },
  { letter: 'N', frequency: 6.95, cumulative: 51.18 },
  { letter: 'S', frequency: 6.28, cumulative: 57.46 },
  { letter: 'R', frequency: 6.02, cumulative: 63.48 },
  { letter: 'H', frequency: 5.92, cumulative: 69.4 },
  { letter: 'D', frequency: 4.32, cumulative: 73.72 },
  { letter: 'L', frequency: 3.98, cumulative: 77.7 },
  { letter: 'U', frequency: 2.88, cumulative: 80.58 },
  { letter: 'C', frequency: 2.71, cumulative: 83.29 },
  { letter: 'M', frequency: 2.61, cumulative: 85.9 },
  { letter: 'F', frequency: 2.30, cumulative: 88.2 },
  { letter: 'Y', frequency: 2.11, cumulative: 90.31 },
  { letter: 'W', frequency: 2.09, cumulative: 92.4 },
  { letter: 'G', frequency: 2.03, cumulative: 94.43 },
  { letter: 'P', frequency: 1.82, cumulative: 96.25 },
  { letter: 'B', frequency: 1.49, cumulative: 97.74 },
  { letter: 'V', frequency: 1.11, cumulative: 98.85 },
  { letter: 'K', frequency: 0.69, cumulative: 99.54 },
  { letter: 'X', frequency: 0.17, cumulative: 99.71 },
  { letter: 'Q', frequency: 0.11, cumulative: 99.82 },
  { letter: 'J', frequency: 0.10, cumulative: 99.92 },
  { letter: 'Z', frequency: 0.07, cumulative: 100.0 },
];


export type Cell = {
  letter: string;
  color: string;
  isEmpty: boolean;
};

export type TetrominoType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';

export type Tetromino = {
  cells: Cell[][]; // ВСЕГДА 4×4
  position: { x: number; y: number }; // координаты origin по SRS (левый верх 4×4 блока на поле)
  rotation: number; // 0,1,2,3 = SRS orientation
  type: TetrominoType;
};

// 4×4 фигуры в SRS-координатах.
// Каждая — массив 4 строк по 4 колонки.
// Эти формы взяты из распространённых реализаций SRS для guideline Tetris. [web:161][web:162]
export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00FFFF',
  O: '#FFFF00',
  T: '#FF00FF',
  L: '#FF7F00',
  J: '#0000FF',
  S: '#00FF00',
  Z: '#FF0000',
};
