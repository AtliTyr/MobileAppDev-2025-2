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
  StyleProp,
} from 'react-native';

type ButtonVariant = 'primary' | 'accent' | 'secondary';

interface Props {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
}

export default function PrimaryButton({
  title,
  onPress,
  small,
  style,
  textStyle,
  variant = 'primary',
}: Props) {
  const containerStyle = [
    styles.buttonBase,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'accent' && styles.buttonAccent,
    variant === 'secondary' && styles.buttonSecondary,
    small && styles.small,
    style,
  ];

  const textStyles = [
    styles.textBase,
    variant !== 'secondary' && styles.textDark,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={containerStyle}
      activeOpacity={0.8}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginVertical: 6,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 3,
  },
  buttonPrimary: {
    backgroundColor: '#0D1B2A',
    borderColor: '#0D1B2A',
  },
  buttonAccent: {
    backgroundColor: '#0D1B2A',
    borderColor: '#0D1B2A',
  },
  buttonSecondary: {
    backgroundColor: '#A3CEF1',
    borderColor: '#0D1B2A',
  },
  small: {
    paddingVertical: 8,
    minWidth: 120,
  },
  textBase: {
    color: '#0D1B2A',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Unbounded',
  },
  textDark: {
    color: 'white',
  },
});
