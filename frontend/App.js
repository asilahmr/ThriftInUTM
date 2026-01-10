// frontend/App.js - Complete Enhanced Navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Chat Module Screens
import ChatListScreen from './src/screens/chat/ChatListScreen';
import ChatDetailScreen from './src/screens/chat/ChatDetailScreen';
import ChatSearchScreen from './src/screens/chat/ChatSearchScreen';
import ReportUserScreen from './src/screens/chat/ReportUserScreen';
import BlockUserScreen from './src/screens/chat/BlockUserScreen';

// Notification Module Screens
import NotificationListScreen from './src/screens/notifications/NotificationListScreen';
import NotificationSettingsScreen from './src/screens/notifications/NotificationSettingsScreen';

// Help Center Module Screens
import HelpCenterScreen from './src/screens/help/HelpCenterScreen';
import FAQScreen from './src/screens/help/FAQScreen';
import FAQDetailScreen from './src/screens/help/FAQDetailScreen';
import ContactSupportScreen from './src/screens/help/ContactSupportScreen';
import GuidesScreen from './src/screens/help/GuidesScreen';

// Feedback Module Screens
import FeedbackScreen from './src/screens/feedback/FeedbackScreen';
import FeedbackHistoryScreen from './src/screens/feedback/FeedbackHistoryScreen';
import RateAppScreen from './src/screens/feedback/RateAppScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ChatList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#B71C1C',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* ========================================== */}
        {/* CHAT MODULE SCREENS */}
        {/* ========================================== */}
        <Stack.Screen
          name="ChatList"
          component={ChatListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatDetail"
          component={ChatDetailScreen}
          options={({ route }) => ({
            title: route.params.isAI ? 'AI Assistant' : route.params.otherUsername,
            headerShown: true
          })}
        />
        <Stack.Screen
          name="ChatSearch"
          component={ChatSearchScreen}
          options={{
            title: 'Search Messages',
            presentation: 'modal'
          }}
        />
        <Stack.Screen
          name="ReportUser"
          component={ReportUserScreen}
          options={{
            title: 'Report User',
            presentation: 'modal'
          }}
        />
        <Stack.Screen
          name="BlockUser"
          component={BlockUserScreen}
          options={{
            title: 'Block User',
            presentation: 'modal'
          }}
        />

        {/* ========================================== */}
        {/* NOTIFICATION MODULE SCREENS */}
        {/* ========================================== */}
        <Stack.Screen
          name="NotificationList"
          component={NotificationListScreen}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{
            headerShown: false
          }}
        />

        {/* ========================================== */}
        {/* HELP CENTER MODULE SCREENS */}
        {/* ========================================== */}
        <Stack.Screen
          name="HelpCenter"
          component={HelpCenterScreen}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="FAQ"
          component={FAQScreen}
          options={({ route }) => ({
            title: route.params?.categoryName || 'FAQs',
            headerShown: true
          })}
        />
        <Stack.Screen
          name="FAQDetail"
          component={FAQDetailScreen}
          options={{
            title: 'Help Article',
            headerShown: true
          }}
        />
        <Stack.Screen
          name="ContactSupport"
          component={ContactSupportScreen}
          options={{
            title: 'Contact Support',
            headerShown: true
          }}
        />
        <Stack.Screen
          name="Guides"
          component={GuidesScreen}
          options={{
            title: 'Guides & Tutorials',
            headerShown: true
          }}
        />

        {/* ========================================== */}
        {/* FEEDBACK MODULE SCREENS */}
        {/* ========================================== */}
        <Stack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{
            title: 'Send Feedback',
            presentation: 'modal'
          }}
        />
        <Stack.Screen
          name="FeedbackHistory"
          component={FeedbackHistoryScreen}
          options={{
            title: 'My Feedback',
            headerShown: true
          }}
        />
        <Stack.Screen
          name="RateApp"
          component={RateAppScreen}
          options={{
            title: 'Rate ThriftIn',
            presentation: 'modal'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}