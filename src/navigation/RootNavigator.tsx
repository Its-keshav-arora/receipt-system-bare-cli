import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Index from '../screens/index';
import Home from '../screens/home';
import Tabs, {TabsParamList} from './Tabs';


export type RootStackParamList = {
  Index: undefined; // Login screen
  Home: undefined;  // Dashboard
  Tabs: { screen?: keyof TabsParamList };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Index" component={Index} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Tabs" component={Tabs} />
    </Stack.Navigator>
  );
}
