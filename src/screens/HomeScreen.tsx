import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useGameSave } from '../hooks/useGameSave';

export default function HomeScreen() {
  const { hasSavedGame, loadGame, deleteSave } = useGameSave();
  const [hasSave, setHasSave] = useState(false);

  // Проверяем наличие сохранения при загрузке экрана
  useEffect(() => {
    checkForSavedGame();
  }, []);

  const checkForSavedGame = async () => {
    const saved = await hasSavedGame();
    setHasSave(saved);
  };

  // Функция продолжения игры
  const handleContinueGame = async () => {
    const savedGame = await loadGame();
    if (savedGame) {
      // Добавим здесь переход через навигацию на экран игры и передаем сохраненное состояние
      // 
    } else {
      Alert.alert('Ошибка', 'Не удалось загрузить сохраненную игру');
      setHasSave(false);
    }
  };

  // Функция удаления сохранения
  const handleDeleteSave = () => {
    Alert.alert(
      'Удаление сохранения',
      'Вы уверены, что хотите удалить сохраненную игру?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: async () => {
            await deleteSave();
            setHasSave(false);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TETRIS</Text>

      {/* Кнопка продолжения игры (показывается только если есть сохранение) */}
      {hasSave && (
        <>
          <PrimaryButton
            title="Продолжить игру"
            onPress={handleContinueGame}
            style={styles.continueButton}
          />
          <PrimaryButton
            title="Удалить сохранение"
            onPress={handleDeleteSave}
            style={styles.deleteButton}
          />
        </>
      )}

      <PrimaryButton
        title="Новая игра"
        onPress={() => {}}
      />
      
      <PrimaryButton
        title="Настройки"
        onPress={() => {}}
      />
      
      <PrimaryButton
        title="Инструкции"
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
  continueButton: {
  },
  deleteButton: {
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    fontSize: 12,
    color: '#666',
  },
});