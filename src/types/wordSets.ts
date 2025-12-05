// src/types/wordSets.ts
export type WordData = {
  id: string;
  word: string;
  translation: string;
  description: string;
};

export type WordSet = {
  id: string;
  name: string;
  description: string;
  totalWords: number;
  words: WordData[];
};

type FoundWordsBySet = {
  [setId: string]: string[]; // массив id открытых слов в этом наборе
};

export const STORAGE_SELECTED_SET_ID = 'selectedWordSetId';
export const STORAGE_FOUND_WORDS = 'foundWordsBySet';

export const builtInWordSets: WordSet[] = [
  {
    id: 'animals_ru',
    name: 'Животные',
    description: 'Короткие слова о животных',
    totalWords: 4,
    words: [
      { id: 'a1', word: 'КОТ',  translation: 'cat',  description: 'Домашнее животное, любит спать и мурлыкать.' },
      { id: 'a2', word: 'ПЁС',  translation: 'dog',  description: 'Верный друг человека.' },
      { id: 'a3', word: 'СОМ',  translation: 'catfish', description: 'Рыба с усами, живёт на дне.' },
      { id: 'a4', word: 'КРОТ', translation: 'mole', description: 'Живёт под землёй и почти не видит.' },
    ],
  },
  {
    id: 'food_ru',
    name: 'Еда',
    description: 'Базовые продукты питания',
    totalWords: 3,
    words: [
      { id: 'f1', word: 'ХЛЕБ',  translation: 'bread',  description: 'Основной продукт питания во многих странах.' },
      { id: 'f2', word: 'СЫР',   translation: 'cheese', description: 'Молочный продукт с разными вкусами и запахами.' },
      { id: 'f3', word: 'СУП',   translation: 'soup',   description: 'Горячее первое блюдо.' },
    ],
  },
  {
    id: 'school_ru',
    name: 'Школа',
    description: 'Слова из школьной тематики',
    totalWords: 3,
    words: [
      { id: 's1', word: 'КЛАСС',   translation: 'class',    description: 'Группа учеников и аудитория для занятий.' },
      { id: 's2', word: 'УРОК',    translation: 'lesson',   description: 'Отдельное занятие по предмету.' },
      { id: 's3', word: 'ТЕТРАДЬ', translation: 'notebook', description: 'Тетрадь для записей и домашних заданий.' },
    ],
  },
];
