import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AudioProvider } from './src/context/AudioContext';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Instructions: undefined;
  Dictionary: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AudioProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
          />
          <Stack.Screen
            name="Instructions"
            component={InstructionsScreen}
          />
          <Stack.Screen
            name="Dictionary"
            component={DictionaryScreen}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AudioProvider>
  );
}
