import type { WordData } from '../types/wordSets';
import type { GameState } from '../types/game';

/**
 * 🗑️ Удаляет буквы угаданного слова с доски и обрушает остальные буквы вниз
 * @param wordData - Угаданное слово (с текстом и id)
 * @param board - Текущее состояние доски
 * @returns Новая доска с удалёнными буквами
 */
export const removeLettersFromWord = (
  wordData: WordData,
  board: GameState['board']
): GameState['board'] => {
  console.log('🗑️ Удаляем буквы слова с доски:', wordData.word);

  const wordLetters = wordData.word.toUpperCase().split('');

  // Создаём копию доски
  let newBoard = board.map(row => [...row]);

  // Удаляем буквы слова (ищем по букве и удаляем первые N совпадений)
  let deletedCount = 0;
  for (let y = 0; y < newBoard.length && deletedCount < wordLetters.length; y++) {
    for (let x = 0; x < newBoard[y].length && deletedCount < wordLetters.length; x++) {
      const cell = newBoard[y][x];
      if (cell && cell.letter === wordLetters[deletedCount]) {
        newBoard[y][x] = null; // Удаляем ячейку
        deletedCount++;
      }
    }
  }

  console.log(`📊 Удалено ${deletedCount} из ${wordLetters.length} букв`);

  // Обрушаем остальные буквы вниз (как при очищении линий)
  // Проходим по каждой колонке и "сжимаем" вверх
  for (let x = 0; x < newBoard[0].length; x++) {
    const column: (typeof newBoard[0][0])[] = [];

    // Собираем все non-null элементы в колонке
    for (let y = 0; y < newBoard.length; y++) {
      if (newBoard[y][x] !== null) {
        column.push(newBoard[y][x]);
      }
    }

    // Добавляем null в начало (они падают вниз)
    while (column.length < newBoard.length) {
      column.unshift(null);
    }

    // Пишем обратно в доску
    for (let y = 0; y < newBoard.length; y++) {
      newBoard[y][x] = column[y];
    }
  }

  console.log('✅ Буквы удалены, остальные упали');
  return newBoard;
};
