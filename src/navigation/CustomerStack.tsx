// navigation/CustomerStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Customers from '../screens/user/customers';
import ImportPage from '../screens/user/import';
import CollectionHistory from '../screens/user/collectionHistory';
import AddCustomer from '../screens/user/addCustomer';
import CustomerDetails from '../screens/user/customerDetails';   // ✅ new
import PayBill from '../screens/user/payBill';                   // ✅ new

export type CustomerStackParamList = {
  Customers: undefined;
  ImportPage: undefined;
  CollectionHistory: undefined;
  AddCustomer: undefined;
  CustomerDetails: { customerId: string };  // ✅ pass ID
  PayBill: { customerId: string };          // ✅ pass ID
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Customers" component={Customers} />
      <Stack.Screen name="ImportPage" component={ImportPage} />
      <Stack.Screen name="CollectionHistory" component={CollectionHistory} />
      <Stack.Screen name="AddCustomer" component={AddCustomer} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
      <Stack.Screen name="PayBill" component={PayBill} />              
    </Stack.Navigator>
  );
}
