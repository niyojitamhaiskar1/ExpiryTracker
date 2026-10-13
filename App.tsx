import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductProvider } from '@/context/ProductContext';
import DashboardScreen from '@/screens/DashboardScreen';
import AddProductScreen from '@/screens/AddProductScreen';
import ScannerScreen from '@/screens/ScannerScreen';
import ProductListScreen from '@/screens/ProductListScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import type { Category } from '@/types';

export type RootStackParamList = {
  Dashboard: undefined;
  AddProduct: { prefillExpiryIso?: string; imageUri?: string } | undefined;
  Scanner: undefined;
  ProductList: {
    title: string;
    initialCategory?: Category | 'All';
    statusFilter?: 'expired' | 'expiring-soon';
  };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <ProductProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#F9FAFB' }, headerShadowVisible: false }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan Packaging' }} />
            <Stack.Screen
              name="ProductList"
              component={ProductListScreen}
              options={({ route }) => ({ title: route.params.title })}
            />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ProductProvider>
    </SafeAreaProvider>
  );
}
