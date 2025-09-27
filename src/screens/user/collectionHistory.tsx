import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs'; // ✅ replaces expo-file-system
import Share from 'react-native-share'; // ✅ replaces expo-sharing

const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';

const CollectionHistory = () => {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // ✅ format date to YYYY-MM-DD for API
  const formatForApi = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleFetch = async () => {
    if (!fromDate || !toDate) {
      Alert.alert('Select dates', 'Please select both From and To dates');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BACKEND_URL}/api/customer/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: formatForApi(fromDate),
          to: formatForApi(toDate),
        },
      });

      setResults(res.data.payments || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not fetch collection history.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!fromDate || !toDate) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const url = `${BACKEND_URL}/api/customer/history/export?from=${formatForApi(
        fromDate
      )}&to=${formatForApi(toDate)}`;

      const filePath = `${RNFS.DocumentDirectoryPath}/CollectionHistory.xlsx`;

      const downloadRes = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        headers: { Authorization: `Bearer ${token}` },
      }).promise;

      if (downloadRes.statusCode === 200) {
        await Share.open({
          url: 'file://' + filePath,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else {
        Alert.alert('Error', 'Download failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to export history.');
    }
  };

  const formatDate = (date: Date | null) =>
    date
      ? `${date.getDate().toString().padStart(2, '0')}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`
      : 'Select';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Collection History</Text>

      {/* Date Pickers */}
      <View style={styles.row}>
        <Text style={styles.label}>From:</Text>
        <TouchableOpacity
          onPress={() => setShowPicker('from')}
          style={styles.dateBtn}
        >
          <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.label}>To:</Text>
        <TouchableOpacity
          onPress={() => setShowPicker('to')}
          style={styles.dateBtn}
        >
          <Text style={styles.dateText}>{formatDate(toDate)}</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(e, selected) => {
            setShowPicker(null);
            if (selected) {
              showPicker === 'from' ? setFromDate(selected) : setToDate(selected);
            }
          }}
        />
      )}

      <TouchableOpacity style={styles.fetchBtn} onPress={handleFetch}>
        <Text style={styles.fetchText}>🔍 Show Collection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
        <Text style={styles.exportText}>📤 Export Excel</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nameText}>👤 {item.name}</Text>
              <Text style={styles.infoText}>📞 {item.mobile}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.amountText}>₹{item.amount}</Text>
                <Text style={styles.methodText}>{item.method}</Text>
              </View>
              <Text style={styles.timeText}>
                🕒 {item.date} at {item.time}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default CollectionHistory;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB', paddingTop: 80 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  label: { fontSize: 16, fontWeight: '600', marginHorizontal: 4 },
  dateBtn: {
    backgroundColor: '#E2E8F0',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dateText: { fontSize: 15 },
  fetchBtn: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  fetchText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  exportBtn: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  exportText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nameText: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  infoText: { fontSize: 14, color: '#555' },
  amountText: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#e0f2fe',
    color: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  timeText: { fontSize: 13, color: '#666', marginTop: 4 },
});
