// src/types/wordSets.ts

export type WordData = {
  id: string;
  word: string;
  translation: string;
  description: string;
};

export type WordSetLanguage = 'ru' | 'en';

export type WordSet = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  totalWords: number;
  words: WordData[];
  language: WordSetLanguage;
};

type FoundWordsBySet = {
  [setId: string]: string[]; // массив id открытых слов в этом наборе
};

export const STORAGE_SELECTED_SET_ID = 'selectedWordSetId';
export const STORAGE_FOUND_WORDS = 'foundWordsBySet';

export const builtInWordSets: WordSet[] = [
  // ========================================
  // 🇷🇺 РУССКИЕ НАБОРЫ
  // ========================================
  {
    id: 'animals_ru',
    name: 'Животные',
    description: 'Домашние и дикие животные',
    emoji: '🐾',
    totalWords: 15,
    language: 'ru',
    words: [
      { id: 'a1', word: 'КОТ', translation: 'cat', description: 'Домашнее животное, любит спать и мурлыкать' },
      { id: 'a2', word: 'ПЁС', translation: 'dog', description: 'Верный друг человека' },
      { id: 'a3', word: 'СОМ', translation: 'catfish', description: 'Рыба с усами, живёт на дне' },
      { id: 'a4', word: 'КРОТ', translation: 'mole', description: 'Живёт под землёй и почти не видит' },
      { id: 'a5', word: 'ЛИСА', translation: 'fox', description: 'Хитрое рыжее животное с пушистым хвостом' },
      { id: 'a6', word: 'ВОЛК', translation: 'wolf', description: 'Серый хищник, живёт в лесу' },
      { id: 'a7', word: 'МЕДВЕДЬ', translation: 'bear', description: 'Крупный хищник, любит мёд' },
      { id: 'a8', word: 'ЗАЯЦ', translation: 'hare', description: 'Быстрое ушастое животное' },
      { id: 'a9', word: 'БЕЛКА', translation: 'squirrel', description: 'Рыжий зверёк, живёт на деревьях' },
      { id: 'a10', word: 'ЁЖ', translation: 'hedgehog', description: 'Колючее животное, сворачивается в клубок' },
      { id: 'a11', word: 'МЫШЬ', translation: 'mouse', description: 'Маленький грызун с длинным хвостом' },
      { id: 'a12', word: 'КОРОВА', translation: 'cow', description: 'Даёт молоко' },
      { id: 'a13', word: 'ЛОШАДЬ', translation: 'horse', description: 'Быстрое животное для верховой езды' },
      { id: 'a14', word: 'СВИНЬЯ', translation: 'pig', description: 'Розовое домашнее животное' },
      { id: 'a15', word: 'КУРИЦА', translation: 'chicken', description: 'Несёт яйца' },
    ],
  },
  {
    id: 'food_ru',
    name: 'Еда',
    description: 'Продукты и блюда',
    emoji: '🍽️',
    totalWords: 15,
    language: 'ru',
    words: [
      { id: 'f1', word: 'ХЛЕБ', translation: 'bread', description: 'Основной продукт питания' },
      { id: 'f2', word: 'СЫР', translation: 'cheese', description: 'Молочный продукт с разными вкусами' },
      { id: 'f3', word: 'СУП', translation: 'soup', description: 'Горячее первое блюдо' },
      { id: 'f4', word: 'КАША', translation: 'porridge', description: 'Варится из крупы' },
      { id: 'f5', word: 'МЯСО', translation: 'meat', description: 'Продукт животного происхождения' },
      { id: 'f6', word: 'РЫБА', translation: 'fish', description: 'Водное существо, богато белком' },
      { id: 'f7', word: 'МОЛОКО', translation: 'milk', description: 'Белая питательная жидкость' },
      { id: 'f8', word: 'МАСЛО', translation: 'butter', description: 'Жирный молочный продукт' },
      { id: 'f9', word: 'ЯЙЦО', translation: 'egg', description: 'Продукт от курицы' },
      { id: 'f10', word: 'ОВОЩИ', translation: 'vegetables', description: 'Растительная пища' },
      { id: 'f11', word: 'ФРУКТЫ', translation: 'fruits', description: 'Сладкие плоды растений' },
      { id: 'f12', word: 'САХАР', translation: 'sugar', description: 'Сладкая приправа' },
      { id: 'f13', word: 'СОЛЬ', translation: 'salt', description: 'Солёная приправа' },
      { id: 'f14', word: 'ЧАЙ', translation: 'tea', description: 'Горячий напиток' },
      { id: 'f15', word: 'КОФЕ', translation: 'coffee', description: 'Бодрящий напиток' },
    ],
  },
  {
    id: 'nature_ru',
    name: 'Природа',
    description: 'Растения и явления природы',
    emoji: '🌿',
    totalWords: 15,
    language: 'ru',
    words: [
      { id: 'n1', word: 'ДЕРЕВО', translation: 'tree', description: 'Высокое растение с листьями' },
      { id: 'n2', word: 'ЦВЕТОК', translation: 'flower', description: 'Красивое растение с лепестками' },
      { id: 'n3', word: 'ТРАВА', translation: 'grass', description: 'Зелёный покров земли' },
      { id: 'n4', word: 'ЛИСТ', translation: 'leaf', description: 'Часть дерева или растения' },
      { id: 'n5', word: 'РОЗА', translation: 'rose', description: 'Красивый цветок с шипами' },
      { id: 'n6', word: 'БЕРЁЗА', translation: 'birch', description: 'Дерево с белой корой' },
      { id: 'n7', word: 'ДУБ', translation: 'oak', description: 'Мощное дерево с желудями' },
      { id: 'n8', word: 'СОСНА', translation: 'pine', description: 'Хвойное дерево' },
      { id: 'n9', word: 'РЕКА', translation: 'river', description: 'Поток воды' },
      { id: 'n10', word: 'ОЗЕРО', translation: 'lake', description: 'Водоём с пресной водой' },
      { id: 'n11', word: 'ГОРА', translation: 'mountain', description: 'Высокое возвышение' },
      { id: 'n12', word: 'НЕБО', translation: 'sky', description: 'Пространство над землёй' },
      { id: 'n13', word: 'ОБЛАКО', translation: 'cloud', description: 'Белое скопление в небе' },
      { id: 'n14', word: 'ДОЖДЬ', translation: 'rain', description: 'Вода падает с неба' },
      { id: 'n15', word: 'СНЕГ', translation: 'snow', description: 'Белые хлопья зимой' },
    ],
  },
  {
    id: 'home_ru',
    name: 'Дом',
    description: 'Предметы быта',
    emoji: '🏠',
    totalWords: 15,
    language: 'ru',
    words: [
      { id: 'h1', word: 'СТОЛ', translation: 'table', description: 'Мебель для еды и работы' },
      { id: 'h2', word: 'СТУЛ', translation: 'chair', description: 'Мебель для сидения' },
      { id: 'h3', word: 'КРОВАТЬ', translation: 'bed', description: 'Мебель для сна' },
      { id: 'h4', word: 'ДИВАН', translation: 'sofa', description: 'Мягкая мебель для отдыха' },
      { id: 'h5', word: 'ШКАФ', translation: 'wardrobe', description: 'Мебель для одежды' },
      { id: 'h6', word: 'ОКНО', translation: 'window', description: 'Проём в стене для света' },
      { id: 'h7', word: 'ДВЕРЬ', translation: 'door', description: 'Вход в комнату' },
      { id: 'h8', word: 'ЛАМПА', translation: 'lamp', description: 'Источник света' },
      { id: 'h9', word: 'ЗЕРКАЛО', translation: 'mirror', description: 'Отражает изображение' },
      { id: 'h10', word: 'КОВЁР', translation: 'carpet', description: 'Покрытие на полу' },
      { id: 'h11', word: 'ПОЛКА', translation: 'shelf', description: 'Для хранения вещей' },
      { id: 'h12', word: 'ЧАСЫ', translation: 'clock', description: 'Показывают время' },
      { id: 'h13', word: 'КНИГА', translation: 'book', description: 'Для чтения' },
      { id: 'h14', word: 'ТЕЛЕФОН', translation: 'phone', description: 'Средство связи' },
      { id: 'h15', word: 'ТЕЛЕВИЗОР', translation: 'TV', description: 'Для просмотра программ' },
    ],
  },
  {
    id: 'school_ru',
    name: 'Школа',
    description: 'Учебные предметы',
    emoji: '📚',
    totalWords: 15,
    language: 'ru',
    words: [
      { id: 's1', word: 'УРОК', translation: 'lesson', description: 'Занятие по предмету' },
      { id: 's2', word: 'КЛАСС', translation: 'class', description: 'Группа учеников' },
      { id: 's3', word: 'ТЕТРАДЬ', translation: 'notebook', description: 'Для записей' },
      { id: 's4', word: 'РУЧКА', translation: 'pen', description: 'Для письма' },
      { id: 's5', word: 'КАРАНДАШ', translation: 'pencil', description: 'Для рисования' },
      { id: 's6', word: 'ДОСКА', translation: 'board', description: 'Для объяснений' },
      { id: 's7', word: 'УЧЕБНИК', translation: 'textbook', description: 'Книга для учёбы' },
      { id: 's8', word: 'ПАРТА', translation: 'desk', description: 'Стол ученика' },
      { id: 's9', word: 'УЧИТЕЛЬ', translation: 'teacher', description: 'Преподаватель' },
      { id: 's10', word: 'УЧЕНИК', translation: 'student', description: 'Учащийся' },
      { id: 's11', word: 'ЭКЗАМЕН', translation: 'exam', description: 'Проверка знаний' },
      { id: 's12', word: 'ЗАДАЧА', translation: 'task', description: 'Упражнение' },
      { id: 's13', word: 'ОЦЕНКА', translation: 'grade', description: 'Балл за работу' },
      { id: 's14', word: 'ПЕРЕМЕНА', translation: 'break', description: 'Отдых между уроками' },
      { id: 's15', word: 'ПОРТФЕЛЬ', translation: 'backpack', description: 'Сумка для учебников' },
    ],
  },

  // ========================================
  // 🇬🇧 АНГЛИЙСКИЕ НАБОРЫ
  // ========================================
  {
    id: 'animals_en',
    name: 'Animals',
    description: 'Domestic and wild animals',
    emoji: '🦁',
    totalWords: 15,
    language: 'en',
    words: [
      { id: 'ae1', word: 'CAT', translation: 'кошка', description: 'A furry pet that purrs' },
      { id: 'ae2', word: 'DOG', translation: 'собака', description: 'Man\'s best friend' },
      { id: 'ae3', word: 'LION', translation: 'лев', description: 'King of the jungle' },
      { id: 'ae4', word: 'TIGER', translation: 'тигр', description: 'Striped wild cat' },
      { id: 'ae5', word: 'BEAR', translation: 'медведь', description: 'Large furry animal' },
      { id: 'ae6', word: 'WOLF', translation: 'волк', description: 'Wild canine' },
      { id: 'ae7', word: 'FOX', translation: 'лиса', description: 'Cunning red animal' },
      { id: 'ae8', word: 'RABBIT', translation: 'кролик', description: 'Fluffy animal with long ears' },
      { id: 'ae9', word: 'MOUSE', translation: 'мышь', description: 'Small rodent' },
      { id: 'ae10', word: 'ELEPHANT', translation: 'слон', description: 'Largest land animal' },
      { id: 'ae11', word: 'MONKEY', translation: 'обезьяна', description: 'Climbs trees' },
      { id: 'ae12', word: 'SNAKE', translation: 'змея', description: 'Long reptile' },
      { id: 'ae13', word: 'BIRD', translation: 'птица', description: 'Can fly' },
      { id: 'ae14', word: 'FISH', translation: 'рыба', description: 'Lives in water' },
      { id: 'ae15', word: 'HORSE', translation: 'лошадь', description: 'Used for riding' },
    ],
  },
  {
    id: 'food_en',
    name: 'Food',
    description: 'Common foods and drinks',
    emoji: '🍕',
    totalWords: 15,
    language: 'en',
    words: [
      { id: 'fe1', word: 'BREAD', translation: 'хлеб', description: 'Basic food item' },
      { id: 'fe2', word: 'MILK', translation: 'молоко', description: 'White drink from cows' },
      { id: 'fe3', word: 'CHEESE', translation: 'сыр', description: 'Made from milk' },
      { id: 'fe4', word: 'APPLE', translation: 'яблоко', description: 'Red or green fruit' },
      { id: 'fe5', word: 'BANANA', translation: 'банан', description: 'Yellow fruit' },
      { id: 'fe6', word: 'ORANGE', translation: 'апельсин', description: 'Citrus fruit' },
      { id: 'fe7', word: 'CARROT', translation: 'морковь', description: 'Orange vegetable' },
      { id: 'fe8', word: 'POTATO', translation: 'картофель', description: 'Underground vegetable' },
      { id: 'fe9', word: 'TOMATO', translation: 'помидор', description: 'Red vegetable' },
      { id: 'fe10', word: 'RICE', translation: 'рис', description: 'Asian grain' },
      { id: 'fe11', word: 'PASTA', translation: 'макароны', description: 'Italian noodles' },
      { id: 'fe12', word: 'PIZZA', translation: 'пицца', description: 'Italian dish' },
      { id: 'fe13', word: 'COFFEE', translation: 'кофе', description: 'Hot energizing drink' },
      { id: 'fe14', word: 'TEA', translation: 'чай', description: 'Hot beverage' },
      { id: 'fe15', word: 'WATER', translation: 'вода', description: 'Essential liquid' },
    ],
  },
  {
    id: 'colors_en',
    name: 'Colors',
    description: 'Basic colors',
    emoji: '🎨',
    totalWords: 12,
    language: 'en',
    words: [
      { id: 'ce1', word: 'RED', translation: 'красный', description: 'Color of blood' },
      { id: 'ce2', word: 'BLUE', translation: 'синий', description: 'Color of sky' },
      { id: 'ce3', word: 'GREEN', translation: 'зелёный', description: 'Color of grass' },
      { id: 'ce4', word: 'YELLOW', translation: 'жёлтый', description: 'Color of sun' },
      { id: 'ce5', word: 'BLACK', translation: 'чёрный', description: 'Darkest color' },
      { id: 'ce6', word: 'WHITE', translation: 'белый', description: 'Lightest color' },
      { id: 'ce7', word: 'PINK', translation: 'розовый', description: 'Light red' },
      { id: 'ce8', word: 'ORANGE', translation: 'оранжевый', description: 'Mix of red and yellow' },
      { id: 'ce9', word: 'PURPLE', translation: 'фиолетовый', description: 'Mix of red and blue' },
      { id: 'ce10', word: 'BROWN', translation: 'коричневый', description: 'Color of wood' },
      { id: 'ce11', word: 'GRAY', translation: 'серый', description: 'Mix of black and white' },
      { id: 'ce12', word: 'GOLD', translation: 'золотой', description: 'Shiny yellow' },
    ],
  },
  {
    id: 'body_en',
    name: 'Body Parts',
    description: 'Parts of human body',
    emoji: '👤',
    totalWords: 15,
    language: 'en',
    words: [
      { id: 'be1', word: 'HEAD', translation: 'голова', description: 'Top of body' },
      { id: 'be2', word: 'FACE', translation: 'лицо', description: 'Front of head' },
      { id: 'be3', word: 'EYE', translation: 'глаз', description: 'For seeing' },
      { id: 'be4', word: 'EAR', translation: 'ухо', description: 'For hearing' },
      { id: 'be5', word: 'NOSE', translation: 'нос', description: 'For smelling' },
      { id: 'be6', word: 'MOUTH', translation: 'рот', description: 'For eating and speaking' },
      { id: 'be7', word: 'TOOTH', translation: 'зуб', description: 'For chewing' },
      { id: 'be8', word: 'HAND', translation: 'рука', description: 'For holding' },
      { id: 'be9', word: 'FINGER', translation: 'палец', description: 'Part of hand' },
      { id: 'be10', word: 'LEG', translation: 'нога', description: 'For walking' },
      { id: 'be11', word: 'FOOT', translation: 'стопа', description: 'End of leg' },
      { id: 'be12', word: 'ARM', translation: 'рука', description: 'Upper limb' },
      { id: 'be13', word: 'BACK', translation: 'спина', description: 'Rear of body' },
      { id: 'be14', word: 'HEART', translation: 'сердце', description: 'Pumps blood' },
      { id: 'be15', word: 'BRAIN', translation: 'мозг', description: 'For thinking' },
    ],
  },
  {
    id: 'weather_en',
    name: 'Weather',
    description: 'Weather conditions',
    emoji: '⛅',
    totalWords: 12,
    language: 'en',
    words: [
      { id: 'we1', word: 'SUN', translation: 'солнце', description: 'Star in the sky' },
      { id: 'we2', word: 'RAIN', translation: 'дождь', description: 'Water falling from sky' },
      { id: 'we3', word: 'SNOW', translation: 'снег', description: 'Frozen precipitation' },
      { id: 'we4', word: 'WIND', translation: 'ветер', description: 'Moving air' },
      { id: 'we5', word: 'CLOUD', translation: 'облако', description: 'Floating water vapor' },
      { id: 'we6', word: 'STORM', translation: 'буря', description: 'Severe weather' },
      { id: 'we7', word: 'FOG', translation: 'туман', description: 'Thick mist' },
      { id: 'we8', word: 'ICE', translation: 'лёд', description: 'Frozen water' },
      { id: 'we9', word: 'THUNDER', translation: 'гром', description: 'Loud sound in storm' },
      { id: 'we10', word: 'RAINBOW', translation: 'радуга', description: 'Colorful arc in sky' },
      { id: 'we11', word: 'SUMMER', translation: 'лето', description: 'Hottest season' },
      { id: 'we12', word: 'WINTER', translation: 'зима', description: 'Coldest season' },
    ],
  },
];
