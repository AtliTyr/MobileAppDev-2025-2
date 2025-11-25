import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import PrimaryButton from '../components/PrimaryButton';
import { useAudio } from '../context/AudioContext';
import * as Brightness from 'expo-brightness';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const {
    audioSettings,
    updateSettings,
    resetSettings,
    getSettingsForDisplay,
  } = useAudio();

  const [displaySettings, setDisplaySettings] = useState(() =>
    getSettingsForDisplay()
  );
  const [brightness, setBrightness] = useState(1);

  useEffect(() => {
    (async () => {
      const systemBrightness = await Brightness.getBrightnessAsync();
      setBrightness(systemBrightness);
    })();
  }, []);

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    await Brightness.setBrightnessAsync(value);
  };

  useEffect(() => {
    setDisplaySettings(getSettingsForDisplay());
  }, [audioSettings, getSettingsForDisplay]);

  const handleMusicToggle = (enabled: boolean) => {
    updateSettings({ musicEnabled: enabled });
  };

  const handleMusicVolumeChange = (volume: number) => {
    updateSettings({ musicVolume: volume });
  };

  const handleSoundsToggle = (enabled: boolean) => {
    updateSettings({ soundsEnabled: enabled });
  };

  const handleSoundsVolumeChange = (volume: number) => {
    updateSettings({ soundsVolume: volume });
  };

  const handleResetSettings = () => {
    resetSettings();
    handleBrightnessChange(0.7);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ НАСТРОЙКИ</Text>

      <View style={styles.settingsContainer}>
        {/* Музыка */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Музыка</Text>
            <Text style={styles.settingValue}>
              {displaySettings.musicEnabled
                ? `Вкл (${displaySettings.musicVolume}%)`
                : 'Выкл'}
            </Text>
          </View>
          <Switch
            value={audioSettings.musicEnabled}
            onValueChange={handleMusicToggle}
          />
        </View>

        {audioSettings.musicEnabled && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость музыки</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={displaySettings.musicVolume}
              onValueChange={handleMusicVolumeChange}
            />
            <Text style={styles.sliderValue}>{displaySettings.musicVolume}%</Text>
          </View>
        )}

        {/* Звуки */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Звуки</Text>
            <Text style={styles.settingValue}>
              {displaySettings.soundsEnabled
                ? `Вкл (${displaySettings.soundsVolume}%)`
                : 'Выкл'}
            </Text>
          </View>
          <Switch
            value={audioSettings.soundsEnabled}
            onValueChange={handleSoundsToggle}
          />
        </View>

        {audioSettings.soundsEnabled && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость звуков</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={displaySettings.soundsVolume}
              onValueChange={handleSoundsVolumeChange}
            />
            <Text style={styles.sliderValue}>{displaySettings.soundsVolume}%</Text>
          </View>
        )}

        {/* Яркость */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Яркость экрана</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            step={0.01}
            value={brightness}
            onValueChange={handleBrightnessChange}
          />
          <Text style={styles.sliderValue}>{Math.round(brightness * 100)}%</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <PrimaryButton
          title="🔄 Сбросить настройки"
          onPress={handleResetSettings}
        />
        <PrimaryButton
          title="← Назад"
          onPress={() => navigation.goBack()}
        />
      </View>
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
    fontWeight: 'bold',
  },
  settingsContainer: {
    width: '100%',
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  settingValue: {
    fontSize: 14,
  },
  sliderContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
});
