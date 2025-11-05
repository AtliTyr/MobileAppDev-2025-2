// Точка входа приложения. Здесь в будущем будет настраивать главный стек навигации.

import React from 'react';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
// Экспортируем главный компонент приложения.
export default function App() {
  return (
    // <HomeScreen/>
    <GameScreen/>
    // <InstructionsScreen/>
    // <SettingsScreen/>
  );
}