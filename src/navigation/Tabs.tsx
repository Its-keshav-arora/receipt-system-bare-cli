import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Import from '../screens/user/import';
import CollectionHistory from '../screens/user/collectionHistory';
import AddCustomer from '../screens/user/addCustomer';
import Logout from '../screens/user/logout';
import CustomerStack from './CustomerStack';

export type TabsParamList = {
  CustomersTab: undefined;
  Import: undefined;
  History: undefined;
  AddCustomer: undefined;
  Logout: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export default function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="CustomersTab" component={CustomerStack} />
      <Tab.Screen name="Import" component={Import} />
      <Tab.Screen name="History" component={CollectionHistory} />
      <Tab.Screen name="AddCustomer" component={AddCustomer} />
      <Tab.Screen name="Logout" component={Logout} />
    </Tab.Navigator>
  );
}
