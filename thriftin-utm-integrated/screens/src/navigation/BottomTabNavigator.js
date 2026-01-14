// src/navigation/BottomTabNavigator.js - UPDATED WITH 4 TABS
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../utils/constants';
import CustomHeader from '../../../components/CustomHeader';

// Import screens
import HomeScreen from '../../HomeScreen';
import AddProductScreen from '../../AddProductScreen';
import ProfileScreen from '../../ProfileScreen';
import MyWalletScreen from '../../MyWalletScreen';
import ChatListScreen from '../../chat/ChatListScreen';

const Tab = createBottomTabNavigator();

// Custom tab bar icons
const TabIcon = ({ focused, icon }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
  </View>
);

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chat',
          headerShown: true,
          title: 'Messages',
          header: (props) => <CustomHeader {...props} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💬" />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddProductScreen}
        options={{
          tabBarLabel: 'Add',
          headerShown: true,
          title: 'Add Item',
          header: (props) => <CustomHeader {...props} />,
          tabBarIcon: ({ focused }) => (
            <View style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={MyWalletScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💰" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconContainerFocused: {
    backgroundColor: COLORS.secondary + '30',
  },
  icon: {
    fontSize: 24,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default BottomTabNavigator;