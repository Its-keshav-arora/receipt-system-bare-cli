import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const base64Encode = (str: string) => {
  return Buffer.from(str, 'utf-8').toString('base64');
};

declare const Buffer: {
  from(
    input: string | Uint8Array,
    encoding?: string
  ): { toString(encoding?: string): string };
};

let ThermalPrinter: any;
ThermalPrinter = require('react-native-thermal-receipt-printer-image-qr');

type Customer = {
  _id: string;
  name: string;
  mobile: string;
  address: string;
  boxNumbers: string[];
  previousBalance: number;
  currentMonthPayment: number;
};

type PayBillRouteProp = RouteProp<RootStackParamList, 'PayBill'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const Payment = () => {
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';

  const route = useRoute<PayBillRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [waLink, setWaLink] = useState('');
  const [smsLink, setSmsLink] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [address, setAddress] = useState('');
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<any | null>(null);
  const [showPrinterList, setShowPrinterList] = useState(false);

  const [rawbtConnected, setRawbtConnected] = useState(false);

  const paymentMethods = ['Cash', 'GPay', 'PhonePe', 'Paytm', 'Other'];

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/customer/${customerId}`
      );
      setCustomer(data.customer);
      setAddress(data.customer.address);
    } catch (err) {
      Alert.alert('Error', 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!amountPaid || isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
      return Alert.alert('Validation', 'Please enter a valid amount');
    }

    Alert.alert('Confirm Payment', `Pay ₹${amountPaid} via ${paymentMethod}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setPaying(true);

            const response = await axios.post(`${BACKEND_URL}/api/receipt`, {
              customerId,
              amountPaid: Number(amountPaid),
              paymentMethod,
            });

            const { newBalance, date, time } = response.data;

            const { whatsappLink, smsLink } = await generateReceipt(
              customer?.name || '',
              amountPaid,
              paymentMethod,
              date,
              time,
              String(newBalance),
              customer?.boxNumbers
            );

            setWaLink(whatsappLink);
            setSmsLink(smsLink);
            setShowReceipt(true);
          } catch (err) {
            Alert.alert('Error', 'Failed to record payment');
          } finally {
            setPaying(false);
          }
        },
      },
    ]);
  };

  const generateReceipt = async (
    name: string,
    amount: string,
    method: string,
    date: string,
    time: string,
    newBalance: string,
    boxNumbers?: string[]
  ): Promise<{ receipt: string; whatsappLink: string; smsLink: string }> => {
    const receiptName = await AsyncStorage.getItem('name');
    const receiptNumber = await AsyncStorage.getItem('mobile');

    const boxes =
      boxNumbers && boxNumbers.length > 0 ? boxNumbers.join(', ') : 'N/A';
    const receipt = `

${receiptName || 'FW / Net+'}
Complaint : ${receiptNumber || '9217092170'}

---------------------------
                 RECEIPT
---------------------------
Name        : ${name}
Date        : ${date}
Time        : ${time}
Address     : ${address}
Box/Id      : ${boxes}
Amount Paid : ₹${Number(amount).toFixed(2)}
Method      : ${method}

---------------------------
Current Outstanding : ₹${Number(newBalance).toFixed(2)}
---------------------------

             THANK YOU
`;

    const encodedMessage = encodeURIComponent(receipt);
    const whatsappLink = `https://wa.me/91${customer?.mobile}?text=${encodedMessage}`;
    const smsLink = `sms:91${customer?.mobile}?body=${encodedMessage}`;

    setReceiptText(receipt);
    setShowReceipt(true);

    return { receipt, whatsappLink, smsLink };
  };

  // ------------------ Rawbt Printer ------------------
  const connectRawbt = async () => {
    try {
      await Linking.openURL('rawbt:');
      setRawbtConnected(true);
      Alert.alert('Success', 'Rawbt app opened! Connect your USB printer.');
    } catch (err) {
      Alert.alert(
        'Error',
        'Failed to open Rawbt app. Make sure it is installed.'
      );
    }
  };

  const printViaRawbt = async () => {
    if (!rawbtConnected) {
      return Alert.alert(
        'Rawbt Not Connected',
        'Please connect to Rawbt first.'
      );
    }

    try {
      const commands = [
        '\x1B\x40',
        '\x1B\x61\x01',
        '-------------------------------\n',
        '\x1B\x21\x10',
        'RECEIPT\n',
        '\x1B\x21\x00',
        '-------------------------------\n',
        receiptText + '\n',
        '\n\n\n',
        '\x1D\x56\x41\x03',
      ].join('');

      const base64Commands = base64Encode(commands);
      await Linking.openURL(`rawbt:base64,${base64Commands}`);
      Alert.alert('Success', 'Receipt sent to Rawbt printer!');
    } catch (err) {
      Alert.alert('Error', 'Failed to print via Rawbt.');
    }
  };
  // --------------------------------------------------

  const discoverPrinters = async () => {
    try {
      await ThermalPrinter.BLEPrinter.init();
      const devices = await ThermalPrinter.BLEPrinter.getDeviceList();
      if (devices.length === 0) {
        Alert.alert('No Printers Found', 'Please pair a Bluetooth printer first.');
      } else {
        setPrinters(devices);
        setShowPrinterList(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to scan printers.');
    }
  };

  const connectToPrinter = async (printer: any) => {
    try {
      await ThermalPrinter.BLEPrinter.connectPrinter(
        printer.inner_mac_address
      );
      setSelectedPrinter(printer);
      setShowPrinterList(false);
      Alert.alert('Connected', `Connected to ${printer.device_name}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to connect to printer.');
    }
  };

  const printReceipt = async () => {
    if (!selectedPrinter) {
      Alert.alert('No Printer', 'Please select a printer first.');
      return;
    }

    try {
      await ThermalPrinter.BLEPrinter.printText(receiptText + '\n\n\n');
      Alert.alert('Success', 'Receipt sent to printer!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to print.');
    }
  };

  if (loading || !customer) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  const totalBalance = customer.previousBalance + customer.currentMonthPayment;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Pay Bill</Text>

          <Label text="Name" />
          <TextInput style={styles.input} value={customer.name} editable={false} />

          <Label text="Mobile" />
          <TextInput style={styles.input} value={customer.mobile} editable={false} />

          <Label text="Address" />
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={customer.address || ''}
            editable={false}
            multiline
          />

          <Label text="Boxes" />
          <TextInput
            style={styles.input}
            value={customer.boxNumbers.join(', ')}
            editable={false}
          />

          <Label text="Total Balance" />
          <TextInput
            style={styles.input}
            value={`₹${totalBalance}`}
            editable={false}
          />

          <Label text="Amount Paid" />
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            keyboardType="numeric"
            value={amountPaid}
            onChangeText={setAmountPaid}
          />

          <Label text="Payment Method" />
          <View style={styles.dropdown}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.dropdownOption,
                  paymentMethod === method && styles.selectedOption,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.optionText,
                    paymentMethod === method && { color: '#fff' },
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            onPress={handlePayment}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payText}>Pay Bill</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.receiptContainer}>
              <TouchableOpacity
                onPress={() => setShowReceipt(false)}
                style={styles.closeIcon}
              >
                <Text style={{ fontSize: 20, color: '#000' }}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.receiptHeader}>🧾 Receipt Preview</Text>

              <ScrollView
                style={styles.receiptBox}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.receiptText}>{receiptText}</Text>
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={connectRawbt}
                  style={[
                    styles.actionBtn,
                    rawbtConnected && { backgroundColor: '#4CAF50' },
                  ]}
                >
                  <Text style={styles.actionBtnText}>
                    {rawbtConnected ? 'Rawbt Connected' : 'Connect Rawbt'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={printViaRawbt}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Print via Rawbt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={discoverPrinters}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>
                    {selectedPrinter
                      ? `Printer: ${selectedPrinter.device_name}`
                      : 'Select Printer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={printReceipt} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Print BLE</Text>
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

      {/* Printer Selection */}
      {showPrinterList && (
        <View style={styles.overlay}>
          <View style={styles.receiptContainer}>
            <Text style={styles.receiptHeader}>Select a Printer</Text>
            {printers.map((printer) => (
              <TouchableOpacity
                key={printer.inner_mac_address}
                style={styles.dropdownOption}
                onPress={() => connectToPrinter(printer)}
              >
                <Text>
                  {printer.device_name || printer.inner_mac_address}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowPrinterList(false)}>
              <Text style={{ textAlign: 'center', marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default Payment;

const Label = ({ text }: { text: string }) => (
  <Text style={styles.label}>{text}</Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F6F8',
    position: 'relative',
    top: 50,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginTop: 14,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dropdownOption: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  selectedOption: {
    backgroundColor: '#1A73E8',
  },
  optionText: {
    fontSize: 14,
    color: '#000',
  },
  payBtn: {
    marginTop: 24,
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
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
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    position: 'relative',
  },
  receiptHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  receiptBox: {
    maxHeight: 300,
    marginBottom: 16,
  },
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
    zIndex: 10,
    padding: 6,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
