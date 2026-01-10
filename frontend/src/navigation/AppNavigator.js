import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Chat Module Screens
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';
import ChatSearchScreen from '../screens/chat/ChatSearchScreen';
import ReportUserScreen from '../screens/chat/ReportUserScreen';
import BlockUserScreen from '../screens/chat/BlockUserScreen';

// Notification Module Screens
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import NotificationSettingsScreen from '../screens/notifications/NotificationSettingsScreen';

// Help Center Module Screens
import HelpCenterScreen from '../screens/help/HelpCenterScreen';
import FAQScreen from '../screens/help/FAQScreen';
import FAQDetailScreen from '../screens/help/FAQDetailScreen';
import ContactSupportScreen from '../screens/help/ContactSupportScreen';
import GuidesScreen from '../screens/help/GuidesScreen';

// Feedback Module Screens
import FeedbackScreen from '../screens/feedback/FeedbackScreen';
import FeedbackHistoryScreen from '../screens/feedback/FeedbackHistoryScreen';
import RateAppScreen from '../screens/feedback/RateAppScreen';

const Stack = createNativeStackNavigator();

const ChatNavigator = () => {
  return (
    <Stack.Navigator
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
        })}
      />
      <Stack.Screen
        name="ChatSearch"
        component={ChatSearchScreen}
        options={{
          title: 'Search Messages',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

const NotificationNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="NotificationList"
        component={NotificationListScreen}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
    </Stack.Navigator>
  );
};

const HelpNavigator = () => {
  return (
    <Stack.Navigator
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
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={({ route }) => ({
          title: route.params?.categoryName || 'FAQs',
        })}
      />
      <Stack.Screen
        name="FAQDetail"
        component={FAQDetailScreen}
        options={{ title: 'Help Article' }}
      />
      <Stack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ title: 'Contact Support' }}
      />
      <Stack.Screen
        name="Guides"
        component={GuidesScreen}
        options={{ title: 'Guides & Tutorials' }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
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
      {/* Main Chat Navigation */}
      <Stack.Screen
        name="ChatMain"
        component={ChatNavigator}
        options={{ headerShown: false }}
      />

      {/* Notification Navigation */}
      <Stack.Screen
        name="NotificationMain"
        component={NotificationNavigator}
        options={{ headerShown: false }}
      />

      {/* Help Center Navigation */}
      <Stack.Screen
        name="HelpMain"
        component={HelpNavigator}
        options={{ headerShown: false }}
      />

      {/* Modal Screens */}
      <Stack.Screen
        name="ReportUser"
        component={ReportUserScreen}
        options={{
          title: 'Report User',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="BlockUser"
        component={BlockUserScreen}
        options={{
          title: 'Block User',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          title: 'Send Feedback',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="FeedbackHistory"
        component={FeedbackHistoryScreen}
        options={{ title: 'My Feedback' }}
      />
      <Stack.Screen
        name="RateApp"
        component={RateAppScreen}
        options={{
          title: 'Rate ThriftIn',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

// Alternative: Simpler flat navigation (matches original App.js structure)
export const FlatAppNavigator = () => {
  return (
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
      {/* Chat Module */}
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={({ route }) => ({ title: route.params.isAI ? 'AI Assistant' : route.params.otherUsername })} />
      <Stack.Screen name="ChatSearch" component={ChatSearchScreen} options={{ title: 'Search Messages', presentation: 'modal' }} />
      <Stack.Screen name="ReportUser" component={ReportUserScreen} options={{ title: 'Report User', presentation: 'modal' }} />
      <Stack.Screen name="BlockUser" component={BlockUserScreen} options={{ title: 'Block User', presentation: 'modal' }} />

      {/* Notification Module */}
      <Stack.Screen name="NotificationList" component={NotificationListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />

      {/* Help Center Module */}
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={({ route }) => ({ title: route.params?.categoryName || 'FAQs' })} />
      <Stack.Screen name="FAQDetail" component={FAQDetailScreen} options={{ title: 'Help Article' }} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={{ title: 'Contact Support' }} />
      <Stack.Screen name="Guides" component={GuidesScreen} options={{ title: 'Guides & Tutorials' }} />

      {/* Feedback Module */}
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Send Feedback', presentation: 'modal' }} />
      <Stack.Screen name="FeedbackHistory" component={FeedbackHistoryScreen} options={{ title: 'My Feedback' }} />
      <Stack.Screen name="RateApp" component={RateAppScreen} options={{ title: 'Rate ThriftIn', presentation: 'modal' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;