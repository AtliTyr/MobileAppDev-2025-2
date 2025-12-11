/**
 * AudioContext.tsx - Контекст для управления аудио настройками
 * 
 * Этот файл предоставляет глобальное управление аудиопараметрами приложения,
 * позволяя любому компоненту получать и обновлять настройки музыки и звуков.
 * 
 * Основные компоненты:
 * - AudioSettings: интерфейс для хранения настроек
 * - AudioProvider: поставщик контекста
 * - useAudio(): кастомный хук для использования контекста
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// ========================================
// ИНТЕРФЕЙСЫ И ТИПЫ
// ========================================

/**
 * AudioSettings - интерфейс для хранения всех аудио параметров
 * 
 * @property musicEnabled - включена ли фоновая музыка (true/false)
 * @property musicVolume - громкость музыки в диапазоне 0-100
 * @property soundsEnabled - включены ли звуки эффектов (true/false)
 * @property soundsVolume - громкость звуков в диапазоне 0-100
 */
interface AudioSettings {
  musicEnabled: boolean;      // Включена ли музыка
  musicVolume: number;        // Громкость музыки (0-100)
  soundsEnabled: boolean;     // Включены ли звуки
  soundsVolume: number;       // Громкость звуков (0-100)
}

/**
 * AudioContextType - интерфейс для контекста
 * 
 * Определяет доступные методы и состояние для работы с аудио настройками
 */
interface AudioContextType {
  audioSettings: AudioSettings;
  updateSettings: (settings: Partial<AudioSettings>) => void;
  resetSettings: () => void;
  getSettingsForDisplay: () => AudioSettings;
  getDefaultSettings: () => AudioSettings;
}

// ========================================
// ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
// ========================================

/**
 * Настройки аудио по умолчанию
 * 
 * Используются при первом запуске приложения и при сбросе настроек
 * - Музыка включена на 70%
 * - Звуки включены на 70%
 */
const defaultSettings: AudioSettings = {
  musicEnabled: true,      // Музыка включена по умолчанию
  musicVolume: 70,         // Средняя громкость для музыки
  soundsEnabled: true,     // Звуки включены по умолчанию
  soundsVolume: 70,        // Средняя громкость для звуков
};

// ========================================
// СОЗДАНИЕ КОНТЕКСТА
// ========================================

/**
 * AudioContext - React контекст для хранения аудио состояния
 * 
 * Инициализируется как undefined и заполняется AudioProvider
 */
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// ========================================
// ПРОВАЙДЕР КОНТЕКСТА
// ========================================

/**
 * AudioProvider - компонент-провайдер для предоставления аудио контекста
 * 
 * Обёртывает приложение и делает audioSettings доступными везде через useAudio()
 * 
 * Использование:
 * ```tsx
 * <AudioProvider>
 *   <App />
 * </AudioProvider>
 * ```
 */
export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ========================================
  // СОСТОЯНИЕ
  // ========================================

  /**
   * audioSettings - текущие аудио параметры
   * 
   * Инициализируется со значениями по умолчанию
   * Обновляется через updateSettings() или resetSettings()
   */
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultSettings);

  // ========================================
  // МЕТОДЫ ОБНОВЛЕНИЯ
  // ========================================

  /**
   * updateSettings - обновляет любые параметры аудио
   * 
   * Работает как слияние (merge): обновляет только переданные поля,
   * остальные сохраняются без изменений
   * 
   * @param settings - объект с полями для обновления
   * 
   * @example
   * updateSettings({ musicVolume: 50 })    // Изменить только громкость музыки
   * updateSettings({ musicEnabled: false }) // Отключить только музыку
   */
  const updateSettings = (settings: Partial<AudioSettings>): void => {
    setAudioSettings(prev => ({ ...prev, ...settings }));
  };

  /**
   * resetSettings - возвращает все параметры к значениям по умолчанию
   * 
   * Используется кнопкой "Сброс настроек" в SettingsScreen
   */
  const resetSettings = (): void => {
    setAudioSettings(defaultSettings);
  };

  /**
   * getSettingsForDisplay - получает текущие настройки для отображения
   * 
   * Возвращает копию текущих настроек
   * Используется для обновления отображения в UI
   * 
   * @returns текущие audioSettings
   */
  const getSettingsForDisplay = (): AudioSettings => {
    return audioSettings;
  };

  // ========================================
  // ОБЪЕКТ ЗНАЧЕНИЯ КОНТЕКСТА
  // ========================================

  /**
   * value - объект со всеми методами и состоянием для контекста
   * 
   * Передаётся через value в Provider
   */
  const getDefaultSettings = (): AudioSettings => defaultSettings;

  const value: AudioContextType = {
    audioSettings,
    updateSettings,
    resetSettings,
    getSettingsForDisplay,
    getDefaultSettings,
  };

  // ========================================
  // ВОЗВРАЩАЕМОЕ ЗНАЧЕНИЕ
  // ========================================

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

// ========================================
// КАСТОМНЫЙ ХУК USEAUDIO
// ========================================

/**
 * useAudio - кастомный хук для использования AudioContext
 * 
 * Позволяет любому компоненту получить доступ к аудио контексту
 * ВАЖНО: компонент должен быть обёрнут в AudioProvider
 * 
 * @returns объект с методами и состоянием контекста
 * 
 * @throws Error если хук используется вне AudioProvider
 * 
 * @example
 * ```tsx
 * const { audioSettings, updateSettings } = useAudio();
 * 
 * // Получить текущую громкость музыки
 * console.log(audioSettings.musicVolume);
 * 
 * // Изменить громкость
 * updateSettings({ musicVolume: 80 });
 * ```
 */
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  
  // ========================================
  // ПРОВЕРКА НАЛИЧИЯ ПРОВАЙДЕРА
  // ========================================

  /**
   * Если контекст undefined, значит хук используется вне AudioProvider
   * Выбрасываем ошибку с понятным сообщением
   */
  if (context === undefined) {
    throw new Error(
      'useAudio должен быть использован внутри AudioProvider. ' +
      'Оберните приложение в <AudioProvider> в файле App.tsx'
    );
  }

  return context;
};
