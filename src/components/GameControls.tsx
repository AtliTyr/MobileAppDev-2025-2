// src/components/GameControls.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useGameState } from '../hooks/useGameState';

export default function GameControls() {
  const { actions } = useGameState();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => actions.moveTetromino(-1, 0)}
      >
        <Text>←</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => actions.rotateTetromino()}
      >
        <Text>↻</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => actions.moveTetromino(1, 0)}
      >
        <Text>→</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => actions.hardDrop()}
      >
        <Text>↓</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  button: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
});