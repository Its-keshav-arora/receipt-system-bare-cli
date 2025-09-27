import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Index from '../screens/index';
import Home from '../screens/home';
import CustomerDetails from '../screens/user/customerDetails';
import PayBill from '../screens/user/payBill';

export type RootStackParamList = {
  Index: undefined;
  Home: undefined;
  CustomerDetails: { customerId: string };
  PayBill: { customerId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Index" component={Index} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
      <Stack.Screen name="PayBill" component={PayBill} />
    </Stack.Navigator>
  );
}
