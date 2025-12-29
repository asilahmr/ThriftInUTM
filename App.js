import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RecoverPasswordScreen from './screens/RecoverPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

// Student Profile Screens
import HomePage from './screens/HomePage'; 
import ProfileScreen from './screens/ProfileScreen';
import DetailsScreen from './screens/DetailsScreen';
import VerificationScreen from './screens/VerificationScreen';

// Admin Screens
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminReviewScreen from './screens/AdminReviewScreen';
import ReviewSubmissionScreen from './screens/ReviewSubmissionScreen';
import AdminHistoryScreen from './screens/AdminHistoryScreen';
import UserAccessManagementScreen from './screens/UserAccessManagementScreen';
import ReportDetailScreen from './screens/ReportDetailScreen'; 

// Demo Screens (for testing TransactionGuard)
import DemoMarketplaceScreen from './screens/DemoMarketplaceScreen'; // Demo
import DemoSellItemScreen from './screens/DemoSellItemScreen'; // Demo

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' }
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="RecoverPassword" component={RecoverPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        
        {/* Student Profile Screens */}
        <Stack.Screen name="Home" component={HomePage} /> 
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminReview" component={AdminReviewScreen} />
        <Stack.Screen name="AdminHistory" component={AdminHistoryScreen} />
        <Stack.Screen name="ReviewSubmission" component={ReviewSubmissionScreen} />
        
        {/* Admin - User Access Management */}
        <Stack.Screen name="UserAccessManagement" component={UserAccessManagementScreen} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
        
        {/* Demo Sell Item Screen (called from HomePage) */}
        <Stack.Screen name="DemoSellItem" component={DemoSellItemScreen} />
        <Stack.Screen name="DemoMarketplace" component={DemoMarketplaceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}