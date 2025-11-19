import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function InstructionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ИНСТРУКЦИЯ</Text>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Раздел 1 — Управление */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Управление</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>⬅️ ➡️</Text>
            <Text style={styles.instructionText}>Свайпы влево/вправо — перемещение фигуры</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>⬇️</Text>
            <Text style={styles.instructionText}>Свайп вниз — ускорение падения</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>👆</Text>
            <Text style={styles.instructionText}>Тап — вращение фигуры</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionIcon}>🎒</Text>
            <Text style={styles.instructionText}>Нажатие на «Карман» — сохранить фигуру для использования позже</Text>
          </View>
        </View>

        {/* Раздел 2 — Правила */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 Основные правила</Text>
          <Text style={styles.ruleText}>
            • Формируйте горизонтальные линии, чтобы очистить поле.{"\n"}
            • Каждая очищенная линия добавляет очки.{"\n"}
            • Если фигуры доходят до верха — игра окончена.{"\n"}
            • Уровень повышается с ростом счёта и ускоряет падение фигур.{"\n"}
            • Используйте «Карман» для тактического хранения фигур.
          </Text>
        </View>

        {/* Раздел 3 — Составление слов */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Составление слов</Text>
          <Text style={styles.ruleText}>
            • Каждая клетка фигуры содержит букву.{"\n"}
            • Когда строка образует слово — вы получаете бонус.{"\n"}
            • Можно выделять буквы свайпом, чтобы вручную составлять слова.{"\n"}
            • Верное слово приносит очки и карточку с переводом.{"\n"}
            • Ошибки ускоряют падение фигур или уменьшают счёт.
          </Text>
        </View>

        {/* Раздел 4 — Бонусы */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 Бонусы и награды</Text>
          <Text style={styles.ruleText}>
            • Короткое слово (3–4 буквы): +50 очков.{"\n"}
            • Длинное слово (5+ букв): +200 очков и замедление падения.{"\n"}
            • Редкое слово: +500 очков и «джокер»-блок.{"\n"}
            • Комбо-удаление строк — множитель очков.
          </Text>
        </View>

        {/* Раздел 5 — Обучение */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎓 Режим обучения</Text>
          <Text style={styles.ruleText}>
            • Замедленная скорость падения.{"\n"}
            • Подсказки возможных слов.{"\n"}
            • Карточки перевода после каждого верного слова.{"\n"}
            • Идеален для изучения иностранных языков.
          </Text>
        </View>
      </ScrollView>

      <PrimaryButton title="Назад" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  title: { fontSize: 28, marginBottom: 24 },
  content: { flex: 1, width: '100%', marginBottom: 20 },
  section: { marginBottom: 25, backgroundColor: '#fff', padding: 16, borderRadius: 8, borderWidth: 2 },
  sectionTitle: { fontSize: 20, marginBottom: 12, textAlign: 'center' },
  instructionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#f2f2f2', padding: 8, borderRadius: 6 },
  instructionIcon: { fontSize: 22, width: 40, textAlign: 'center', marginRight: 8 },
  instructionText: { flex: 1, fontSize: 14 },
  ruleText: { fontSize: 14, lineHeight: 20 },
});
