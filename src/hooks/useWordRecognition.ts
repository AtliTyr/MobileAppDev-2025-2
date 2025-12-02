import { useState, useCallback } from 'react';

export interface LetterPosition {
  x: number;
  y: number;
  letter: string;
}

interface BoardCell {
  letter: string;
  tetrominoId: string | null;
}

type Board = BoardCell[][];

export const useWordRecognition = (board: Board) => {
  const [path, setPath] = useState<LetterPosition[]>([]);

  /**
   * Проверяет соседство двух позиций (без диагоналей)
   * Только соседи: (1,0), (0,1), (-1,0), (0,-1)
   */
  const isAdjacent = useCallback((pos1: LetterPosition, pos2: LetterPosition): boolean => {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);

    // Только соседи по горизонтали или вертикали
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }, []);

  /**
   * Проверяет что буква не использована дважды в пути
   */
  const isNotDuplicate = useCallback((newPos: { x: number; y: number }): boolean => {
    return !path.some(p => p.x === newPos.x && p.y === newPos.y);
  }, [path]);

  /**
   * Получает букву с доски по координатам
   */
  const getLetterAt = useCallback(
    (x: number, y: number): string | null => {
      if (y < 0 || y >= board.length || x < 0 || x >= board[y].length) {
        return null;
      }
      return board[y][x]?.letter || null;
    },
    [board]
  );

  // Начинает путь и возвращает НОВЫЙ путь
  const startPath = useCallback(
    (x: number, y: number): LetterPosition[] => {
      const letter = getLetterAt(x, y);
      if (!letter) return [];

      const newPath = [{ x, y, letter }];
      setPath(newPath);
      console.log(`🔤 Путь начинается с: ${letter} (${x}, ${y})`);
      return newPath;
    },
    [getLetterAt]
  );

  // Добавляет букву и возвращает НОВЫЙ путь (или null)
  const addToPath = useCallback(
    (x: number, y: number): LetterPosition[] | null => {
      if (path.length === 0) return null;

      const newPos = { x, y };
      const letter = getLetterAt(x, y);
      if (!letter) return null;

      if (!isNotDuplicate(newPos)) {
        console.log(`⚠️ Буква ${letter} уже использована`);
        return null;
      }

      const lastPos = path[path.length - 1];
      if (!isAdjacent(lastPos, { x, y, letter })) {
        console.log(`⚠️ ${letter} не является соседом ${lastPos.letter}`);
        return null;
      }

      const newPath = [...path, { x, y, letter }];
      setPath(newPath);
      console.log(
        `✅ Добавлена буква ${letter} (${x}, ${y}) | Путь: ${
          path.map(p => p.letter).join('-') + '-' + letter
        }`
      );
      return newPath;
    },
    [path, getLetterAt, isNotDuplicate, isAdjacent]
  );

  /**
   * Получает текущий путь
   */
  const getPath = useCallback(() => {
    return [...path];
  }, [path]);

  /**
   * Получает составленное слово из пути
   */
  const getWord = useCallback(() => {
    return path.map(p => p.letter).join('');
  }, [path]);

  /**
   * Очищает путь
   */
  const clearPath = useCallback(() => {
    setPath([]);
    console.log('🗑️ Путь очищен');
  }, []);

  return {
    startPath,
    addToPath,
    getPath,
    getWord,
    clearPath,
    pathLength: path.length,
  };
};
