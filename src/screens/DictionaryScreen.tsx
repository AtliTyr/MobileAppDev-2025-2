import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Dictionary'>;

const dummyWords = [
  { id: '1', word: 'APPLE', translation: 'яблоко', points: 50 },
  { id: '2', word: 'LEARN', translation: 'учить', points: 200 },
  { id: '3', word: 'GAME', translation: 'игра', points: 100 },
];

export default function DictionaryScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 СЛОВАРЬ</Text>

      <FlatList
        data={dummyWords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.wordCard}>
            <Text style={styles.word}>{item.word}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
            <Text style={styles.points}>+{item.points} очков</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Пока что здесь нет найденных слов 😅</Text>
        }
        style={{ width: '100%' }}
      />

      <PrimaryButton
        title="← Назад"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  wordCard: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  word: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  translation: {
    fontSize: 16,
    color: '#555',
  },
  points: {
    fontSize: 14,
    color: '#888',
  },
  empty: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
  },
});
