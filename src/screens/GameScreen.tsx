import React from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text } from 'react-native';
import TetrisBoard from '../components/TetrisBoard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function GameScreen() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={statPanel.container}>
        <View style={statPanel.box}>
          <Text>ЛИНИИ</Text>
          <Text>6000</Text>
        </View>
        <View style={statPanel.box}>
          <Text>УРОВЕНЬ</Text>
          <Text>1</Text>
        </View>
        <View style={statPanel.box}>
          <Text>ОЧКИ</Text>
          <Text>1110</Text>
        </View>
      </View>
      
      <View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="pause-box-outline" size={30} color="black"/>
        </TouchableOpacity>
      </View>

      <View style={gameComponents.container}>
        <TouchableOpacity>
          <View style={gameComponents.box}>
            <Text>КАРМАН</Text>
            <View style={gameComponents.block}></View>
          </View>
        </TouchableOpacity>
        <TetrisBoard style={{}}/>
        <View style={gameComponents.box}>
          <Text>СЛЕД.</Text>
          <View style={gameComponents.block}></View>
          <View style={gameComponents.block}></View>
          <View style={gameComponents.block}></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const statPanel = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    marginBottom: 5,
    borderWidth: 3,
  },
  box: {
    outlineWidth: 3,
  },
});

const gameComponents = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-around',
  },
  box: {
    outlineWidth: 3,
    width: 60,
  },
  block: {
    height: 50,
  }
});