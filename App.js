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
import AdminReviewScreen from './screens/AdminReviewScreen';
import ReviewSubmissionScreen from './screens/ReviewSubmissionScreen';
import AdminHistoryScreen from './screens/AdminHistoryScreen';

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
        <Stack.Screen name="AdminReview" component={AdminReviewScreen} />
        <Stack.Screen name="AdminHistory" component={AdminHistoryScreen} />
        <Stack.Screen name="ReviewSubmission" component={ReviewSubmissionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
