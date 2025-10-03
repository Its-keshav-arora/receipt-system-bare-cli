import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Dirs, FileSystem } from 'react-native-file-access';
import XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';

interface CustomerRow {
  name?: string;
  box?: string;
  mobile?: string;
  balance?: number;
  curr?: number;
  address?: string;
}

const ImportPage = () => {
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';
  const [fileData, setFileData] = useState<CustomerRow[] | null>(null);

  const handleUploadToBackend = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!fileData) {
      Alert.alert('Error', 'No file data to upload');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customers: fileData }),
      });
      console.log("this is file data : ", fileData);
      console.log("This is result : ", res);

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || 'Upload failed');

      Alert.alert('✅ Upload Success', result.message || 'Data saved');
      setFileData(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('❌ Upload Failed', error.message || 'Something went wrong');
    }
  };

  const handleFilePick = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      // On Android, res.uri looks like: content://...
      const fileUri = res.uri;

      // Read as base64
      const bstr = await FileSystem.readFile(fileUri, 'base64');

      // Parse with XLSX
      const wb = XLSX.read(bstr, { type: 'base64' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: CustomerRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      setFileData(data);
      Alert.alert('✅ Success', 'Excel file loaded successfully!');
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled picker');
      } else {
        console.error('File pick error:', err);
        Alert.alert('Error', 'Could not read the Excel file.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📥 Import Excel Sheet</Text>

      <TouchableOpacity style={styles.uploadButton} onPress={handleFilePick}>
        <Text style={styles.uploadText}>📁 Load Excel from Documents</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: 'green', marginBottom: 10 }]}
        onPress={handleUploadToBackend}
      >
        <Text style={styles.uploadText}>Submit</Text>
      </TouchableOpacity>

      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>📄 Expected Format:</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.tableHeader}>
              <Text style={styles.cell}>name</Text>
              <Text style={styles.cell}>box</Text>
              <Text style={styles.cell}>mobile</Text>
              <Text style={styles.cell}>balance</Text>
              <Text style={styles.cell}>curr</Text>
              <Text style={styles.cell}>address</Text>
            </View>

            {fileData &&
              fileData.map((row, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.cell}>{row.name}</Text>
                  <Text style={styles.cell}>{row.box}</Text>
                  <Text style={styles.cell}>{row.mobile}</Text>
                  <Text style={styles.cell}>{row.balance}</Text>
                  <Text style={styles.cell}>{row.curr}</Text>
                  <Text style={styles.cell}>{row.address}</Text>
                </View>
              ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default ImportPage;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  uploadButton: {
    backgroundColor: '#4C8EF7',
    padding: 14,
    borderRadius: 10,
    marginBottom: 25,
    width: '100%',
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  cell: {
    width: 100,
    fontSize: 12,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
