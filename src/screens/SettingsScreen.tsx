import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import PrimaryButton from '../components/PrimaryButton';


export default function SettingsScreen({}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>НАСТРОЙКИ</Text>
      
      <View style={styles.settingsContainer}>
        {/* Музыка */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Музыка</Text>
            <Text style={styles.settingValue}>
              Вкл (70%)
            </Text>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
          />
        </View>
        
        {true && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость музыки</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={0.7}
              onValueChange={() => {}}
            />
          </View>
        )}

        {/* Звуки */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Звуки</Text>
            <Text style={styles.settingValue}>
              Вкл (80%)
            </Text>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
          />
        </View>
        
        {true && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Громкость звуков</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={0.8}
              onValueChange={() => {}}
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
            value={0.8}
            onValueChange={() => {}}
          />
          <Text style={styles.sliderValue}>80%</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <PrimaryButton
          title="Сбросить настройки"
          onPress={() => {
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