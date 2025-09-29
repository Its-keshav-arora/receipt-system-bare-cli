import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Customers from '../screens/user/customers';
import CustomerDetails from '../screens/user/customerDetails';
import PayBill from '../screens/user/payBill';

export type CustomerStackParamList = {
  Customers: undefined;
  CustomerDetails: { customerId: string };
  PayBill: { customerId: string };
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Customers" component={Customers} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
      <Stack.Screen name="PayBill" component={PayBill} />
    </Stack.Navigator>
  );
}
