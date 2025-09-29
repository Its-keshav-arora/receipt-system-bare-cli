import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../navigation/CustomerStack';  // 👈 updated import

type SearchType = 'box' | 'mobile' | 'name';

type Customer = {
  _id: string;
  name: string;
  boxNumbers: string[];
  pendingPayment: number;
  currentMonthPayment: number;
  mobile: number;
};

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const Customers = () => {
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';
  const navigation = useNavigation<NavProp>();

  const [open, setOpen] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('name');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [items, setItems] = useState([
    { label: 'Name', value: 'name' },
    { label: 'Box Number', value: 'box' },
    { label: 'Mobile Number', value: 'mobile' },
  ]);

  const handleSearch = async () => {
    if (!query) return Alert.alert('Please enter a search query.');
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BACKEND_URL}/api/customer/search`, {
        params: { type: searchType, query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to fetch customers.');
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({ item }: { item: Customer }) => {
    const total = item.pendingPayment + item.currentMonthPayment;

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.label}>Boxes: {item.boxNumbers.join(', ')}</Text>
        <Text style={styles.label}>Mobile: {item.mobile}</Text>
        <Text style={styles.total}>Total: ₹{Number(total).toFixed(2)}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonLeft}
            onPress={() => navigation.navigate('CustomerDetails', { customerId: item._id })}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonRight}
            onPress={() => navigation.navigate('PayBill', { customerId: item._id })}
          >
            <Text style={styles.viewButtonText}>Pay Bill</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Search Customer</Text>

      <DropDownPicker
        open={open}
        value={searchType}
        items={items}
        setOpen={setOpen}
        setValue={setSearchType}
        setItems={setItems}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownBox}
        placeholder="Select search type"
      />

      <TextInput
        placeholder={`Enter ${searchType}`}
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
    </View>
  );
};

export default Customers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F6F8',
    marginTop: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    marginBottom: 12,
    borderRadius: 8,
  },
  dropdownBox: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    color: '#555',
    marginBottom: 2,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    color: '#1A73E8',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  buttonLeft: {
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonRight: {
    backgroundColor: '#34A853',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
