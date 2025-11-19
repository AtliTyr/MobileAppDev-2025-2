// contexts/AudioContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioManager } from '../hooks/useAudioManager';

// Создаем тип для контекста
type AudioContextType = ReturnType<typeof useAudioManager>;

const AudioContext = createContext<AudioContextType | null>(null);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioManager = useAudioManager();
  
  return (
    <AudioContext.Provider value={audioManager}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};