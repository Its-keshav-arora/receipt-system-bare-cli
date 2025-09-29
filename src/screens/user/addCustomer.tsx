import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const AddCustomer = () => {
  const navigation = useNavigation<NavProp>();
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [currentMonthPayment, setCurrentMonthPayment] = useState('');
  const [boxInput, setBoxInput] = useState('');
  const [boxNumbers, setBoxNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddBox = () => {
    if (!boxInput.trim()) return;
    setBoxNumbers([...boxNumbers, boxInput.trim()]);
    setBoxInput('');
  };

  const handleCreateCustomer = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!name || !mobile) {
      Alert.alert('Error', 'Name and Mobile are required');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/customer/create`,
        {
          name,
          mobile,
          address,
          currentMonthPayment: parseFloat(currentMonthPayment || '0'),
          boxNumbers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Customer created successfully');
      navigation.goBack();
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Add Customer</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
      />

      <Text style={styles.label}>Mobile *</Text>
      <TextInput
        style={styles.input}
        value={mobile}
        onChangeText={setMobile}
        placeholder="Enter mobile"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, { height: 70 }]}
        value={address}
        onChangeText={setAddress}
        placeholder="Enter address"
        multiline
      />

      <Text style={styles.label}>Current Month Payment</Text>
      <TextInput
        style={styles.input}
        value={currentMonthPayment}
        onChangeText={setCurrentMonthPayment}
        placeholder="₹ 0"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Boxes</Text>
      {boxNumbers.map((box, index) => (
        <View key={index} style={styles.boxItem}>
          <Text>{box}</Text>
        </View>
      ))}
      <View style={styles.boxRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Enter box number"
          value={boxInput}
          onChangeText={setBoxInput}
        />
        <TouchableOpacity onPress={handleAddBox} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleCreateCustomer} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>
          {loading ? 'Creating...' : 'Create Customer'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddCustomer;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F4F6F8', paddingTop: 80 },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: { fontSize: 16, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#1A73E8',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  boxItem: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  addBtn: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
});
