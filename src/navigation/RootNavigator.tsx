// Здесь настраиваем навигацию между экранами приложения (Home, Game и т.д.)
// Используем Native Stack (легковесный стек навигации).

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import SettingsScreen from '../screens/SettingsScreen';
import InstructionsScreen from '../screens/InstructionsScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Settings: undefined;
  Instructions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, // полностью отключаем верхний заголовок
        gestureEnabled: true, // свайп-назад остаётся активным
      }}
    >
      {/* Экран главного меню */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      {/* Экран игры */}
      <Stack.Screen
        name="Game"
        component={GameScreen}
      />
      {/* Экран настроек */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />
      {/* Экран инструкций */}
      <Stack.Screen
        name="Instructions"
        component={InstructionsScreen}
      />      
    </Stack.Navigator>
  );
}
