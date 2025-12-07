// src/utils/textColor.ts
import type { TextStyle } from 'react-native';

// Подбираем цвет текста под фон клетки
export function getLetterStyleForColor(bg: string): TextStyle {
  const color = bg.toUpperCase();

  // "светлые" — лучше тёмный текст + светлая обводка
  const isWarmLight =
    color === '#FFFF00' || // жёлтый
    color === '#FF7F00' || // оранжевый
    color === '#00FFFF' || // циан
    color === '#00FF00';   // зелёный

  if (isWarmLight) {
    return {
      color: '#111111', // почти чёрный
      textShadowColor: 'rgba(255,255,255,0.9)', // тонкая светлая кайма
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 1.2,
    };
  }

  // остальные яркие (синий, красный, фиолетовый и т.п.):
  // белый текст + тёмная обводка
  return {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1.2,
  };
}
