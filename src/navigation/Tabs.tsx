import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Customers from '../screens/user/customers';
import Import from '../screens/user/import';
import CollectionHistory from '../screens/user/collectionHistory';
import AddCustomer from '../screens/user/addCustomer';
import Logout from '../screens/user/logout';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Customers" component={Customers} />
      <Tab.Screen name="Import" component={Import} />
      <Tab.Screen name="History" component={CollectionHistory} />
      <Tab.Screen name="AddCustomer" component={AddCustomer} />
      <Tab.Screen name="Logout" component={Logout} />
    </Tab.Navigator>
  );
}
