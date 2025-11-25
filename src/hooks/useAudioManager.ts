// hooks/useAudioManager.ts
import { useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { useAudio } from '../context/AudioContext';

interface SoundFiles {
  background_music: any;
  move: any;
  rotate: any;
  hard_drop: any;
  line_clear: any;
  word_found: any;
  game_over: any;
  level_up: any;
  hold: any;
}

type SoundKey = keyof SoundFiles;

interface AudioManagerReturn {
  playSound: (soundName: SoundKey) => Promise<void>;
  playBackgroundMusic: () => Promise<void>;
  stopBackgroundMusic: () => Promise<void>;
}

export const useAudioManager = (): AudioManagerReturn => {
  const { audioSettings } = useAudio();
  const soundsRef = useRef<{ [key in SoundKey]?: Audio.Sound }>({});
  const backgroundMusicPlayingRef = useRef(false);

  // Звуковые файлы
  const soundFiles: SoundFiles = {
    background_music: require('../../assets/sounds/background.mp3'),
    move: require('../../assets/sounds/move.wav'),
    rotate: require('../../assets/sounds/rotate.wav'),
    hard_drop: require('../../assets/sounds/hard_drop.wav'),
    line_clear: require('../../assets/sounds/line_clear.mp3'),
    word_found: require('../../assets/sounds/move.wav'),
    game_over: require('../../assets/sounds/move.wav'),
    level_up: require('../../assets/sounds/move.wav'),
    hold: require('../../assets/sounds/move.wav'),
  };

  // Инициализация звуков при монтировании
  useEffect(() => {
    let isMounted = true;

    const initializeSounds = async (): Promise<void> => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        for (const [key, file] of Object.entries(soundFiles)) {
          if (isMounted) {
            try {
              const { sound } = await Audio.Sound.createAsync(file, {
                isLooping: false,
                progressUpdateIntervalMillis: 500,
              });
              soundsRef.current[key as SoundKey] = sound;
              console.log(`✅ Загружен звук: ${key}`);
            } catch (err) {
              console.error(`⚠️ Ошибка загрузки ${key}:`, err);
            }
          }
        }

        console.log('✅ Все звуки загружены');
      } catch (error) {
        console.error('❌ Ошибка инициализации аудио:', error);
      }
    };

    initializeSounds();

    return () => {
      isMounted = false;
      backgroundMusicPlayingRef.current = false;
      Object.values(soundsRef.current).forEach((sound: Audio.Sound | undefined) => {
        if (sound) {
          sound.stopAsync().catch(() => {
            // Игнорируем ошибки при остановке при размонтировании
          });
          sound.unloadAsync().catch(err => console.error('Error unloading sound:', err));
        }
      });
    };
  }, []);

  // Функция для воспроизведения звука
  const playSound = useCallback(
    async (soundName: SoundKey): Promise<void> => {
      if (!audioSettings.soundsEnabled) {
        console.log('🔇 Звуки отключены в настройках');
        return;
      }

      try {
        const sound = soundsRef.current[soundName];
        if (sound) {
          const volume = audioSettings.soundsVolume / 100;
          await sound.setVolumeAsync(volume);
          await sound.setPositionAsync(0);
          await sound.playAsync();
          console.log(`🔊 Воспроизводим звук: ${soundName}`);
        } else {
          console.warn(`⚠️ Звук не найден: ${soundName}`);
        }
      } catch (error) {
        console.error(`❌ Ошибка воспроизведения ${soundName}:`, error);
      }
    },
    [audioSettings.soundsEnabled, audioSettings.soundsVolume]
  );

  // ГЛАВНОЕ ИЗМЕНЕНИЕ - предотвращение дублирования
  const playBackgroundMusic = useCallback(async (): Promise<void> => {
    if (!audioSettings.musicEnabled) {
      console.log('🔇 Музыка отключена в настройках');
      return;
    }

    // Если музыка уже играет, не запускаем её снова!
    if (backgroundMusicPlayingRef.current) {
      console.log('⏸️ Музыка уже играет, не запускаем снова');
      return;
    }

    try {
      const sound = soundsRef.current['background_music'];
      if (sound) {
        // Останавливаем, если вдруг что-то было
        try {
          await sound.stopAsync();
        } catch (e) {
          // ignore
        }

        const volume = audioSettings.musicVolume / 100;
        await sound.setVolumeAsync(volume);
        await sound.setIsLoopingAsync(true);
        await sound.setPositionAsync(0); // С начала
        await sound.playAsync();
        backgroundMusicPlayingRef.current = true;
        console.log('🎵 Фоновая музыка запущена');
      }
    } catch (error) {
      console.error('❌ Ошибка воспроизведения фоновой музыки:', error);
      backgroundMusicPlayingRef.current = false;
    }
  }, [audioSettings.musicEnabled, audioSettings.musicVolume]);

  // Остановка фоновой музыки
  const stopBackgroundMusic = useCallback(async (): Promise<void> => {
    try {
      const sound = soundsRef.current['background_music'];
      if (sound) {
        // Проверяем, загружен ли звук перед остановкой
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.stopAsync();
          backgroundMusicPlayingRef.current = false;
          console.log('⏹️ Фоновая музыка остановлена');
        } else {
          console.log('ℹ️ Звук не загружен, пропускаем остановку');
          backgroundMusicPlayingRef.current = false;
        }
      }
    } catch (error) {
      // Игнорируем ошибку "Player does not exist" - это нормально
      if (error instanceof Error && error.message.includes('Player does not exist')) {
        console.log('ℹ️ Player уже удален, ошибка игнорирована');
        backgroundMusicPlayingRef.current = false;
      } else {
        console.error('❌ Ошибка остановки музыки:', error);
      }
    }
  }, []);

  useEffect(() => {
    const updateVolumes = async (): Promise<void> => {
      try {
        // Обновляем громкость всех звуков
        const soundsVolume = audioSettings.soundsVolume / 100;
        Object.values(soundsRef.current).forEach((sound: Audio.Sound | undefined) => {
          if (sound) {
            sound.setVolumeAsync(soundsVolume).catch(err => 
              console.error('Error updating sound volume:', err)
            );
          }
        });

        // Обновляем громкость музыки
        if (soundsRef.current['background_music']) {
          const musicVolume = audioSettings.musicVolume / 100;
          await soundsRef.current['background_music'].setVolumeAsync(musicVolume);
        }

        console.log('🔊 Громкость обновлена');
      } catch (error) {
        console.error('❌ Ошибка обновления громкости:', error);
      }
    };

    updateVolumes();
  }, [audioSettings.soundsVolume, audioSettings.musicVolume]);
  
  return {
    playSound,
    playBackgroundMusic,
    stopBackgroundMusic,
  };
};
