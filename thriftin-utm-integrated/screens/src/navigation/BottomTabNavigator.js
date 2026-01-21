import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import CustomHeader from '../../../components/CustomHeader';
import api from '../../../utils/api';

import HomeScreen from '../../HomeScreen';
import AddProductScreen from '../../AddProductScreen';
import ProfileScreen from '../../ProfileScreen';
import MyWalletScreen from '../../MyWalletScreen';
import ChatListScreen from '../../chat/ChatListScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, icon }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
  </View>
);

const BottomTabNavigator = () => {
  const [restrictionModal, setRestrictionModal] = useState(false);
  const [restrictions, setRestrictions] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleResendVerification = async () => {
    try {
      await api.post('/api/email/resend-verification');
      alert('Verification email sent! Please check your inbox.');
      setRestrictionModal(false);
    } catch (error) {
      console.error('Resend verification error:', error);
      alert('Failed to send verification email');
    }
  };

  const getRestrictionIcon = (type) => {
    switch (type) {
      case 'suspended':
      case 'permanently_suspended':
        return 'ban';
      case 'email_unverified':
        return 'mail-unread';
      case 'matric_unverified':
        return 'school';
      case 'under_investigation':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getRestrictionColor = (type) => {
    switch (type) {
      case 'permanently_suspended':
        return '#DC2626';
      case 'suspended':
      case 'under_investigation':
        return '#D97706';
      case 'email_unverified':
      case 'matric_unverified':
        return '#7C3AED';
      default:
        return '#6B7280';
    }
  };

  return (
    <>
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
          listeners={({ navigation }) => ({
            tabPress: async (e) => {
              e.preventDefault();
              
              if (checking) return;
              
              try {
                setChecking(true);
                const response = await api.get('/api/account/check-restrictions');
                setChecking(false);
                
                if (response.data.canTransact) {
                  navigation.navigate('Add');
                } else {
                  setRestrictions(response.data.restrictions);
                  setRestrictionModal(true);
                }
              } catch (error) {
                setChecking(false);
                console.error('Check restrictions error:', error);
                alert('Failed to verify account status. Please try again.');
              }
            },
          })}
          options={{
            tabBarLabel: 'Add',
            headerShown: true,
            title: 'Add Item',
            header: (props) => <CustomHeader {...props} />,
            tabBarIcon: ({ focused }) => (
              <View style={styles.addButton}>
                {checking ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.addButtonText}>+</Text>
                )}
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

      {/* Restriction Modal */}
      <Modal
        visible={restrictionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRestrictionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name={getRestrictionIcon(restrictions?.[0]?.type)} 
                size={48} 
                color={getRestrictionColor(restrictions?.[0]?.type)} 
              />
              <Text style={styles.modalTitle}>Action Restricted</Text>
            </View>

            {restrictions?.map((restriction, index) => (
              <View key={index} style={styles.restrictionCard}>
                <Text style={styles.restrictionMessage}>
                  {restriction.message}
                </Text>

                {restriction.type === 'email_unverified' && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendVerification}
                  >
                    <Ionicons name="mail" size={18} color="#FFFFFF" />
                    <Text style={styles.resendButtonText}>
                      Resend Verification Email
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRestrictionModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  // Modal styles (same as TransactionGuard)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  restrictionCard: {
    backgroundColor: '#FEF2F2',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  restrictionMessage: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '500',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default BottomTabNavigator;