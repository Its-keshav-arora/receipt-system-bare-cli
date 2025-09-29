import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const Home = () => {
  const BACKEND_URL = "https://receipt-system-zf7s.onrender.com";
  const navigation = useNavigation<NavProp>();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      Alert.alert("Logged Out", "You have been logged out.");
      navigation.replace('Index');
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Something went wrong while logging out.");
    }
  };

  const handleExportExcel = async () => {
    Alert.alert(
      'Confirm Download',
      'Do you want to export customer data as an Excel file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Error', 'No token found');
                return;
              }

              const downloadUrl = `${BACKEND_URL}/api/customer/export`;
              const filePath = `${RNFS.DocumentDirectoryPath}/CustomerReport.csv`;

              const options = {
                fromUrl: downloadUrl,
                toFile: filePath,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              };

              const result = await RNFS.downloadFile(options).promise;
              if (result.statusCode === 200) {
                await Share.open({
                  url: 'file://' + filePath,
                  type: 'text/csv',
                  filename: 'CustomerReport.csv',
                });
              } else {
                Alert.alert('Error', `Download failed with status ${result.statusCode}`);
              }
            } catch (error) {
              console.error('Download error:', error);
              Alert.alert('Error', 'Failed to export file.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Dashboard</Text>
      <View style={styles.menuBox}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Customers')}
        >
          <Text style={styles.icon}>📊</Text>
          <Text style={styles.text}>View Customers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={handleExportExcel}
        >
          <Image
            source={require('../../assets/icons/excel_icon.jpg')}
            style={styles.icon}
          />
          <Text style={styles.text}>Export Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Import')}
        >
          <Image
            source={require('../../assets/icons/excel_icon.jpg')}
            style={styles.icon}
          />
          <Text style={styles.text}>Import Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('CollectionHistory')}
        >
          <Text style={styles.text}>📅 Collection Insights</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('AddCustomer')}
        >
          <Text style={styles.icon}>➕</Text>
          <Text style={styles.text}>Add Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.logout]}
          onPress={handleLogout}
        >
          <Text style={styles.icon}>🚪</Text>
          <Text style={styles.text}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#333' },
  menuBox: { justifyContent: 'space-evenly', width: '85%' },
  option: {
    backgroundColor: '#4C8EF7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 2,
  },
  text: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  icon: { width: 24, height: 24, resizeMode: 'contain' },
  logout: { backgroundColor: '#FF4C4C' },
});

export default Home;
