// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';

// Import screens
import MyItemsScreen from '../screens/MyItemsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MyItems"
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
        <Stack.Screen
          name="MyItems"
          component={MyItemsScreen}
          options={{
            title: 'My Items',
            headerLeft: null, // Remove back button on main screen
          }}
        />
        <Stack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={{
            title: 'Add New Product',
          }}
        />
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