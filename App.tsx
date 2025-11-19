// Точка входа приложения. Здесь в будущем будет настраивать главный стек навигации.

import React from 'react';
import { AudioProvider } from './src/context/AudioContext';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';

// Экспортируем главный компонент приложения.
export default function App() {
  return (
    <AudioProvider>
      {/* <GameScreen/> */}
      {/* <HomeScreen/> */}
      {/* <InstructionsScreen/> */}
      {/* <DictionaryScreen /> */}
      <SettingsScreen/>
    </AudioProvider>
  );
}