import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function InstructionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ИНСТРУКЦИЯ</Text>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Управление</Text>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>⬅️ ➡️</Text>
            <Text style={styles.instructionText}>
              Свайпы влево/вправо - передвижение фигуры
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>⬇️</Text>
            <Text style={styles.instructionText}>
              Свайп вниз - быстрый спуск фигуры
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>👆</Text>
            <Text style={styles.instructionText}>
              Тап по экрану - поворот фигуры
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>🎒</Text>
            <Text style={styles.instructionText}>
              Нажатие на "Карман" - сохранить фигуру в карман
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Правила игры</Text>
          <Text style={styles.ruleText}>
            • Собирайте полные линии для их очистки{'\n'}
            • Каждая очищенная линия приносит очки{'\n'}
            • Уровень повышается с ростом счёта{'\n'}
            • Игра заканчивается когда фигуры достигают верха{'\n'}
            • Используйте карман для стратегического хранения фигур
          </Text>
        </View>
      </ScrollView>

      <PrimaryButton
        title="Назад"
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'lightgray',
    borderRadius: 6,
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 50,
    textAlign: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
  },
  ruleText: {
    fontSize: 14,
    lineHeight: 20,
  },
});