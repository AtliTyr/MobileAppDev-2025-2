// src/utils/celebration.ts
export type CelebrationType = 'tetris' | 'word' | null;

export type EmojiParticle = {
  id: number;
  char: string;
  side: 'left' | 'right';
  topPercent: number;
  offsetX: number;
  rotate: number;
};

const EMOJIS = ['🎉', '🎊', '✨', '🥳', '🪄', '⭐️'];

export function generateEmojiParticles(
  countPerSide: number = 8
): EmojiParticle[] {
  const particles: EmojiParticle[] = [];
  let id = 0;

  for (const side of ['left', 'right'] as const) {
    for (let i = 0; i < countPerSide; i++) {
      const char = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

      const topPercent = 10 + Math.random() * 80;

      // смещение ТОЛЬКО внутрь экрана
      const offsetX =
        side === 'left'
          ? 10 + Math.random() * 30   // 10–40 px вправо
          : -10 - Math.random() * 30; // 10–40 px влево

      const rotate = -25 + Math.random() * 50;

      particles.push({
        id: id++,
        char,
        side,
        topPercent,
        offsetX,
        rotate,
      });
    }
  }

  return particles;
}
