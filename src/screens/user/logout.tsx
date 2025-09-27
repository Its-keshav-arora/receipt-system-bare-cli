import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HomePage = () => {
  const navigation = useNavigation<NavProp>();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('email');
      await AsyncStorage.removeItem('mobile');

      Alert.alert('Logged Out', 'You have been logged out.');
      navigation.replace('Index'); // ✅ go back to login screen
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Something went wrong while logging out.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📋 Dashboard</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: '#FF4C4C',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
