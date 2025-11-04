// Переиспользуемая кнопка с простым стилем.
// Пропсы: title (текст), onPress (обработчик), small (меняем размер).

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface Props {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  small?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PrimaryButton({ title, onPress, small, style, textStyle }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, small ? styles.small : null, style]}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2d8cff',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  small: {
    paddingVertical: 8,
    minWidth: 120, // маленькая кнопка
  },
  text: {
    color: 'white',
    fontWeight: '600',
  },
});