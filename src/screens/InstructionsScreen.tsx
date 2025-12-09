/**
 * 📖 InstructionsScreen.tsx - Инструкции к игре WordTetris
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Instructions'>;

export default function InstructionsScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={require('../../assets/images/settings_background.png')}
      style={styles.backgroundImage}
      imageStyle={styles.imageStyle}
    >
      <View style={styles.container}>
        {/* Шапка на всю ширину с крестиком внутри */}
        <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
        >
            <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.titleText}>Как играть</Text>
        </View>

        {/* Родительский контейнер с фоном для всех секций */}
        <View style={styles.contentWrapper}>
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Раздел 1 — Основная идея */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Главная цель</Text>
              <Text style={styles.descriptionText}>
                WordTetris объединяет классический Тетрис с изучением слов!{'\n\n'}
                Управляйте падающими блоками с буквами, а затем составляйте из них целевые слова, получая бонусы и пополняя словарный запас.
              </Text>
            </View>

            {/* Раздел 2 — Управление */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎮 Управление</Text>

              <View style={styles.controlItem}>
                <View style={styles.iconBox}>
                  <Text style={styles.controlIcon}>⬅️ ➡️</Text>
                </View>
                <Text style={styles.controlText}>
                  Свайп влево/вправо — перемещение фигуры
                </Text>
              </View>

              <View style={styles.controlItem}>
                <View style={styles.iconBox}>
                  <Text style={styles.controlIcon}>⬇️</Text>
                </View>
                <Text style={styles.controlText}>
                  Свайп вниз — мгновенное падение (hard drop)
                </Text>
              </View>

              <View style={styles.controlItem}>
                <View style={styles.iconBox}>
                  <Text style={styles.controlIcon}>🔄</Text>
                </View>
                <Text style={styles.controlText}>
                  Тап по полю — вращение фигуры
                </Text>
              </View>

              <View style={styles.controlItem}>
                <View style={styles.iconBox}>
                  <Text style={styles.controlIcon}>📦</Text>
                </View>
                <Text style={styles.controlText}>
                  Кнопка «Карман» — сохранить фигуру для обмена
                </Text>
              </View>
            </View>

            {/* Раздел 3 — Игровой процесс */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🕹️ Игровой процесс</Text>
              
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>1</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Выберите набор слов</Text>
                  <Text style={styles.stepText}>
                    В словаре выберите тему: Животные, Растения, Профессии и т.д.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>2</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Играйте в Тетрис</Text>
                  <Text style={styles.stepText}>
                    Размещайте блоки с буквами, очищайте линии, набирайте очки
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>3</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Составляйте слова</Text>
                  <Text style={styles.stepText}>
                    Нажмите кнопку «СЛОВО», затем проведите пальцем по буквам на доске, составляя целевое слово
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>4</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Получайте награды</Text>
                  <Text style={styles.stepText}>
                    За правильное слово получите очки, карточку с описанием и новую цель!
                  </Text>
                </View>
              </View>
            </View>

            {/* Раздел 4 — Режим составления слов */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Режим поиска слов</Text>
              <Text style={styles.descriptionText}>
                <Text style={styles.boldText}>Как активировать:</Text>{'\n'}
                Нажмите кнопку «СЛОВО» во время игры — Тетрис приостановится{'\n\n'}
                
                <Text style={styles.boldText}>Как составить:</Text>{'\n'}
                • Нажмите на первую букву{'\n'}
                • Ведите пальцем к соседним буквам (↑↓←→){'\n'}
                • Диагонали НЕ работают{'\n'}
                • Отпустите палец для проверки{'\n\n'}
                
                <Text style={styles.successText}>✅ Правильно:</Text> +500 очков, карточка слова, новая цель{'\n'}
                <Text style={styles.errorText}>❌ Неправильно:</Text> перезарядка 10 секунд
              </Text>
            </View>

            {/* Раздел 5 — Очки и прогресс */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Система очков</Text>
              
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Найденное слово</Text>
                <Text style={styles.scoreValue}>+500</Text>
              </View>
              
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Редкое слово (7+ букв)</Text>
                <Text style={styles.scoreValue}>+1000</Text>
              </View>
              
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Комбо слов подряд</Text>
                <Text style={styles.scoreValue}>+250×N</Text>
              </View>
              
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Очищенная линия</Text>
                <Text style={styles.scoreValue}>+100</Text>
              </View>

              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Завершённый набор</Text>
                <Text style={styles.scoreValue}>+2000</Text>
              </View>
            </View>

            {/* Раздел 6 — Советы */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Полезные советы</Text>
              <Text style={styles.tipText}>
                🎯 Сосредоточьтесь на целевом слове — именно его нужно найти{'\n\n'}
                📦 Используйте «Карман» для стратегического обмена фигур{'\n\n'}
                ⏸️ Режим поиска слов ставит игру на паузу — думайте спокойно{'\n\n'}
                📚 Завершайте наборы на 100% для максимального обучения{'\n\n'}
                🔄 Lock Delay даёт 500мс на манёвры у дна — используйте!
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  imageStyle: {
    resizeMode: 'stretch',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // ========================================
  // ШАПКА (на всю ширину, без зазоров)
  // ========================================
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
  titleText: {
    fontSize: 32,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    letterSpacing: -1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
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

  // ========================================
  // РОДИТЕЛЬСКИЙ КОНТЕЙНЕР С ФОНОМ
  // ========================================
  contentWrapper: {
    flex: 1,
    backgroundColor: 'rgba(231, 236, 239, 0.6)',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(13, 27, 42, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  
  // ========================================
  // ОТДЕЛЬНЫЕ СЕКЦИИ
  // ========================================
  section: {
    marginBottom: 12,
    backgroundColor: '#A3CEF1',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'Unbounded',
    color: '#111',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  successText: {
    fontWeight: 'bold',
    color: '#0a8754',
  },
  errorText: {
    fontWeight: 'bold',
    color: '#c41e3a',
  },
  
  // ========================================
  // УПРАВЛЕНИЕ
  // ========================================
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#E7ECEF',
    borderWidth: 2,
    borderColor: '#0D1B2A',
    borderRadius: 8,
    padding: 10,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#6096BA',
    borderWidth: 2,
    borderColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#111',
    lineHeight: 17,
  },

  // ========================================
  // ШАГИ
  // ========================================
  stepItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D1B2A',
    color: '#E7ECEF',
    fontSize: 18,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 10,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#111',
    lineHeight: 17,
  },

  // ========================================
  // ОЧКИ
  // ========================================
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: '#E7ECEF',
    borderWidth: 2,
    borderColor: '#0D1B2A',
    borderRadius: 6,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#111',
    flex: 1,
  },
  scoreValue: {
    fontSize: 15,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0a8754',
  },

  // ========================================
  // СОВЕТЫ
  // ========================================
  tipText: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#111',
    lineHeight: 19,
  },
});
