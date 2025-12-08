// components/WordCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { WordData } from '../types/wordSets';

type Props = {
  visible: boolean;
  word: WordData | null;
  onClose: () => void;
};

export default function WordCard({ visible, word, onClose }: Props) {
  if (!word) return null;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Хедер */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.bigIconCircle}>
                <Text style={styles.bigIcon}>💬</Text>
              </View>
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerLabel}>КАРТОЧКА СЛОВА</Text>
                <Text style={styles.headerWord}>{word.word}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Основной контент */}
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Перевод - акцентная карточка */}
            <View style={styles.translationCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🌐</Text>
                <Text style={styles.cardLabel}>ПЕРЕВОД</Text>
              </View>
              <Text style={styles.translationText}>{word.translation}</Text>
            </View>

            {/* Описание */}
            <View style={styles.descriptionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📖</Text>
                <Text style={styles.cardLabel}>ЗНАЧЕНИЕ</Text>
              </View>
              <Text style={styles.descriptionText}>{word.description}</Text>
            </View>

            {/* Декоративный элемент внизу */}
            <View style={styles.bottomDecor}>
              <View style={styles.decorLine} />
              <Text style={styles.decorEmoji}>✨</Text>
              <View style={styles.decorLine} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 25, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0D1B2A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },

  // Хедер
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bigIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE066',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bigIcon: {
    fontSize: 30,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 10,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#6096BA',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerWord: {
    fontSize: 28,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(163, 206, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    fontSize: 22,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Карточка перевода - акцентная
  translationCard: {
    backgroundColor: '#A3CEF1',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    letterSpacing: 1,
  },
  translationText: {
    fontSize: 26,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    lineHeight: 34,
  },

  // Карточка описания
  descriptionCard: {
    backgroundColor: '#6096BA',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: 'Unbounded',
    color: '#0D1B2A',
    lineHeight: 24,
  },

  // Декоративный элемент
  bottomDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  decorLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(163, 206, 241, 0.2)',
  },
  decorEmoji: {
    fontSize: 16,
    marginHorizontal: 12,
  },
});
