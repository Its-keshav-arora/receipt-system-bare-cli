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
  PermissionsAndroid,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../navigation/CustomerStack';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BLEPrinter,
  IBLEPrinterIdentity,
  IPrintOptions,
} from '@xyzsola/react-native-thermal-printer';

type Customer = {
  _id: string;
  name: string;
  mobile: string;
  address: string;
  boxNumbers: string[];
  previousBalance: number;
  currentMonthPayment: number;
};

type PayBillRouteProp = RouteProp<CustomerStackParamList, 'PayBill'>;
type NavProp = NativeStackNavigationProp<CustomerStackParamList, 'PayBill'>;

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
  const [receiptText2, setReceiptText2] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [address, setAddress] = useState('');

  // Printer state
  const [printers, setPrinters] = useState<IBLEPrinterIdentity[]>([]);
  const [selectedPrinter, setSelectedPrinter] =
    useState<IBLEPrinterIdentity | null>(null);
  const [showPrinterList, setShowPrinterList] = useState(false);

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

            const { whatsappLink, smsLink, receipt, receipt2 } = await generateReceipt(
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
            setReceiptText(receipt);
            setReceiptText2(receipt2);
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
  ): Promise<{ receipt: string; whatsappLink: string; smsLink: string, receipt2: string; }> => {
    const receiptName = await AsyncStorage.getItem('name');
    const receiptNumber = await AsyncStorage.getItem('mobile');

    const boxes =
      boxNumbers && boxNumbers.length > 0 ? boxNumbers.join(', ') : 'N/A';

    const receipt = `<Printout>
  <Text align="center">
    ${receiptName || 'FW / Net+'}
  </Text>
  <NewLine />
  <NewLine />
  <Text align="left">Complaint:${receiptNumber || ''}</Text>
  <NewLine />
  <NewLine />
  <NewLine />

  <Text align="center">RECEIPT</Text>
  <NewLine />
  <Line lineChar="=" />

  <Text align="left">Name        : ${name}</Text>
  <NewLine />
  <Text align="left">Date        : ${date}</Text>
  <NewLine />
  <Text align="left">Time        : ${time}</Text>
  <NewLine />
  <Text align="left">Address     : ${address}</Text>
  <NewLine />
  <Text align="left">Box/Id      : ${boxes}</Text>
  <NewLine />
  <Text align="left">Amount Paid : Rs. ${Number(amount).toFixed(2)}</Text>
  <NewLine />
  <Text align="left">Method      : ${method}</Text>
  <NewLine />
  <NewLine />
  <Text align="left">Curr Outstanding : Rs. ${Number(newBalance).toFixed(2)}</Text>
  <NewLine />
  <Line lineChar="=" />
  <NewLine />

  <Text align="center">THANK YOU</Text>
  <NewLine />
</Printout>`;

    const receipt2 = `
  ${receiptName || 'FW / Net+'}
  Complaint : ${receiptNumber || ''} 
--------------------------- 
          RECEIPT 
--------------------------- 
  Name : ${name} 
  Date : ${date} 
  Time : ${time} 
  Address : ${address} 
  Box/Id : ${boxes} 
  Amount Paid : ₹${Number(amount).toFixed(2)}
  Method : ${method} 
---------------------------
 Current Outstanding : ₹${Number(newBalance).toFixed(2)} 
 --------------------------- 
 THANK YOU 🙏 `;

    const encodedMessage = encodeURIComponent(receipt2);
    const whatsappLink = `https://wa.me/91${customer?.mobile}?text=${encodedMessage}`;
    const smsLink = `sms:91${customer?.mobile}?body=${encodedMessage}`;

    return { receipt, whatsappLink, smsLink, receipt2 };
  };

  // ---------------- Permissions ----------------
  async function requestBluetoothPermissions() {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        // Android 12+
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        ]);
      } else {
        // Android 11 and below
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          // ⚠️ BLUETOOTH & BLUETOOTH_ADMIN are no longer typed in RN, so force string cast:
          "android.permission.BLUETOOTH" as any,
          "android.permission.BLUETOOTH_ADMIN" as any,
        ]);
      }
    }
  }

  // ---------------- Printer Functions ----------------
  const discoverPrinters = async () => {
    try {
      await requestBluetoothPermissions();
      await BLEPrinter.init();
      const devices = await BLEPrinter.getDeviceList();
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

  const connectToPrinter = async (printer: IBLEPrinterIdentity) => {
    try {
      await BLEPrinter.connectPrinter(printer.innerMacAddress);
      setSelectedPrinter(printer);
      setShowPrinterList(false);
      Alert.alert('Connected', `Connected to ${printer.deviceName}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to connect to printer.');
    }
  };

  const printReceipt = async () => {
    if (!selectedPrinter) {
      return Alert.alert('No Printer', 'Please select a printer first.');
    }

    try {
      const options: IPrintOptions = {
        beep: true,
        cut: false,
        tailingLine: true,
        encoding: 'UTF-8',
        codepage: 0,
        colWidth: 32,
      };
      const wrappedReceipt = receiptText;
      await BLEPrinter.print(wrappedReceipt, options);
      Alert.alert('Success', 'Receipt sent to printer!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to print.');
    }
  };
  // --------------------------------------------------

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
          <View style={styles.receiptContainer}>
            <TouchableOpacity
              onPress={() => setShowReceipt(false)}
              style={styles.closeIcon}
            >
              <Text style={{ fontSize: 20, color: '#000' }}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.receiptHeader}>🧾 Receipt Preview</Text>

            <ScrollView style={styles.receiptBox}>
              <Text style={styles.receiptText}>{receiptText2}</Text>
            </ScrollView>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={discoverPrinters}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>
                  {selectedPrinter
                    ? `Printer: ${selectedPrinter.deviceName}`
                    : 'Select Printer'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={printReceipt} style={styles.actionBtn}>
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
        </View>
      )}

      {/* Printer Selection */}
      {showPrinterList && (
        <View style={styles.overlay}>
          <View style={styles.receiptContainer}>
            <Text style={styles.receiptHeader}>Select a Printer</Text>
            {printers.map((printer) => (
              <TouchableOpacity
                key={printer.innerMacAddress}
                style={styles.dropdownOption}
                onPress={() => connectToPrinter(printer)}
              >
                <Text>
                  {printer.deviceName || printer.innerMacAddress}
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
