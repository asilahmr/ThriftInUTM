// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../../../utils/constants';

/* =========================
   AUTH SCREENS
========================= */
import LoginScreen from '../../LoginScreen';
import RegisterScreen from '../../RegisterScreen';
import RecoverPasswordScreen from '../../RecoverPasswordScreen';
import ResetPasswordScreen from '../../ResetPasswordScreen';

/* =========================
   ANALYTICS / DASHBOARD 
========================= */
// import RoleSelectionScreen from '../../RoleSelectionScreen'; // Assuming this was moved to root of screens or verify location
// import DashboardMenu from '../../DashboardMenu'; // Verify if these are in screens root or subfolder
import SalesDashboard from '../../SalesDashboard';
import BuyerSpendingSummary from '../../BuyerSpendingSummary';
import CategoryProducts from '../../CategoryProducts';
import SoldItemScreen from '../../SoldItemScreen';
import BuyerCategoryDetail from '../../BuyerCategoryDetail';
import UserActivityDashboard from '../../UserActivityDashboard';
import AdminPanel from '../../AdminPanel';
import Chat from '../../Chat';

// Profile Screens
import DetailsScreen from '../../DetailsScreen';
import VerificationScreen from '../../VerificationScreen';

/* =========================
   MAIN APP 
========================= */
import BottomTabNavigator from './BottomTabNavigator';
import ProductDetailsScreen from '../../ProductDetailsScreen';

import EditProductScreen from '../../EditProductScreen';
import MyItemsScreen from '../../MyItemsScreen';

/* =========================
   MODULE 3: PURCHASE & WALLET
========================= */
import CheckoutScreen from '../../CheckoutScreen';
import PaymentScreen from '../../PaymentScreen';
import OrderHistoryScreen from '../../OrderHistoryScreen';
import OrderReceiptScreen from '../../OrderReceiptScreen';
import MyWalletScreen from '../../MyWalletScreen';
import TopUpScreen from '../../TopUpScreen';

/* =========================
   ADMIN SCREENS
========================= */
import AdminHomeScreen from '../../AdminHomeScreen';
import AdminReviewScreen from '../../AdminReviewScreen';
import ReviewSubmissionScreen from '../../ReviewSubmissionScreen';
import AdminHistoryScreen from '../../AdminHistoryScreen';
import UserAccessManagementScreen from '../../UserAccessManagementScreen';
import ReportDetailScreen from '../../ReportDetailScreen';

/* =========================
   CHAT MODULE
========================= */
import ChatListScreen from '../../chat/ChatListScreen';
import ChatDetailScreen from '../../chat/ChatDetail';
import ChatSearchScreen from '../../chat/ChatSearchScreen';
import ReportUserScreen from '../../chat/ReportUserScreen';
import BlockUserScreen from '../../chat/BlockUserScreen';

/* =========================
   NOTIFICATION MODULE
========================= */
import NotificationListScreen from '../../notifications/NotificationListScreen';
import NotificationSettingsScreen from '../../notifications/NotificationSettingsScreen';

/* =========================
   HELP CENTER MODULE
========================= */
import HelpCenterScreen from '../../help/HelpCenterScreen';
import FAQScreen from '../../help/FAQScreen';
import FAQDetailScreen from '../../help/FAQDetailScreen';
import ContactSupportScreen from '../../help/ContactSupportScreen';
import GuidesScreen from '../../help/GuidesScreen';

/* =========================
   FEEDBACK MODULE
========================= */
import FeedbackScreen from '../../feedback/FeedbackScreen';
import FeedbackHistoryScreen from '../../feedback/FeedbackHistoryScreen';
import RateAppScreen from '../../feedback/RateAppScreen';

const Stack = createStackNavigator();

import CustomHeader from '../../../components/CustomHeader';

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          header: (props) => <CustomHeader {...props} />,
          headerShown: true,
        }}
      >

        {/* =========================
            AUTH FLOW
        ========================= */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        <Stack.Screen name="RecoverPassword" component={RecoverPasswordScreen} options={{ title: 'Recover Password' }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />

        {/* =========================
            MAIN APP (Bottom Tabs)
        ========================= */}
        <Stack.Screen
          name="Main"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Product Flow */}
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
        <Stack.Screen name="MyItems" component={MyItemsScreen} options={{ title: 'My Items' }} />

        {/* =========================
            PURCHASE & WALLET
        ========================= */}
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
        <Stack.Screen name="OrderReceipt" component={OrderReceiptScreen} options={{ title: 'Order Receipt' }} />
        <Stack.Screen name="MyWallet" component={MyWalletScreen} options={{ title: 'My Wallet' }} />
        <Stack.Screen name="TopUp" component={TopUpScreen} options={{ title: 'Top Up Wallet' }} />

        {/* =========================
            PROFILE SCREENS
        ========================= */}
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'My Details' }} />
        <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Verification' }} />

        {/* =========================
            ADMIN FLOW
        ========================= */}
        <Stack.Screen
          name="AdminDashboard"
          component={AdminHomeScreen}
          options={{
            title: 'Admin Dashboard',
            headerLeft: () => null,
            gestureEnabled: false
          }}
        />
        <Stack.Screen name="AdminReview" component={AdminReviewScreen} options={{ title: 'Review Reports' }} />
        <Stack.Screen name="ReviewSubmission" component={ReviewSubmissionScreen} options={{ title: 'Submission Details' }} />
        <Stack.Screen name="AdminHistory" component={AdminHistoryScreen} options={{ title: 'Verification History' }} />
        <Stack.Screen name="UserAccessManagement" component={UserAccessManagementScreen} options={{ title: 'User Access' }} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report Detail' }} />

        {/* =========================
            ANALYTICS / DASHBOARD FLOW
        ========================= */}
        {/*
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="DashboardMenu"
          component={DashboardMenu}
        />
        */}



        <Stack.Screen
          name="UserActivityDashboard"
          component={UserActivityDashboard}
          options={{ title: 'User Activity' }}
        />
        <Stack.Screen
          name="SalesDashboard"
          component={SalesDashboard}
          options={{ title: 'Sales Dashboard' }}
        />

        <Stack.Screen
          name="BuyerSpendingSummary"
          component={BuyerSpendingSummary}
          options={{ title: 'Buyer Spending Summary' }}
        />

        <Stack.Screen
          name="CategoryProducts"
          component={CategoryProducts}
        />

        <Stack.Screen
          name="SoldItemScreen"
          component={SoldItemScreen}
          options={{ title: 'Sale Details' }}
        />

        <Stack.Screen
          name="BuyerCategoryDetail"
          component={BuyerCategoryDetail}
        />



        <Stack.Screen
          name="AdminPanel"
          component={AdminPanel}
          options={{ title: 'Admin Panel' }}
        />

        <Stack.Screen
          name="Chat"
          component={Chat}
          options={{ title: 'Chat' }}
        />

        {/* =========================
            CHAT MODULE SCREENS
        ========================= */}
        <Stack.Screen
          name="ChatList"
          component={ChatListScreen}
          options={{ title: 'Messages' }}
        />
        <Stack.Screen
          name="ChatDetail"
          component={ChatDetailScreen}
          options={({ route }) => ({
            title: route.params?.isAI ? 'AI Assistant' : route.params?.otherUsername || 'Chat',
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

        {/* =========================
            NOTIFICATION MODULE SCREENS
        ========================= */}
        <Stack.Screen
          name="NotificationList"
          component={NotificationListScreen}
          options={{ title: 'Notifications' }}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ title: 'Notification Settings' }}
        />

        {/* =========================
            HELP CENTER MODULE SCREENS
        ========================= */}
        <Stack.Screen
          name="HelpCenter"
          component={HelpCenterScreen}
          options={{ title: 'Help Center' }}
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

        {/* =========================
            FEEDBACK MODULE SCREENS
        ========================= */}
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
};

export default AppNavigator;