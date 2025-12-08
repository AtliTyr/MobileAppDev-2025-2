import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { WordSet, WordData } from '../types/wordSets';

interface Props {
  visible: boolean;
  set: WordSet | null;
  foundWords: WordData[];
  onClose: () => void;
  onWordPress: (word: WordData) => void;
}

const { width, height } = Dimensions.get('window');

export default function SetDetailsModal({
  visible,
  set,
  foundWords,
  onClose,
  onWordPress,
}: Props) {
  if (!set) return null;

  const foundCount = foundWords.length;
  const progress = (foundCount / set.totalWords) * 100;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>📖</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>{set.name}</Text>
          <Text style={styles.modalDesc}>{set.description}</Text>

          {/* Progress Ring */}
          <View style={styles.progressSection}>
            <View style={styles.progressRing}>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              <Text style={styles.progressLabel}>ЗАВЕРШЕНО</Text>
            </View>
            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatNum}>{foundCount}</Text>
                <Text style={styles.progressStatText}>Найдено</Text>
              </View>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatNum}>{set.totalWords - foundCount}</Text>
                <Text style={styles.progressStatText}>Осталось</Text>
              </View>
            </View>
          </View>

          {/* Words List */}
          <View style={styles.wordsSection}>
            <Text style={styles.sectionTitle}>Найденные слова</Text>
            <ScrollView 
              style={styles.wordsScroll}
              contentContainerStyle={styles.wordsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {foundCount === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={styles.emptyText}>
                    Начните игру, чтобы открыть слова из этого набора
                  </Text>
                </View>
              ) : (
                <View style={styles.wordsContainer}>
                  {foundWords.map((word, index) => (
                    <TouchableOpacity
                      key={word.id}
                      style={[
                        styles.wordChip,
                        index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 },
                      ]}
                      onPress={() => onWordPress(word)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.wordChipText}>{word.word}</Text>
                      <Text style={styles.wordChipSub}>{word.translation}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1f2e',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    height: height * 0.85,
  },

  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Unbounded',
  },

  modalTitle: {
    fontSize: 28,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    lineHeight: 20,
  },

  // Progress
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  progressPercent: {
    fontSize: 24,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Unbounded',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  progressStats: {
    flex: 1,
  },
  progressStatItem: {
    marginBottom: 12,
  },
  progressStatNum: {
    fontSize: 28,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressStatText: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Words
  wordsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  wordsScroll: {
    flex: 1,
  },
  wordsScrollContent: {
    paddingBottom: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordChip: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    width: (width - 60) / 2,
  },
  wordChipText: {
    fontSize: 16,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  wordChipSub: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
