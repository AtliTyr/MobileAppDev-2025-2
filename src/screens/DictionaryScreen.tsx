import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  UIManager,
  Platform,
  ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WordCard from '../components/WordCard';
import SetDetailsModal from '../components/SetDetailsModal';
import {
  WordSet,
  WordData,
  builtInWordSets,
  STORAGE_SELECTED_SET_ID,
  STORAGE_FOUND_WORDS,
} from '../types/wordSets';

type Props = NativeStackScreenProps<RootStackParamList, 'Dictionary'>;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DictionaryScreen({ navigation }: Props) {
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [wordModalVisible, setWordModalVisible] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [foundBySet, setFoundBySet] = useState<Record<string, string[]>>({});
  const [selectedSetForDetails, setSelectedSetForDetails] =
    useState<WordSet | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const storedSetId = await AsyncStorage.getItem(STORAGE_SELECTED_SET_ID);
        if (storedSetId) setSelectedSetId(storedSetId);

        const rawFound = await AsyncStorage.getItem(STORAGE_FOUND_WORDS);
        const parsed: Record<string, string[]> = rawFound
          ? JSON.parse(rawFound)
          : {};
        setFoundBySet(parsed);
      } catch (e) {
        console.log('Ошибка загрузки состояния словаря', e);
      }
    };
    load();
  }, []);

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
  };

  const handleOpenSetDetails = (set: WordSet) => {
    setSelectedSetForDetails(set);
    setDetailsVisible(true);
  };

  const handleCloseSetDetails = () => {
    setDetailsVisible(false);
    setSelectedSetForDetails(null);
  };

  const renderSetCard = (set: WordSet, index: number) => {
    const storedFoundIds = foundBySet[set.id] ?? [];
    const foundWords = set.words.filter(w => storedFoundIds.includes(w.id));
    const foundCount = foundWords.length;
    const isSelected = selectedSetId === set.id;
    const progress = (foundCount / set.totalWords) * 100;

    // Разные градиенты для разных карточек
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
    ];
    const gradient = gradients[index % gradients.length];

    return (
      <TouchableOpacity
        key={set.id}
        onPress={() => handleOpenSetDetails(set)}
        activeOpacity={0.9}
        style={styles.setCard}
      >
        {/* Фоновый градиент */}
        <View
          style={[
            styles.gradientBg,
            {
              backgroundColor: gradient[0],
            },
          ]}
        />

        {/* Контент */}
        <View style={styles.cardContent}>
          {/* Верх: прогресс + статистика + бейдж */}
          <View style={styles.topSection}>
            <View style={styles.progressAndStats}>
              <View style={styles.circularProgress}>
                <Text style={styles.progressNumber}>{Math.round(progress)}%</Text>
              </View>
              <View style={styles.statsCompact}>
                <Text style={styles.statCompact}>
                  <Text style={styles.statCompactBold}>{foundCount}</Text>
                  <Text style={styles.statCompactLabel}> найдено</Text>
                </Text>
                <Text style={styles.statCompact}>
                  <Text style={styles.statCompactBold}>{set.totalWords}</Text>
                  <Text style={styles.statCompactLabel}> всего</Text>
                </Text>
              </View>
            </View>
            {isSelected && (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>✓ АКТИВЕН</Text>
              </View>
            )}
          </View>

          {/* Заголовок и описание */}
          <Text style={styles.setTitle}>{set.name}</Text>
          <Text style={styles.setDesc} numberOfLines={2}>{set.description}</Text>

          {/* Кнопка выбора */}
          {!isSelected && (
            <TouchableOpacity
              style={styles.selectChip}
              onPress={(e) => {
                e.stopPropagation();
                handleSelectSet(set.id);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.selectChipText}>Выбрать →</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const currentSetFoundWords =
    selectedSetForDetails && foundBySet[selectedSetForDetails.id]
      ? selectedSetForDetails.words.filter(w =>
          foundBySet[selectedSetForDetails.id].includes(w.id)
        )
      : [];

  return (
    <ImageBackground
      source={require('../../assets/images/settings_background.png')}
      style={styles.backgroundImage}
      imageStyle={styles.imageStyle}
    >
      <View style={styles.container}>
        {/* Крестик закрытия в правом верхнем углу */}
        <TouchableOpacity
          style={styles.closeButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Словарь</Text>
            <Text style={styles.headerSub}>
              {builtInWordSets.length} наборов слов
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {builtInWordSets.map((set, i) => renderSetCard(set, i))}
        </ScrollView>

        <SetDetailsModal
          visible={detailsVisible}
          set={selectedSetForDetails}
          foundWords={currentSetFoundWords}
          onClose={handleCloseSetDetails}
          onWordPress={handleOpenWord}
        />

        <WordCard
          visible={wordModalVisible}
          word={selectedWord}
          onClose={handleCloseWord}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  imageStyle: {
    // opacity: 0.3,
  },
  container: {
    flex: 1,
    paddingBottom: 20,
    // backgroundColor: 'rgba(10, 15, 30, 0.85)',
  },
  // Крестик закрытия - прямоугольный компактный
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#6096BA',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  // Header - текст слева
  header: {
    alignItems: 'flex-start',
    paddingHorizontal: 32,
    marginBottom: 24,
    top: -15,
    left: '-5%',
    width: '110%',
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderRadius: 10,
    paddingTop: 64,
    paddingBottom: 10,
    transform: [{ rotate: '-3deg' }],
  },
  headerTextBlock: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Карточки наборов
  setCard: {
    height: 200,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  // Верхняя секция: прогресс + статистика + бейдж
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressAndStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularProgress: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressNumber: {
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsCompact: {
    justifyContent: 'center',
  },
  statCompact: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  statCompactBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statCompactLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activePillText: {
    fontSize: 10,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  setTitle: {
    fontSize: 20,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    marginTop: 8,
  },
  setDesc: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    marginBottom: 12,
  },

  selectChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectChipText: {
    fontSize: 13,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#1a1f2e',
  },
});
