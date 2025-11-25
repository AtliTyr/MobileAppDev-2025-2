import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Заголовок приложения */}
      <Text style={styles.title}>🎮 WORDTETRIS</Text>

      {/* Кнопка начала игры. При нажатии переходим на экран Game */}
      <PrimaryButton
        title="🎮 Начать игру"
        onPress={() => navigation.navigate('Game')}
      />

      {/* Кнопка инструкций. При нажатии переходим на экран Instructions */}
      <PrimaryButton
        title="📜 Инструкции"
        onPress={() => navigation.navigate('Instructions')}
      />

      {/* Кнопка словаря. При нажатии переходим на экран Dictionary */}
      <PrimaryButton
        title="📚 Словарь"
        onPress={() => navigation.navigate('Dictionary')}
      />

      {/* Кнопка настроек. При нажатии переходим на экран Settings */}
      <PrimaryButton
        title="⚙️ Настройки"
        onPress={() => navigation.navigate('Settings')}
      />

      <Text style={styles.footer}>
        Разработка: Лабораторная №3 — Управление ресурсами и использование хуков
      </Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    fontSize: 12,
    color: '#666',
  },
});
