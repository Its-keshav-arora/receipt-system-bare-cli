import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, Image } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Index'>;

export default function Index() {
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
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

      navigation.replace('Home');  // goes to Home after login
    } catch (error: any) {
      Alert.alert('Validation', 'Wrong email or password');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Email Input */}
        <TextInput
          mode="flat"
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          left={
            <TextInput.Icon
              icon={() => (
                <Image
                  source={require('../../assets/icons/mail.png')}
                  style={styles.icon}
                />
              )}
            />
          }
          autoCapitalize="none"
          style={[styles.input, { color: '#000000' }]}
          theme={{
            roundness: 10,
            colors: {
              primary: '#4F46E5',
              onSurfaceVariant: '#9CA3AF',
            },
          }}
        />

        {/* Password Input */}
        <TextInput
          mode="flat"
          label="Password"
          placeholder="Enter your password"
          value={pass}
          onChangeText={setPass}
          secureTextEntry={!showPass}
          left={
            <TextInput.Icon
              icon={() => (
                <Image
                  source={require('../../assets/icons/lock.png')}
                  style={styles.icon}
                />
              )}
            />
          }
          right={
            <TextInput.Icon
              icon={() => (
                <Image
                  source={
                    showPass
                      ? require('../../assets/icons/eye.png')
                      : require('../../assets/icons/hide.png')
                  }
                  style={styles.icon}
                />
              )}
              onPress={() => setShowPass(!showPass)}
            />
          }
          style={[styles.input, { color: '#000000' }]}
          theme={{
            roundness: 10,
            colors: {
              primary: '#4F46E5',
              onSurfaceVariant: '#9CA3AF',
            },
          }}
        />

        {/* Login Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          Login
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 20, height: 20 },
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: { marginBottom: 18, backgroundColor: '#F9FAFB' },
  button: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    paddingVertical: 6,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
