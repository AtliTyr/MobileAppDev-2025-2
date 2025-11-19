// hooks/useAudioManager.ts
import { useCallback, useRef, useEffect, useState } from 'react';
import { Audio } from 'expo-av';

export type SoundType = 
  | 'background_music'
  | 'move'
  | 'rotate' 
  | 'hard_drop'
  | 'line_clear'
  | 'word_found'
  | 'game_over'
  | 'level_up'
  | 'hold';

// Тип для настроек аудио
export interface AudioSettings {
  musicEnabled: boolean;
  musicVolume: number;
  soundsEnabled: boolean;
  soundsVolume: number;
}

// Настройки по умолчанию
const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicEnabled: true,
  musicVolume: 0.7,
  soundsEnabled: true,
  soundsVolume: 0.8,
};

interface SoundConfig {
  [key: string]: {
    baseVolume: number;
    shouldLoop?: boolean;
    isMusic?: boolean;
  };
}

const SOUND_CONFIG: SoundConfig = {
  background_music: { baseVolume: 1.0, shouldLoop: true, isMusic: true },
  move: { baseVolume: 1.0, shouldLoop: false },
  rotate: { baseVolume: 1.0, shouldLoop: false },
  hard_drop: { baseVolume: 1.0, shouldLoop: false },
  line_clear: { baseVolume: 1.0, shouldLoop: false },
  word_found: { baseVolume: 1.0, shouldLoop: false },
  game_over: { baseVolume: 1.0, shouldLoop: false },
  level_up: { baseVolume: 1.0, shouldLoop: false },
  hold: { baseVolume: 1.0, shouldLoop: false },
};

export const useAudioManager = (initialSettings?: Partial<AudioSettings>) => {
  const sounds = useRef<Map<SoundType, Audio.Sound>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Состояние настроек
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    ...DEFAULT_AUDIO_SETTINGS,
    ...initialSettings,
  });

  // Обновление настроек
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setAudioSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Применяем изменения к уже загруженным звукам
      if (isLoaded) {
        applySettingsToSounds(updated);
      }
      
      return updated;
    });
  }, [isLoaded]);

  // Применение настроек к звукам
  const applySettingsToSounds = useCallback(async (settings: AudioSettings) => {
    for (const [soundType, sound] of sounds.current.entries()) {
      try {
        const config = SOUND_CONFIG[soundType];
        let volume = 0;

        if (config.isMusic) {
          // Для музыки учитываем включена ли музыка и её громкость
          volume = settings.musicEnabled ? settings.musicVolume * config.baseVolume : 0;
        } else {
          // Для звуков учитываем включены ли звуки и их громкость
          volume = settings.soundsEnabled ? settings.soundsVolume * config.baseVolume : 0;
        }

        await sound.setVolumeAsync(volume);
        
        // Если музыка выключена - останавливаем фоновую музыку
        if (config.isMusic && !settings.musicEnabled) {
          await sound.stopAsync();
        } else if (config.isMusic && settings.musicEnabled) {
          // Если музыка включена - воспроизводим
          await sound.playAsync();
        }
      } catch (error) {
        console.error(`❌ Ошибка применения настроек ${soundType}:`, error);
      }
    }
  }, []);

  // Загрузка всех звуков
  const loadSounds = useCallback(async () => {
    try {
      // Здесь будут URI ваших звуковых файлов
      const soundAssets = {
        background_music: require('../assets/sounds/background.mp3'),
        move: require('../assets/sounds/move.wav'),
        rotate: require('../assets/sounds/rotate.wav'),
        hard_drop: require('../assets/sounds/hard_drop.wav'),
        line_clear: require('../assets/sounds/line_clear.wav'),
        word_found: require('../assets/sounds/word_found.wav'),
        game_over: require('../assets/sounds/game_over.wav'),
        level_up: require('../assets/sounds/level_up.wav'),
        hold: require('../assets/sounds/hold.wav'),
      };

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      // Загружаем каждый звук
      for (const [soundType, source] of Object.entries(soundAssets)) {
        const { sound } = await Audio.Sound.createAsync(
          source,
          { 
            volume: 0, // Начинаем с 0, применим настройки после загрузки
            shouldPlay: false,
            isLooping: SOUND_CONFIG[soundType].shouldLoop,
          }
        );
        sounds.current.set(soundType as SoundType, sound);
      }

      setIsLoaded(true);
      
      // Применяем текущие настройки к загруженным звукам
      applySettingsToSounds(audioSettings);
      
      console.log('✅ Все звуки загружены и настроены');
    } catch (error) {
      console.error('❌ Ошибка загрузки звуков:', error);
    }
  }, [audioSettings, applySettingsToSounds]);

  // Воспроизведение звука с учетом настроек
  const playSound = useCallback(async (soundType: SoundType) => {
    if (!isLoaded) return;

    try {
      const sound = sounds.current.get(soundType);
      const config = SOUND_CONFIG[soundType];
      
      if (sound) {
        // Проверяем, можно ли воспроизводить этот звук
        if (config.isMusic && !audioSettings.musicEnabled) return;
        if (!config.isMusic && !audioSettings.soundsEnabled) return;
        
        await sound.replayAsync();
      }
    } catch (error) {
      console.error(`❌ Ошибка воспроизведения ${soundType}:`, error);
    }
  }, [isLoaded, audioSettings.musicEnabled, audioSettings.soundsEnabled]);

  // Остановка конкретного звука
  const stopSound = useCallback(async (soundType: SoundType) => {
    try {
      const sound = sounds.current.get(soundType);
      if (sound) {
        await sound.stopAsync();
      }
    } catch (error) {
      console.error(`❌ Ошибка остановки ${soundType}:`, error);
    }
  }, []);

  // Пауза всех звуков
  const pauseAll = useCallback(async () => {
    for (const [, sound] of sounds.current.entries()) {
      try {
        await sound.pauseAsync();
      } catch (error) {
        console.error('❌ Ошибка паузы звука:', error);
      }
    }
  }, []);

  // Возобновление всех звуков
  const resumeAll = useCallback(async () => {
    for (const [soundType, sound] of sounds.current.entries()) {
      try {
        const config = SOUND_CONFIG[soundType];
        
        // Воспроизводим только если разрешено настройками
        if (config.isMusic && audioSettings.musicEnabled) {
          await sound.playAsync();
        }
      } catch (error) {
        console.error('❌ Ошибка возобновления звука:', error);
      }
    }
  }, [audioSettings.musicEnabled]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_AUDIO_SETTINGS);
  }, [updateSettings]);

  // Получение текущих настроек для отображения
  const getSettingsForDisplay = useCallback(() => ({
    musicEnabled: audioSettings.musicEnabled,
    musicVolume: Math.round(audioSettings.musicVolume * 100),
    soundsEnabled: audioSettings.soundsEnabled,
    soundsVolume: Math.round(audioSettings.soundsVolume * 100),
  }), [audioSettings]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      sounds.current.forEach((sound, soundType) => {
        try {
          sound.stopAsync();
          sound.unloadAsync();
        } catch (error) {
          console.error(`❌ Ошибка очистки ${soundType}:`, error);
        }
      });
    };
  }, []);

  return {
    // Основные методы
    playSound,
    stopSound,
    pauseAll,
    resumeAll,
    loadSounds,
    
    // Управление настройками
    updateSettings,
    resetSettings,
    getSettingsForDisplay,
    
    // Состояние
    isLoaded,
    audioSettings,
  };
};