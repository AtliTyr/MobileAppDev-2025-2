// src/context/AudioContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AudioSettings {
  musicEnabled: boolean;
  musicVolume: number;
  soundsEnabled: boolean;
  soundsVolume: number;
}

interface AudioContextType {
  audioSettings: AudioSettings;
  updateSettings: (settings: Partial<AudioSettings>) => void;
  resetSettings: () => void;
  getSettingsForDisplay: () => AudioSettings;
}

const defaultSettings: AudioSettings = {
  musicEnabled: true,
  musicVolume: 70,
  soundsEnabled: true,
  soundsVolume: 70,
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultSettings);

  const updateSettings = (settings: Partial<AudioSettings>): void => {
    setAudioSettings(prev => ({ ...prev, ...settings }));
  };

  const resetSettings = (): void => {
    setAudioSettings(defaultSettings);
  };

  const getSettingsForDisplay = (): AudioSettings => {
    return audioSettings;
  };

  const value: AudioContextType = {
    audioSettings,
    updateSettings,
    resetSettings,
    getSettingsForDisplay,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio должен быть использован внутри AudioProvider');
  }
  return context;
};
