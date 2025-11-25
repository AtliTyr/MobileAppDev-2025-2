// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ImageBackground } from 'react-native';
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
      navigation.navigate('Game', { savedGameData: loadedData });
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/home_background.png')}
      style={styles.backgroundImage}
      imageStyle={styles.imageStyle}
    >
      <View style={styles.container}>
        {/* Заголовок приложения */}
        {/* <Text style={styles.title}>🎮 WORDTETRIS</Text> */}
        <View style={styles.innerContainer}>
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
        </View>
        <Text style={styles.footer}>
          Разработка: Лабораторная №4 — Работа с навигацией и мультимедиа
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    // resizeMode: 'cover',
  },
  imageStyle: {
    resizeMode: 'stretch',
  },
  container: {
    flex: 1,
    // alignItems: 'center',
    justifyContent: 'flex-end',
    // padding: 16,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Полупрозрачный оверлей
  },
  innerContainer: {
    flex: 1,
    // alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 60,

  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 10,
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
