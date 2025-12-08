/**
 * ⚙️ SettingsScreen.tsx - Экран настроек приложения
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, PanResponder, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import { useAudio } from '../context/AudioContext';
import * as Brightness from 'expo-brightness';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const DEFAULT_BRIGHTNESS = 0.05;

// Кастомный прямоугольный Switch
const RectSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: (val: boolean) => void }) => {
  return (
    <TouchableOpacity
      style={[styles.rectSwitch, value ? styles.rectSwitchOn : styles.rectSwitchOff]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.8}
    >
      <View style={[styles.rectSwitchThumb, value ? styles.rectSwitchThumbOn : styles.rectSwitchThumbOff]} />
    </TouchableOpacity>
  );
};

// Кастомный прямоугольный Slider
const RectSlider = ({ 
  value, 
  onValueChange, 
  minimumValue = 0, 
  maximumValue = 100,
  step = 1,
  thumbColor = '#0D1B2A',
  onSlideStart,
  onSlideEnd,
}: { 
  value: number; 
  onValueChange: (val: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  thumbColor?: string;
  onSlideStart?: () => void;
  onSlideEnd?: () => void;
}) => {
  const sliderRef = useRef<View>(null);
  const [layout, setLayout] = useState({ width: 0, x: 0 });

  const normalizedValue = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  const updateValue = (pageX: number) => {
    if (layout.width === 0) return;
    
    const touchX = pageX - layout.x;
    const percentage = Math.max(0, Math.min(100, (touchX / layout.width) * 100));
    const rawValue = minimumValue + (percentage / 100) * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, steppedValue));
    
    onValueChange(clampedValue);
  };

  const handleLayout = () => {
    setTimeout(() => {
      sliderRef.current?.measure((_x: number, _y: number, width: number, _height: number, pageX: number, _pageY: number) => {
        setLayout({ width, x: pageX });
      });
    }, 100);
  };

  useEffect(() => {
    handleLayout();
  }, []);

  // Генерируем 19 линий для создания 20 сегментов
  const renderGrid = () => {
    return Array.from({ length: 19 }).map((_, i) => (
      <View 
        key={i} 
        style={[
          styles.gridLine,
          { left: `${((i + 1) * 5)}%` }
        ]} 
      />
    ));
  };

  return (
    <View style={styles.sliderContainer}>
      <View
        ref={sliderRef}
        style={styles.sliderTrack}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          onSlideStart?.();
          updateValue(e.nativeEvent.pageX);
        }}
        onResponderMove={(e) => {
          updateValue(e.nativeEvent.pageX);
        }}
        onResponderRelease={() => {
          onSlideEnd?.();
        }}
        onLayout={handleLayout}
      >
        <View style={[styles.sliderFill, { width: `${normalizedValue}%` }]} />
        {renderGrid()}
      </View>
      <View 
        style={[
          styles.sliderThumb, 
          { 
            left: `${normalizedValue}%`,
            backgroundColor: thumbColor,
          }
        ]} 
        pointerEvents="none"
      />
    </View>
  );
};


export default function SettingsScreen({ navigation }: Props) {
  const { updateSettings, resetSettings, getSettingsForDisplay, getDefaultSettings } = useAudio();

  const [displaySettings, setDisplaySettings] = useState(() =>
    getSettingsForDisplay()
  );
  const [brightness, setBrightness] = useState(1);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const currentBrightness = await Brightness.getBrightnessAsync();
        setBrightness(currentBrightness);
      } catch (error) {
        console.error('❌ Ошибка получения яркости:', error);
      }
    })();
  }, []);

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    try {
      await Brightness.setBrightnessAsync(value);
    } catch (error) {
      console.error('❌ Ошибка установки яркости:', error);
    }
  };

  const handleMusicVolumeChange = (value: number) => {
    setDisplaySettings(prev => ({ ...prev, musicVolume: value }));
    updateSettings({ musicVolume: value });
  };

  const handleSoundsVolumeChange = (value: number) => {
    setDisplaySettings(prev => ({ ...prev, soundsVolume: value }));
    updateSettings({ soundsVolume: value });
  };

  const handleMusicToggle = (value: boolean) => {
    setDisplaySettings(prev => ({ ...prev, musicEnabled: value }));
    updateSettings({ musicEnabled: value });
  };

  const handleSoundsToggle = (value: boolean) => {
    setDisplaySettings(prev => ({ ...prev, soundsEnabled: value }));
    updateSettings({ soundsEnabled: value });
  };

  const handleResetSettings = async () => {
    resetSettings();
    const defaults = getDefaultSettings();
    setDisplaySettings(defaults);

    try {
      setBrightness(DEFAULT_BRIGHTNESS);
      await Brightness.setBrightnessAsync(DEFAULT_BRIGHTNESS);
    } catch (error) {
      console.error('❌ Ошибка сброса яркости:', error);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/settings_background.png')}
      style={styles.backgroundImage}
      imageStyle={styles.imageStyle}
    >
      <View style={styles.screen}>
        {/* Крестик закрытия */}
        <TouchableOpacity
          style={styles.closeButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Шапка */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Настройки</Text>
            <Text style={styles.headerSubtitle}>
              Музыка, звуки и яркость экрана
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          scrollEnabled={scrollEnabled} // Добавили prop
        >
          <View>
            {/* Музыка */}
            <View style={styles.section}>
              <View style={styles.sectionTopRow}>
                <Text style={styles.sectionLabel}>МУЗЫКА</Text>
                <View style={styles.sectionTopRight}>
                  <Text style={styles.valueBadge}>
                    {displaySettings.musicVolume}%
                  </Text>
                  <RectSwitch 
                    value={displaySettings.musicEnabled}
                    onValueChange={handleMusicToggle}
                  />
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Фоновая музыка в меню и во время игры.
              </Text>

              <RectSlider
                value={displaySettings.musicVolume}
                onValueChange={handleMusicVolumeChange}
                minimumValue={0}
                maximumValue={100}
                step={1}
                thumbColor="#0D1B2A"
              />
            </View>

            {/* Звуки */}
            <View style={styles.section}>
              <View style={styles.sectionTopRow}>
                <Text style={styles.sectionLabel}>ЗВУКИ</Text>
                <View style={styles.sectionTopRight}>
                  <Text style={styles.valueBadge}>
                    {displaySettings.soundsVolume}%
                  </Text>
                  <RectSwitch 
                    value={displaySettings.soundsEnabled}
                    onValueChange={handleSoundsToggle}
                  />
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Эффекты линий, фигур и слов.
              </Text>

              <RectSlider
                value={displaySettings.soundsVolume}
                onValueChange={handleSoundsVolumeChange}
                minimumValue={0}
                maximumValue={100}
                step={1}
                thumbColor="#0D1B2A"
              />
            </View>

            {/* Яркость */}
            <View style={styles.section}>
              <View style={styles.sectionTopRow}>
                <Text style={styles.sectionLabel}>ЯРКОСТЬ</Text>
                <Text style={styles.valueBadge}>
                  {(brightness * 100).toFixed(0)}%
                </Text>
              </View>

              <Text style={styles.sectionDescription}>
                Влияет на общую яркость экрана устройства.
              </Text>

              <RectSlider
                value={brightness}
                onValueChange={handleBrightnessChange}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                thumbColor="#FFE066"
              />
            </View>
          </View>

          {/* Кнопки сразу после секций */}
          <View style={styles.buttonsRow}>
            <PrimaryButton
              title="📖 КАК ИГРАТЬ"
              onPress={() => navigation.navigate('Instructions')}
              variant="secondary"
              small
              style={styles.bottomButton}
            />
            <PrimaryButton
              title="🔄 СБРОСИТЬ"
              onPress={handleResetSettings}
              variant="accent"
              small
              style={styles.bottomButton}
            />
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

// ========================================
// 🎨 СТИЛИ
// ========================================

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  imageStyle: {
    opacity: 0.5,
  },

  screen: {
    flex: 1,
    backgroundColor: 'rgba(13, 27, 42, 0.8)',
  },

  // Крестик закрытия
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

  // Header
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
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginTop: 2,
  },

  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // карточки секций
  section: {
    backgroundColor: '#A3CEF1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },

  sectionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  sectionTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#0D1B2A',
    textTransform: 'uppercase',
  },

  sectionDescription: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#111',
    marginBottom: 8,
  },

  valueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0D1B2A',
    backgroundColor: '#6096BA',
    fontSize: 12,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
  },

  // Кастомный прямоугольный Switch
  rectSwitch: {
    width: 56,
    height: 28,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0D1B2A',
    padding: 2,
    justifyContent: 'center',
  },
  rectSwitchOff: {
    backgroundColor: '#3C4A5E',
    alignItems: 'flex-start',
  },
  rectSwitchOn: {
    backgroundColor: '#27AE60',
    alignItems: 'flex-end',
  },
  rectSwitchThumb: {
    width: 22,
    height: 22,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#0D1B2A',
  },
  rectSwitchThumbOff: {
    backgroundColor: '#95A5A6',
  },
  rectSwitchThumbOn: {
    backgroundColor: '#ECF0F1',
  },

  // Кастомный прямоугольный Slider
  sliderContainer: {
    height: 32,
    position: 'relative',
  },
  sliderTrack: {
    height: 28,
    backgroundColor: '#0D1B2A',
    borderRadius: 4,
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#0D1B2A',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#6096BA',
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(13, 27, 42, 0.6)',
    top: 0,
    zIndex: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    top: 0,
    marginLeft: -16,
    borderRadius: 3,
    borderWidth: 3,
    borderColor: '#E7ECEF',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },

  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },

  bottomButton: {
    flex: 1,
  },
});
