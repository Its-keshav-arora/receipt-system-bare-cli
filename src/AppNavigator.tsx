// src/user/AppNavigator.tsx

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all screens
import Index from './screens'; // your login/index screen
import Home from './screens/home';
import Customers from './screens/user/customers';
import AddCustomer from './screens/user/addCustomer';
import PayBill from './screens/user/payBill';
import ImportPage from './screens/user/import';
import CollectionHistory from './screens/user/collectionHistory';
import Logout from './screens/user/logout'; // ✅ fixed, no HomePage

// Define stack params
export type RootStackParamList = {
  Index: undefined;
  Home: undefined;
  Customers: undefined;
  AddCustomer: undefined;
  PayBill: undefined;
  Import: undefined;
  CollectionHistory: undefined;
  Logout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Index">
        {/* Login screen */}
        <Stack.Screen name="Index" component={Index} options={{ title: 'Login', headerShown: false }} />

        {/* Dashboard screen */}
        <Stack.Screen name="Home" component={Home} options={{ title: 'Dashboard', headerShown: false }} />

        {/* Feature screens */}
        <Stack.Screen name="Customers" component={Customers} options={{ title: 'Customers' }} />
        <Stack.Screen name="AddCustomer" component={AddCustomer} options={{ title: 'Add Customer' }} />
        <Stack.Screen name="PayBill" component={PayBill} options={{ title: 'Pay Bill' }} />
        <Stack.Screen name="Import" component={ImportPage} options={{ title: 'Import Excel' }} />
        <Stack.Screen name="CollectionHistory" component={CollectionHistory} options={{ title: 'Collection History' }} />
        <Stack.Screen name="Logout" component={Logout} options={{ title: 'Logout' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
