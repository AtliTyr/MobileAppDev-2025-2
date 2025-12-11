import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AudioProvider } from './src/context/AudioContext';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';
import { GameState, GameConfig } from './src/types/game';
import { useAppStateListener } from './src/hooks/useAppStateListener';

export type RootStackParamList = {
  Home: undefined;
  Game:
    | {
        savedGameData?: {
          gameState: GameState;
          config: GameConfig;
          wordSetId?: string;
          currentTargetWord?: string | null;
          currentTargetId?: string | null;
        };
        wordSetId?: string;
        dailyWordId?: string;
        isDailyWordMode?: boolean;
      }
    | undefined;
  Instructions: undefined;
  Dictionary: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useAppStateListener(); 

  return (
    <AudioProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Instructions" component={InstructionsScreen} />
          <Stack.Screen name="Dictionary" component={DictionaryScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AudioProvider>
  );
}