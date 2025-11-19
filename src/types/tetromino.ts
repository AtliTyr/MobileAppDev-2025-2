export type LetterFrequency = {
    letter: string;
    frequency: number;
    cumulative: number;
};

export const LETTER_FREQUENCIES: LetterFrequency[] = [
    { letter: 'о', frequency: 10.97, cumulative: 10.97 },
    { letter: 'е', frequency: 8.45, cumulative: 19.42 },
    { letter: 'а', frequency: 8.01, cumulative: 27.43 },
    { letter: 'и', frequency: 7.35, cumulative: 34.78 },
    { letter: 'н', frequency: 6.70, cumulative: 41.48 },
    { letter: 'т', frequency: 6.26, cumulative: 47.74 },
    { letter: 'с', frequency: 5.47, cumulative: 53.21 },
    { letter: 'р', frequency: 4.73, cumulative: 57.94 },
    { letter: 'в', frequency: 4.54, cumulative: 62.48 },
    { letter: 'л', frequency: 4.40, cumulative: 66.88 },
    { letter: 'к', frequency: 3.49, cumulative: 70.37 },
    { letter: 'м', frequency: 3.21, cumulative: 73.58 },
    { letter: 'д', frequency: 2.98, cumulative: 76.56 },
    { letter: 'п', frequency: 2.81, cumulative: 79.37 },
    { letter: 'у', frequency: 2.62, cumulative: 81.99 },
    { letter: 'я', frequency: 2.01, cumulative: 84.00 },
    { letter: 'ы', frequency: 1.90, cumulative: 85.90 },
    { letter: 'ь', frequency: 1.74, cumulative: 87.64 },
    { letter: 'г', frequency: 1.70, cumulative: 89.34 },
    { letter: 'з', frequency: 1.65, cumulative: 90.99 },
    { letter: 'б', frequency: 1.59, cumulative: 92.58 },
    { letter: 'ч', frequency: 1.44, cumulative: 94.02 },
    { letter: 'й', frequency: 1.21, cumulative: 95.23 },
    { letter: 'х', frequency: 0.97, cumulative: 96.20 },
    { letter: 'ж', frequency: 0.94, cumulative: 97.14 },
    { letter: 'ш', frequency: 0.73, cumulative: 97.87 },
    { letter: 'ю', frequency: 0.64, cumulative: 98.51 },
    { letter: 'ц', frequency: 0.48, cumulative: 98.99 },
    { letter: 'щ', frequency: 0.36, cumulative: 99.35 },
    { letter: 'э', frequency: 0.32, cumulative: 99.67 },
    { letter: 'ф', frequency: 0.26, cumulative: 99.93 },
    { letter: 'ъ', frequency: 0.04, cumulative: 99.97 },
    { letter: 'ё', frequency: 0.04, cumulative: 100.00 }
];

export type Cell = {
    letter: string;
    color: string;
    isEmpty: boolean;
};

export type Tetromino = {
    cells: Cell[][];
    position: { x: number, y: number };
    rotation: number;
};

export type TetrominoType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';

export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
    I: [
        [1, 1, 1, 1]
    ],
    O: [
        [1, 1], 
        [1, 1]
    ],
    T: [
        [0, 1, 0], 
        [1, 1, 1]
    ],
    L: [
        [1, 0], 
        [1, 0], 
        [1, 1]
    ],
    J: [
        [0, 1], 
        [0, 1], 
        [1, 1]
    ],
    S: [
        [0, 1, 1], 
        [1, 1, 0]
    ],
    Z: [
        [1, 1, 0], 
        [0, 1, 1]
    ]
};

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
    I: '#00FFFF',
    O: '#FFFF00',
    T: '#FF00FF',
    L: '#FF7F00',
    J: '#0000FF',
    S: '#00FF00',
    Z: '#FF0000'
};