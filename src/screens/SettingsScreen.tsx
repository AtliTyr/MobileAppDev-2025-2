/**
 * ⚙️ SettingsScreen.tsx - Экран настроек приложения
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import PrimaryButton from '../components/PrimaryButton';
import { useAudio } from '../context/AudioContext';
import * as Brightness from 'expo-brightness';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const DEFAULT_BRIGHTNESS = 0.05;

export default function SettingsScreen({ navigation }: Props) {
  const { updateSettings, resetSettings, getSettingsForDisplay, getDefaultSettings } = useAudio();

  const [displaySettings, setDisplaySettings] = useState(() =>
    getSettingsForDisplay()
  );
  const [brightness, setBrightness] = useState(1);

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
    // 1) сброс аудио в контексте
    resetSettings();

    // 2) локальный UI обновляем из дефолтного объекта, а не из стейта
    const defaults = getDefaultSettings();
    setDisplaySettings(defaults);

    // 3) яркость
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
        {/* Верхняя панель */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ НАСТРОЙКИ</Text>
          <Text style={styles.headerSubtitle}>
            Музыка, звуки и яркость экрана
          </Text>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
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
                  <Switch
                    value={displaySettings.musicEnabled}
                    onValueChange={handleMusicToggle}
                    trackColor={{ false: '#3C4A5E', true: '#27AE60' }}
                    thumbColor={displaySettings.musicEnabled ? '#ECF0F1' : '#95A5A6'}
                  />
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Фоновая музыка в меню и во время игры.
              </Text>

              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={displaySettings.musicVolume}
                onValueChange={handleMusicVolumeChange}
                minimumTrackTintColor="#27AE60"
                maximumTrackTintColor="#2C3E50"
                thumbTintColor="#ECF0F1"
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
                  <Switch
                    value={displaySettings.soundsEnabled}
                    onValueChange={handleSoundsToggle}
                    trackColor={{ false: '#3C4A5E', true: '#2980B9' }}
                    thumbColor={
                      displaySettings.soundsEnabled ? '#ECF0F1' : '#95A5A6'
                    }
                  />
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Эффекты линий, фигур и слов.
              </Text>

              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={displaySettings.soundsVolume}
                onValueChange={handleSoundsVolumeChange}
                minimumTrackTintColor="#2980B9"
                maximumTrackTintColor="#2C3E50"
                thumbTintColor="#ECF0F1"
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

              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={brightness}
                onValueChange={handleBrightnessChange}
                minimumTrackTintColor="#F1C40F"
                maximumTrackTintColor="#2C3E50"
                thumbTintColor="#ECF0F1"
              />
            </View>
          </View>
          
          {/* Низ экрана: кнопки + инфо */}
          <View style={styles.bottomArea}>
            <View style={styles.buttonsRow}>
              <PrimaryButton
                title="🔄 СБРОСИТЬ"
                onPress={handleResetSettings}
                variant="accent"
                small
              />
              <PrimaryButton
                title="← НАЗАД"
                onPress={() => navigation.goBack()}
                variant="secondary"
                small
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Все изменения сохраняются автоматически
              </Text>
            </View>
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
    resizeMode: 'stretch',
    opacity: 0.5,
  },

  screen: {
    flex: 1,
    backgroundColor: 'rgba(13, 27, 42, 0.8)',
  },

  header: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Unbounded',
    fontWeight: 'bold',
    color: '#E7ECEF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#C7D2FE',
  },

  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'space-between',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0D1B2A',
    backgroundColor: '#6096BA',
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#E7ECEF',
  },

  slider: {
    height: 34,
  },

  // нижняя зона
  bottomArea: {
    marginTop: 8,
    paddingTop: 4,
  },

  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },

  infoBox: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0D1B2A',
    backgroundColor: 'rgba(96, 150, 186, 0.9)',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Unbounded',
    color: '#0D1B2A',
    textAlign: 'center',
  },
});
