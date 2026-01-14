// BottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function BottomNav({ navigation, active }) {
  const navItems = [
    { label: 'Home', icon: 'home', screen: 'AdminHome' },
    { label: 'User Activity', icon: 'chart-bar', screen: 'UserActivity' },
    { label: 'Buyer Spending', icon: 'th', screen: 'BuyerSpending' },
    { label: 'Sales Performance', icon: 'chart-line', screen: 'SalesPerformance' },
    { label: 'Chat', icon: 'chat', screen: 'Chat' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => navigation.navigate(item.screen)}
        >
          <FontAwesome5
            name={item.icon}
            size={20}
            color={active === item.screen ? '#B71C1C' : '#555'}
          />
          <Text style={[styles.label, { color: active === item.screen ? '#B71C1C' : '#555' }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  button: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
});