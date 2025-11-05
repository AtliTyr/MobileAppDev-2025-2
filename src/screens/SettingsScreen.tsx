import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import PrimaryButton from '../components/PrimaryButton';

export default function SettingsScreen() {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [brightness, setBrightness] = useState(0.8);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>НАСТРОЙКИ</Text>
      
      <View style={styles.settingsContainer}>
        {/* Музыка */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Музыка</Text>
            <Text style={styles.settingValue}>
              {musicEnabled ? 'Вкл' : 'Выкл'} ({Math.round(musicVolume * 100)}%)
            </Text>
          </View>
          <Switch
            value={musicEnabled}
            onValueChange={setMusicEnabled}
          />
        </View>
        
        {musicEnabled && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость музыки</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={musicVolume}
              onValueChange={setMusicVolume}
            />
          </View>
        )}

        {/* Звуки */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Звуки</Text>
            <Text style={styles.settingValue}>
              {soundEnabled ? 'Вкл' : 'Выкл'} ({Math.round(soundVolume * 100)}%)
            </Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
        </View>
        
        {soundEnabled && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость звуков</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={soundVolume}
              onValueChange={setSoundVolume}
            />
          </View>
        )}

        {/* Яркость */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Яркость экрана</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            value={brightness}
            onValueChange={setBrightness}
          />
          <Text style={styles.sliderValue}>{Math.round(brightness * 100)}%</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <PrimaryButton
          title="Сбросить настройки"
          onPress={() => {
            setMusicEnabled(true);
            setSoundEnabled(true);
            setMusicVolume(0.7);
            setSoundVolume(0.8);
            setBrightness(0.8);
          }}
        />
        
        <PrimaryButton
          title="Назад"
          onPress={() => {}}
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
    backgroundColor: '#E7ECEF',
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
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