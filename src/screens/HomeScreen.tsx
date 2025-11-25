// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { hasSavedGame, clearSavedGame, loadGame } = useGamePersistence();
  const [savedGameExists, setSavedGameExists] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  // Проверяем наличие сохранения каждый раз, когда возвращаемся на HomeScreen
  useFocusEffect(
    React.useCallback(() => {
      const checkSave = async () => {
        const exists = await hasSavedGame();
        setSavedGameExists(exists);
      };
      checkSave();
    }, [hasSavedGame])
  );

  const handleNewGame = () => {
    if (savedGameExists) {
      setShowNewGameConfirm(true);
    } else {
      navigation.navigate('Game');
    }
  };

  const handleConfirmNewGame = async () => {
    await clearSavedGame();
    setShowNewGameConfirm(false);
    navigation.navigate('Game');
  };

  const handleContinueGame = async () => {
    const loadedData = await loadGame();
    if (loadedData) {
      // Передаём загруженное состояние на GameScreen
      navigation.navigate('Game', { savedGameData: loadedData });
    }
  };

  return (
    <View style={styles.container}>
      {/* Заголовок приложения */}
      <Text style={styles.title}>🎮 WORDTETRIS</Text>

      {/* Кнопка продолжить (видна только если есть сохранение) */}
      {savedGameExists && (
        <PrimaryButton
          title="🔄 ПРОДОЛЖИТЬ ИГРУ"
          onPress={handleContinueGame}
        />
      )}

      {/* Кнопка начала новой игры */}
      <PrimaryButton
        title="🎮 НОВАЯ ИГРА"
        onPress={handleNewGame}
      />

      {/* Кнопка инструкций */}
      <PrimaryButton
        title="📜 ИНСТРУКЦИИ"
        onPress={() => navigation.navigate('Instructions')}
      />

      {/* Кнопка словаря */}
      <PrimaryButton
        title="📚 СЛОВАРЬ"
        onPress={() => navigation.navigate('Dictionary')}
      />

      {/* Кнопка настроек */}
      <PrimaryButton
        title="⚙️ НАСТРОЙКИ"
        onPress={() => navigation.navigate('Settings')}
      />

      <Text style={styles.footer}>
        Разработка: Лабораторная №3 — Управление ресурсами и использование хуков
      </Text>

      {/* Modal подтверждения новой игры */}
      <Modal
        visible={showNewGameConfirm}
        transparent={true}
        animationType="fade"
      >
        <View style={confirmModal.overlay}>
          <View style={confirmModal.container}>
            <Text style={confirmModal.title}>⚠️ Внимание!</Text>
            <Text style={confirmModal.message}>
              Существующее сохранение будет потеряно. Вы уверены?
            </Text>

            <TouchableOpacity
              style={confirmModal.button}
              onPress={handleConfirmNewGame}
            >
              <Text style={confirmModal.buttonText}>НАЧАТЬ ЗАНОВО</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={confirmModal.cancelButton}
              onPress={() => setShowNewGameConfirm(false)}
            >
              <Text style={confirmModal.cancelButtonText}>ОТМЕНА</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

const confirmModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 280,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 5,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelButton: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    minWidth: 220,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
