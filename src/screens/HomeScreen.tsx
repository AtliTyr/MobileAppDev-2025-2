// Экран приветствия/меню. Отсюда пользователь может начать игру и перейти к настройкам.
// Демонстрируем базовые UI-компоненты: Text, Button, View, TouchableOpacity.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Заголовок приложения */}
      <Text style={styles.title}>TETRIS</Text>

      {/* Кнопка начала игры. При нажатии переходим на экран Game */}
      <PrimaryButton
        title="Начать игру"
        onPress={() => {}}
      />
      {/* Кнопка настроек. При нажатии переходим на экран Settings */}
      <PrimaryButton
        title="Настройки"
        onPress={() => {}}
      />
      {/* Кнопка инструкций. При нажатии переходим на экран Instructions */}
      <PrimaryButton
        title="Инструкции"
        onPress={() => {}}
      />
      {/* Кнопка словаря. При нажатии переходим на экран Dictionary */}
      <PrimaryButton
        title="Словарь"
        onPress={() => {}}
      />
      <Text style={styles.footer}>Разработка: Лабораторная №3 — Управление ресурсами и использование хуков</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    fontSize: 12,
    color: '#666',
  },
});