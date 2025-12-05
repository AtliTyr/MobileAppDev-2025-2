// src/screens/DictionaryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WordCard from '../components/WordCard';
import {
  WordSet,
  WordData,
  builtInWordSets,
  STORAGE_SELECTED_SET_ID,
  STORAGE_FOUND_WORDS,
} from '../types/wordSets';

type Props = NativeStackScreenProps<RootStackParamList, 'Dictionary'>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DictionaryScreen({ navigation }: Props) {
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [wordModalVisible, setWordModalVisible] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [foundBySet, setFoundBySet] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const storedSetId = await AsyncStorage.getItem(STORAGE_SELECTED_SET_ID);
        if (storedSetId) setSelectedSetId(storedSetId);

        const rawFound = await AsyncStorage.getItem(STORAGE_FOUND_WORDS);
        const parsed: Record<string, string[]> = rawFound ? JSON.parse(rawFound) : {};
        setFoundBySet(parsed);
      } catch (e) {
        console.log('Ошибка загрузки состояния словаря', e);
      }
    };
    load();
  }, []);

  const handleToggleExpand = (setId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSetId(prev => (prev === setId ? null : setId));
  };

  const handleOpenWord = (word: WordData) => {
    setSelectedWord(word);
    setWordModalVisible(true);
  };

  const handleCloseWord = () => {
    setWordModalVisible(false);
    setSelectedWord(null);
  };

  const handleSelectSet = async (setId: string) => {
    setSelectedSetId(setId);
    try {
      await AsyncStorage.setItem(STORAGE_SELECTED_SET_ID, setId);
    } catch (e) {
      console.log('Ошибка сохранения выбранного набора', e);
    }
    console.log('✅ Набор выбран для игры:', setId);
  };

  const renderSet = ({ item }: { item: WordSet }) => {
    const storedFoundIds = foundBySet[item.id] ?? [];
    // ВАЖНО: видим только ОТКРЫТЫЕ слова
    const foundWords = item.words.filter(w => storedFoundIds.includes(w.id));
    const foundCount = foundWords.length;

    const isExpanded = expandedSetId === item.id;
    const isSelected = selectedSetId === item.id;

    return (
      <View style={styles.setCard}>
        <TouchableOpacity onPress={() => handleToggleExpand(item.id)}>
          <Text style={styles.setTitle}>{item.name}</Text>
          <Text style={styles.setDescription}>{item.description}</Text>
          <Text style={styles.setCounter}>
            Найдено: {foundCount} / {item.totalWords}
          </Text>
        </TouchableOpacity>

        <PrimaryButton
          title={isSelected ? '✅ Выбран' : 'Выбрать'}
          onPress={() => handleSelectSet(item.id)}
          style={styles.selectButton}
        />

        {isExpanded && (
          <View style={styles.wordsContainer}>
            {foundCount === 0 ? (
              <Text style={styles.empty}>Пока что здесь нет найденных слов 😅</Text>
            ) : (
              foundWords.map(word => (
                <TouchableOpacity
                  key={word.id}
                  style={styles.wordRow}
                  onPress={() => handleOpenWord(word)}
                >
                  <Text style={styles.wordText}>{word.word}</Text>
                  <Text style={styles.wordTranslation}>{word.translation}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 СЛОВАРЬ</Text>

      <FlatList
        data={builtInWordSets}
        keyExtractor={(item) => item.id}
        renderItem={renderSet}
        contentContainerStyle={{ paddingBottom: 24, width: '100%' }}
      />

      <PrimaryButton
        title="Назад"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
      />

      <WordCard
        visible={wordModalVisible}
        word={selectedWord}
        onClose={handleCloseWord}
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
    backgroundColor: '#f0f4ff',
  },
  title: {
    fontSize: 26,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  setCard: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  setTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  setDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  setCounter: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  selectButton: {
    marginTop: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  wordsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
  wordRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600',
  },
  wordTranslation: {
    fontSize: 14,
    color: '#555',
  },
  empty: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
