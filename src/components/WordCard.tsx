// components/WordCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { WordData } from '../types/wordSets';

type Props = {
  visible: boolean;
  word: WordData | null;
  onClose: () => void;
};

export default function WordCard({ visible, word, onClose }: Props) {
  if (!word) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.word}>{word.word}</Text>
          <Text style={styles.translation}>{word.translation}</Text>
          <Text style={styles.description}>{word.description}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '80%',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  word: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  translation: {
    fontSize: 18,
    color: '#555',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  button: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
