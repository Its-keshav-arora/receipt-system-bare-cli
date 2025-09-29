// navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Index from '../screens/index';
import Home from '../screens/home';
import CustomerStack from './CustomerStack';
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Index: undefined;
  Home: undefined;
  CustomerStack: NavigatorScreenParams<any>; // registered here
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Index" component={Index} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="CustomerStack" component={CustomerStack} /> 
    </Stack.Navigator>
  );
}
