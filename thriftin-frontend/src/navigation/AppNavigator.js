// src/navigation/AppNavigator.js - UPDATED WITH WALLET MODULE
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import bottom tab navigator and screens
import BottomTabNavigator from './BottomTabNavigator';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import EditProductScreen from '../screens/EditProductScreen';

// MODULE 2: My Items (accessed from Profile)
import MyItemsScreen from '../screens/MyItemsScreen';

// MODULE 3: Purchasing & Payment Screens
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderReceiptScreen from '../screens/OrderReceiptScreen';

// MODULE 3: Wallet Screens
import MyWalletScreen from '../screens/MyWalletScreen';
import TopUpScreen from '../screens/TopUpScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        {/* Main Bottom Tab Navigator (Home, Add, Profile, Wallet) */}
        <Stack.Screen
          name="Main"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        
        {/* Product Details Screen */}
        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
          options={{ 
            headerShown: false,
            presentation: 'card'
          }}
        />
        
        {/* Edit Product Screen */}
        <Stack.Screen
          name="EditProduct"
          component={EditProductScreen}
          options={{
            title: 'Edit Product',
          }}
        />

        {/* My Items Screen (accessed from Profile) */}
        <Stack.Screen
          name="MyItems"
          component={MyItemsScreen}
          options={{
            title: 'My Listed Items',
          }}
        />

        {/* MODULE 3: Purchasing & Payment Screens */}
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{
            title: 'Checkout',
          }}
        />

        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{
            title: 'Payment',
          }}
        />

        <Stack.Screen
          name="OrderHistory"
          component={OrderHistoryScreen}
          options={{
            title: 'My Orders',
          }}
        />

        <Stack.Screen
          name="OrderReceipt"
          component={OrderReceiptScreen}
          options={{
            title: 'Order Receipt',
          }}
        />

        {/* MODULE 3: Wallet Screens */}
        <Stack.Screen
          name="MyWallet"
          component={MyWalletScreen}
          options={{
            title: 'My Wallet',
          }}
        />

        <Stack.Screen
          name="TopUp"
          component={TopUpScreen}
          options={{
            title: 'Top Up Wallet',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;