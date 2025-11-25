/**
 * ⚙️ SettingsScreen.tsx - Экран настроек приложения
 * 
 * ОСНОВНОЙ ФУНКЦИОНАЛ:
 * ✅ Регулировка громкости музыки (слайдер 0-100)
 * ✅ Регулировка громкости звуков (слайдер 0-100)
 * ✅ Включение/отключение музыки (переключатель)
 * ✅ Включение/отключение звуков (переключатель)
 * ✅ Регулировка яркости экрана
 * ✅ Кнопка сброса всех настроек на значения по умолчанию
 * ✅ Сохранение настроек в контексте AudioContext
 * ✅ Отображение текущих значений громкости в реальном времени
 * 
 * СТРУКТУРА:
 * - Верхняя панель с заголовком
 * - Группа настроек музыки (вкл/выкл + громкость)
 * - Группа настроек звуков (вкл/выкл + громкость)
 * - Настройка яркости экрана
 * - Кнопка сброса
 * - Кнопка возврата
 * 
 * ВЗАИМОДЕЙСТВИЕ:
 * - Изменения сохраняются в реальном времени через updateSettings()
 * - При изменении громкости звук обновляется сразу (useEffect в useAudioManager)
 * - Яркость сохраняется в системных настройках через expo-brightness
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import PrimaryButton from '../components/PrimaryButton';
import { useAudio } from '../context/AudioContext';
import * as Brightness from 'expo-brightness';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

/**
 * SettingsScreen - компонент для управления настройками приложения
 * 
 * ОСНОВНАЯ ЛОГИКА:
 * 1. Получает текущие аудио настройки из контекста
 * 2. Отображает слайдеры и переключатели для управления
 * 3. Обновляет контекст при изменении значений
 * 4. Синхронизирует яркость системы при изменении
 * 5. Позволяет сбросить все настройки на значения по умолчанию
 */
export default function SettingsScreen({ navigation }: Props) {
  // ========================================
  // 🪝 ПОЛУЧЕНИЕ КОНТЕКСТА АУДИО
  // ========================================

  /**
   * Получаем функции и состояние из AudioContext
   * - audioSettings: текущие настройки аудио
   * - updateSettings: функция для обновления настроек
   * - resetSettings: функция для сброса на значения по умолчанию
   * - getSettingsForDisplay: функция для получения текущих значений
   */
  const { audioSettings, updateSettings, resetSettings, getSettingsForDisplay } = useAudio();

  // ========================================
  // 📦 ЛОКАЛЬНОЕ СОСТОЯНИЕ ЭКРАНА
  // ========================================

  /**
   * displaySettings - локальная копия настроек для отображения
   * 
   * ЗАЧЕМ НУЖНА:
   * - Экран использует свой state для управления UI
   * - При обновлении этого state компонент перерендеривается
   * - Это даёт быструю визуальную обратную связь пользователю
   * 
   * ИНИЦИАЛИЗАЦИЯ:
   * - При загрузке экрана получаем текущие значения
   * - Если пользователь вернулся на экран - значения восстанавливаются
   */
  const [displaySettings, setDisplaySettings] = useState(() =>
    getSettingsForDisplay()
  );

  /**
   * brightness - текущая яркость экрана (0-1)
   * 
   * ЗАЧЕМ НУЖНА:
   * - Хранит текущее значение яркости
   * - Отображается на слайдере (0-100%)
   * - Может быть изменена пользователем
   */
  const [brightness, setBrightness] = useState(1);

  // ========================================
  // ⚡ ИНИЦИАЛИЗАЦИЯ ЯРКОСТИ
  // ========================================

  /**
   * При загрузке компонента получаем текущую яркость системы
   * 
   * ПРОЦЕСС:
   * 1. Вызываем getBrightnessAsync() из expo-brightness
   * 2. Это асинхронная операция поэтому используем useEffect
   * 3. Сохраняем значение в состояние brightness
   * 4. Выполняется только один раз при монтировании (пустой массив зависимостей)
   */
  useEffect(() => {
    (async () => {
      try {
        const currentBrightness = await Brightness.getBrightnessAsync();
        setBrightness(currentBrightness);
        console.log('✅ Яркость получена:', (currentBrightness * 100).toFixed(0) + '%');
      } catch (error) {
        console.error('❌ Ошибка получения яркости:', error);
      }
    })();
  }, []);

  // ========================================
  // 🌞 ОБРАБОТЧИК ИЗМЕНЕНИЯ ЯРКОСТИ
  // ========================================

  /**
   * handleBrightnessChange - обновляет яркость экрана
   * 
   * ПРОЦЕСС:
   * 1. Получаем новое значение (0-1) с слайдера
   * 2. Обновляем локальное состояние brightness
   * 3. Вызываем setBrightnessAsync() из expo-brightness
   * 4. Это сразу же изменит яркость физического экрана
   * 
   * ⭐ СИНХРОННОСТЬ:
   * - Изменение яркости происходит немедленно
   * - Пользователь видит результат в реальном времени
   * - Пермессии приложения должны содержать BRIGHTNESS
   * 
   * @param value - новое значение яркости (0-1)
   */
  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    try {
      await Brightness.setBrightnessAsync(value);
      console.log('✅ Яркость установлена:', (value * 100).toFixed(0) + '%');
    } catch (error) {
      console.error('❌ Ошибка установки яркости:', error);
    }
  };

  // ========================================
  // 🔊 ОБРАБОТЧИКИ АУДИО НАСТРОЕК
  // ========================================

  /**
   * handleMusicVolumeChange - изменение громкости музыки
   * 
   * ПРОЦЕСС:
   * 1. Обновляем displaySettings (для визуального отображения)
   * 2. Вызываем updateSettings для обновления контекста
   * 3. Эта функция срабатывает когда пользователь двигает слайдер
   * 4. После обновления в контексте, useAudioManager обнаружит изменение
   * 5. И обновит громкость всех звуков
   * 
   * ⭐ ЦЕПОЧКА ОБНОВЛЕНИЯ:
   * handleMusicVolumeChange → updateSettings → AudioContext обновляется
   * → useEffect в useAudioManager замечает изменение
   * → Вызывает setVolumeAsync() для музыкального плеера
   * 
   * @param value - новое значение (0-100)
   */
  const handleMusicVolumeChange = (value: number) => {
    setDisplaySettings(prev => ({ ...prev, musicVolume: value }));
    updateSettings({ musicVolume: value });
  };

  /**
   * handleSoundsVolumeChange - изменение громкости звуков эффектов
   * 
   * Аналогично handleMusicVolumeChange но для звуков
   */
  const handleSoundsVolumeChange = (value: number) => {
    setDisplaySettings(prev => ({ ...prev, soundsVolume: value }));
    updateSettings({ soundsVolume: value });
  };

  /**
   * handleMusicToggle - включение/отключение музыки
   * 
   * ПРОЦЕСС:
   * 1. Получаем новое значение (противоположное текущему)
   * 2. Обновляем displaySettings
   * 3. Вызываем updateSettings с новым значением musicEnabled
   * 4. В AudioContext обновляется музыка
   * 5. useAudioManager видит что musicEnabled изменилась
   * 6. Если false - останавливает музыку, если true - может запустить
   * 
   * @param value - новое значение (true/false)
   */
  const handleMusicToggle = (value: boolean) => {
    setDisplaySettings(prev => ({ ...prev, musicEnabled: value }));
    updateSettings({ musicEnabled: value });
  };

  /**
   * handleSoundsToggle - включение/отключение звуков эффектов
   * 
   * Аналогично handleMusicToggle
   */
  const handleSoundsToggle = (value: boolean) => {
    setDisplaySettings(prev => ({ ...prev, soundsEnabled: value }));
    updateSettings({ soundsEnabled: value });
  };

  // ========================================
  // 🔄 СБРОС ВСЕХ НАСТРОЕК
  // ========================================

  /**
   * handleResetSettings - сбрасывает все настройки на значения по умолчанию
   * 
   * ПРОЦЕСС:
   * 1. Вызываем resetSettings() из контекста
   * 2. Получаем новые значения через getSettingsForDisplay()
   * 3. Обновляем displaySettings локально
   * 4. Пользователь видит что все значения вернулись на стандартные
   * 
   * ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ:
   * - musicEnabled: true
   * - musicVolume: 70
   * - soundsEnabled: true
   * - soundsVolume: 70
   */
  const handleResetSettings = () => {
    resetSettings();
    const defaultSettings = getSettingsForDisplay();
    setDisplaySettings(defaultSettings);
    console.log('✅ Настройки сброшены на значения по умолчанию');
  };

  // ========================================
  // 🎨 РЕНДЕРИНГ
  // ========================================

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Заголовок */}
      <Text style={styles.title}>⚙️ НАСТРОЙКИ</Text>

      {/* Секция музыки */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎵 Музыка</Text>
          <Switch
            value={displaySettings.musicEnabled}
            onValueChange={handleMusicToggle}
            trackColor={{ false: '#ccc', true: '#81C784' }}
            thumbColor={displaySettings.musicEnabled ? '#4CAF50' : '#999'}
          />
        </View>

        {displaySettings.musicEnabled && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость: {displaySettings.musicVolume}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={displaySettings.musicVolume}
              onValueChange={handleMusicVolumeChange}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#ccc"
            />
          </View>
        )}
      </View>

      {/* Секция звуков */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔊 Звуки</Text>
          <Switch
            value={displaySettings.soundsEnabled}
            onValueChange={handleSoundsToggle}
            trackColor={{ false: '#ccc', true: '#81C784' }}
            thumbColor={displaySettings.soundsEnabled ? '#4CAF50' : '#999'}
          />
        </View>

        {displaySettings.soundsEnabled && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость: {displaySettings.soundsVolume}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={displaySettings.soundsVolume}
              onValueChange={handleSoundsVolumeChange}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#ccc"
            />
          </View>
        )}
      </View>

      {/* Секция яркости */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌞 Яркость экрана</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Яркость: {(brightness * 100).toFixed(0)}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            value={brightness}
            onValueChange={handleBrightnessChange}
            minimumTrackTintColor="#FF9800"
            maximumTrackTintColor="#ccc"
          />
        </View>
      </View>

      {/* Кнопка сброса */}
      <PrimaryButton
        title="🔄 СБРОСИТЬ НА ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ"
        onPress={handleResetSettings}
      />

      {/* Кнопка возврата */}
      <PrimaryButton
        title="← НАЗАД"
        onPress={() => navigation.goBack()}
      />

      {/* Информационный блок */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ Все изменения сохраняются автоматически
        </Text>
      </View>
    </ScrollView>
  );
}

// ========================================
// 🎨 СТИЛИ
// ========================================

/**
 * Основные стили для компонента
 */
const styles = StyleSheet.create({
  /**
   * container - главный контейнер
   * ScrollView позволяет скроллить если содержимое не помещается
   */
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  /**
   * contentContainer - контейнер для содержимого
   * padding для отступов, flexGrow для заполнения высоты
   */
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },

  /**
   * title - заголовок экрана
   * Большой и жирный текст в верхней части
   */
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },

  /**
   * section - группа настроек
   * Каждый раздел (музыка, звуки, яркость) в отдельной секции
   */
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  /**
   * sectionHeader - заголовок секции с переключателем
   * flexDirection: 'row' расположит заголовок и переключатель рядом
   */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  /**
   * sectionTitle - название секции
   * Жирный текст среднего размера
   */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  /**
   * sliderContainer - контейнер для слайдера
   * marginTop для отступа от заголовка
   */
  sliderContainer: {
    marginTop: 12,
  },

  /**
   * sliderLabel - текст под слайдером с текущим значением
   * Помогает пользователю видеть точное значение
   */
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },

  /**
   * slider - сам компонент слайдера
   * Высота 40 дает удобный размер для нажатия
   */
  slider: {
    height: 40,
    borderRadius: 10,
  },

  /**
   * infoBox - информационный блок внизу
   * Содержит подсказку для пользователя
   */
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },

  /**
   * infoText - текст в информационном блоке
   * Мелкий серый текст для дополнительной информации
   */
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    textAlign: 'center',
  },
});
