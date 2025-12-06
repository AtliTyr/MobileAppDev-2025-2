// utils/tetrominoFactory.ts

import {
  Tetromino,
  TetrominoType,
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
  Cell,
  LETTER_FREQUENCIES_RU,
  LETTER_FREQUENCIES_EN,
  LetterLanguage,
  LetterFrequency,
} from '../types/tetromino';

type TetrominoStats = Record<TetrominoType, number>;

const ALL_TYPES = Object.keys(TETROMINO_SHAPES) as TetrominoType[];

const INITIAL_STATS: TetrominoStats = {
  I: 0,
  O: 0,
  T: 0,
  L: 0,
  J: 0,
  S: 0,
  Z: 0,
};

let missStats: TetrominoStats = { ...INITIAL_STATS };

const chooseWeightedType = (): TetrominoType => {
  const weights = ALL_TYPES.map((t) => {
    const miss = missStats[t] ?? 0;
    return { type: t, weight: 1 + miss * (t === 'I' ? 0.2 : 0.3) };
  });
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    if (r < w.weight) return w.type;
    r -= w.weight;
  }
  return weights[weights.length - 1].type;
};

const getLetterFrequencies = (language: LetterLanguage): LetterFrequency[] =>
  language === 'en' ? LETTER_FREQUENCIES_EN : LETTER_FREQUENCIES_RU;

const generateBackgroundLetter = (baseFreq: LetterFrequency[]): string => {
  const weighted: { letter: string; weight: number }[] = baseFreq.map((f, index) => {
    const prevCum = index === 0 ? 0 : baseFreq[index - 1].cumulative;
    const baseWeight = f.cumulative - prevCum;
    return { letter: f.letter, weight: baseWeight };
  });
  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  let chosen = weighted[0].letter;
  for (const w of weighted) {
    if (r < w.weight) {
      chosen = w.letter;
      break;
    }
    r -= w.weight;
  }
  return chosen;
};

const generateTargetLetter = (targetLetters: string[]): string => {
  const normalized = targetLetters.map(ch => ch.toUpperCase()).filter(ch => ch.length > 0);
  if (normalized.length === 0) {
    return '?';
  }
  const idx = Math.floor(Math.random() * normalized.length);
  return normalized[idx];
};

const generateWeightedLetters = ({
  count,
  language,
  targetLetters,
}: {
  count: number;
  language: LetterLanguage;
  targetLetters?: string[];
}): string[] => {
  const baseFreq = getLetterFrequencies(language);

  if (!targetLetters || targetLetters.length === 0) {
    const letters: string[] = [];
    for (let i = 0; i < count; i++) {
      letters.push(generateBackgroundLetter(baseFreq));
    }
    return letters;
  }

  const normalizedTarget = targetLetters
    .map(ch => ch.toUpperCase())
    .filter(ch => baseFreq.some(f => f.letter === ch));

  if (normalizedTarget.length === 0) {
    const letters: string[] = [];
    for (let i = 0; i < count; i++) {
      letters.push(generateBackgroundLetter(baseFreq));
    }
    return letters;
  }

  const targetRatio = 0.5;
  const targetCount = Math.max(1, Math.floor(count * targetRatio));
  const backgroundCount = count - targetCount;
  const result: string[] = [];

  for (let i = 0; i < targetCount; i++) {
    result.push(generateTargetLetter(normalizedTarget));
  }
  for (let i = 0; i < backgroundCount; i++) {
    result.push(generateBackgroundLetter(baseFreq));
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export class TetrominoFactory {
  // ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ДЛЯ ЯЗЫКА
  private static currentLanguage: LetterLanguage = 'ru';
  
  // Метод для установки языка
  static setLanguage(language: LetterLanguage) {
    console.log('🌍 TetrominoFactory: устанавливаем язык =', language);
    this.currentLanguage = language;
  }
  
  // Метод для получения языка
  static getLanguage(): LetterLanguage {
    return this.currentLanguage;
  }

  static createMultiple(
    count: number,
    options?: { // Делаем options опциональным!
      targetWordLetters?: string[];
      buffMultiplier?: number;
    }
  ): Tetromino[] {
    // Всегда используем currentLanguage!
    const language = this.currentLanguage;
    
    console.log('🏭 TetrominoFactory.createMultiple: language =', language, 'count =', count);
    
    return Array(count).fill(null).map(() => 
      this.createRandom(undefined, { 
        language, // ← всегда из currentLanguage
        targetWordLetters: options?.targetWordLetters 
      })
    );
  }

  static createRandom(
    letters?: string[],
    options?: {
      language?: LetterLanguage; // Делаем опциональным
      targetWordLetters?: string[];
      buffMultiplier?: number;
    }
  ): Tetromino {
    // Всегда используем currentLanguage!
    const language = options?.language || this.currentLanguage;
    
    console.log('🏭 TetrominoFactory.createRandom: language =', language);
    
    const type = chooseWeightedType();

    ALL_TYPES.forEach((t) => {
      if (t === type) {
        missStats[t] = 0;
      } else {
        missStats[t] = (missStats[t] ?? 0) + 1;
      }
    });

    return this.create(type, letters, 3, 0, { 
      language, // ← всегда из currentLanguage
      targetWordLetters: options?.targetWordLetters 
    });
  }

  static create(
    type: TetrominoType,
    letters: string[] = [],
    startX: number = 3,
    startY: number = 0,
    options?: { // Делаем опциональным!
      language?: LetterLanguage;
      targetWordLetters?: string[];
      buffMultiplier?: number;
    }
  ): Tetromino {
    // Всегда используем currentLanguage!
    const language = options?.language || this.currentLanguage;
    
    console.log('🏭 TetrominoFactory.create: language =', language, 'type =', type);
    
    const shape = TETROMINO_SHAPES[type];
    const color = TETROMINO_COLORS[type];
    const effectiveStartY = type === 'I' ? -1 : startY;

    const finalLetters =
      letters.length > 0
        ? letters
        : generateWeightedLetters({
            count: this.countCells(shape),
            language, // ← всегда из currentLanguage
            targetLetters: options?.targetWordLetters,
          });

    console.log('🏭 Generated letters for', type, ':', finalLetters);

    const cells = this.createCellsFromShape(shape, finalLetters, color);

    return {
      cells,
      position: { x: startX, y: effectiveStartY },
      rotation: 0,
      type,
    };
  }

  static resetStats() {
    missStats = { ...INITIAL_STATS };
  }

  private static countCells(shape: number[][]): number {
    return shape.flat().filter((cell) => cell === 1).length;
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
            letter: letters[letterIndex++] ?? '',
            color,
            isEmpty: false,
          });
        } else {
          row.push({
            letter: '',
            color: '#000000',
            isEmpty: true,
          });
        }
      }
      cells.push(row);
    }
    return cells;
  }
}