import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function Index() {
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const navigation = useNavigation<NavProp>();

  const handleSubmit = async () => {
    if (!email || !pass) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('name', data.user.name);
      await AsyncStorage.setItem('mobile', data.user.mobile);

      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert('Validation', 'Wrong email or password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 👋</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Icon name="mail" size={20} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Icon name="lock" size={20} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  inputGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: '#D1D5DB',
    paddingBottom: 8,
    marginBottom: 24,
  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  button: {
    backgroundColor: '#4F46E5',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});
