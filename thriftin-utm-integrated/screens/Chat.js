
import React from 'react';
import { View, Text } from 'react-native';

export default function Chat() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, color: '#B71C1C', fontWeight: 'bold' }}>Chat Module</Text>
        <Text style={{ color: '#888', marginTop: 10 }}>This is a placeholder for the chat feature.</Text>
      </View>
    </View>
  );
}