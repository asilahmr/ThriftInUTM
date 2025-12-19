// src/navigation/AppNavigator.js - UPDATED FOR MODULE 2
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import bottom tab navigator and screens
import BottomTabNavigator from './BottomTabNavigator';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import EditProductScreen from '../screens/EditProductScreen';

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
        {/* Main Bottom Tab Navigator (Home, Add, My Items) */}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;