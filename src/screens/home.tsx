import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tabs from '../navigation/Tabs';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Dashboard</Text>
      <View style={styles.tabsWrapper}>
        <Tabs />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 12,
    color: '#333',
  },
  tabsWrapper: { flex: 1 },
});
