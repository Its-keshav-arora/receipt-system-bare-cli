import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CustomerStackParamList } from '../../navigation/CustomerStack';

type Payment = {
  date: string;
  time: string;
  amount: number;
  balance: number;
  method: string;
};

type Customer = {
  _id: string;
  name: string;
  mobile: string;
  address?: string;
  boxNumbers: string[];
  previousBalance: number;
  currentMonthPayment: number;
  history: Payment[];
};

type CustomerDetailRouteProp = RouteProp<CustomerStackParamList, 'CustomerDetails'>;
type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const CustomerDetail = () => {
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';
  const navigation = useNavigation<NavProp>();
  const route = useRoute<CustomerDetailRouteProp>();
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBox, setNewBox] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Receipt modal states
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [waLink, setWaLink] = useState('');
  const [smsLink, setSmsLink] = useState('');

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/customer/${customerId}`
      );
      setCustomer(data.customer);
    } catch (err) {
      Alert.alert('Error', 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const saveCustomer = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/customer/${customerId}`, customer);
      Alert.alert('Success', 'Customer updated');
    } catch {
      Alert.alert('Error', 'Could not update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBox = () => {
    if (!newBox.trim()) return;
    setCustomer((prev) =>
      prev ? { ...prev, boxNumbers: [...prev.boxNumbers, newBox.trim()] } : prev
    );
    setNewBox('');
  };

  const handleDeleteBox = (boxNumber: string) => {
    Alert.alert('Confirm', `Delete box ${boxNumber}?`, [
      {
        text: 'Delete',
        onPress: () =>
          setCustomer((prev) =>
            prev
              ? {
                  ...prev,
                  boxNumbers: prev.boxNumbers.filter((b) => b !== boxNumber),
                }
              : prev
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteCustomer = (customerId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${BACKEND_URL}/api/customer/delete/${customerId}`
              );
              Alert.alert('Success', 'Customer deleted successfully');
              navigation.goBack(); // ✅ replaced expo-router's router.back()
            } catch {
              Alert.alert('Error', 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const generateReceipt = async (entry: Payment) => {
    if (!customer) return;

    const boxes =
      customer.boxNumbers && customer.boxNumbers.length > 0
        ? customer.boxNumbers.join(', ')
        : 'N/A';

    const receiptName = await AsyncStorage.getItem('name');
    const receiptNumber = await AsyncStorage.getItem('mobile');

    const receipt = `
      ${receiptName}
Complaint : ${receiptNumber}

---------------------------
                 RECEIPT
---------------------------
Name        : ${customer.name}
Date        : ${entry.date}
Time        : ${entry.time}
Address     : ${customer.address || 'N/A'}
Box/Id      : ${boxes}
Amount Paid : ₹${Number(entry.amount).toFixed(2)}
Method      : ${entry.method}

---------------------------
Current Outstanding : ₹${entry.balance}
---------------------------

             THANK YOU
    `;

    const encodedMessage = encodeURIComponent(receipt);
    const whatsappLink = `https://wa.me/91${customer.mobile}?text=${encodedMessage}`;
    const smsLink = `sms:91${customer.mobile}?body=${encodedMessage}`;

    setReceiptText(receipt);
    setWaLink(whatsappLink);
    setSmsLink(smsLink);
    setShowReceipt(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  if (!customer) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.heading}>Customer Details</Text>
            <TouchableOpacity
              onPress={() => handleDeleteCustomer(customerId)}
              style={styles.deleteBtn}
            >
              <Image
                source={require('../../../assets/icons/delete_button.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={customer.name}
            onChangeText={(text) => setCustomer({ ...customer, name: text })}
          />

          <Text style={styles.label}>Mobile</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={customer.mobile}
            onChangeText={(text) => setCustomer({ ...customer, mobile: text })}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={customer.address || ''}
            onChangeText={(text) => setCustomer({ ...customer, address: text })}
          />

          {/* Boxes */}
          <Text style={[styles.subheading, { marginTop: 20 }]}>Boxes</Text>
          {customer.boxNumbers.map((box) => (
            <View key={box} style={styles.boxItem}>
              <Text style={styles.boxText}>{box}</Text>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteBox(box)}
              >
                <Text style={styles.deleteTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addBoxRow}>
            <TextInput
              placeholder="Add new box"
              style={[styles.input, { flex: 1 }]}
              value={newBox}
              onChangeText={setNewBox}
            />
            <TouchableOpacity onPress={handleAddBox} style={styles.addBtn}>
              <Text style={styles.addTxt}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Payments */}
          <Text style={styles.subheading}>Payments</Text>
          <Text style={styles.paymentText}>
            Previous Balance: ₹{Number(customer.previousBalance).toFixed(2)}
          </Text>
          <Text style={styles.paymentText}>
            Current Month: ₹{Number(customer.currentMonthPayment).toFixed(2)}
          </Text>
          <Text style={styles.paymentText}>
            Total Balance ₹
            {Number(
              customer.currentMonthPayment + customer.previousBalance
            ).toFixed(2)}
          </Text>

          {/* History Button */}
          <TouchableOpacity
            style={[
              styles.payBtn,
              { marginTop: 12, backgroundColor: '#F9AB00' },
            ]}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.payTxt}>
              {showHistory ? 'Hide History' : 'Show History'}
            </Text>
          </TouchableOpacity>

          {/* History Section */}
          {showHistory && (
            <View style={styles.historyContainer}>
              {customer.history.length === 0 ? (
                <Text style={styles.noHistoryText}>
                  No payment history available.
                </Text>
              ) : (
                [...customer.history].reverse().map((entry, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyText}>
                      ₹{entry.amount} on {entry.date} at {entry.time} via{' '}
                      {entry.method}
                    </Text>
                    <TouchableOpacity
                      style={styles.receiptBtn}
                      onPress={() => generateReceipt(entry)}
                    >
                      <Text style={styles.receiptBtnTxt}>Receipt</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity onPress={saveCustomer} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveTxt}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Receipt Modal */}
      {showReceipt && (
        <View style={styles.overlay}>
          <ScrollView
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <View style={styles.receiptContainer}>
              <TouchableOpacity
                onPress={() => setShowReceipt(false)}
                style={styles.closeIcon}
              >
                <Text style={{ fontSize: 20, color: '#000' }}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.receiptHeader}>🧾 Receipt Preview</Text>

              <ScrollView style={styles.receiptBox}>
                <Text style={styles.receiptText}>{receiptText}</Text>
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => console.log('print')}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Print</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Linking.openURL(waLink)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Linking.openURL(smsLink)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default CustomerDetail;

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F4F6F8', paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subheading: { fontSize: 18, fontWeight: '600', marginVertical: 12 },
  label: { fontSize: 14, marginTop: 12, color: '#333' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    fontSize: 16,
  },
  boxItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    paddingRight: 0,
    marginTop: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  boxText: { flex: 1, fontSize: 16 },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#EA4335',
    borderRadius: 12,
  },
  deleteTxt: { color: '#fff', fontWeight: 'bold' },
  addBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  addBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  addTxt: { color: '#fff', fontWeight: '600' },
  paymentText: { fontSize: 16, marginVertical: 4 },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
  payBtn: {
    marginTop: 14,
    backgroundColor: '#34A853',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payTxt: { color: '#fff', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  historyContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyText: { fontSize: 15, color: '#333', flex: 1 },
  noHistoryText: { fontSize: 15, color: '#888', fontStyle: 'italic' },
  receiptBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  receiptBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  receiptContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
  receiptHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  receiptBox: { maxHeight: 300, marginBottom: 16 },
  receiptText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '600' },
});
