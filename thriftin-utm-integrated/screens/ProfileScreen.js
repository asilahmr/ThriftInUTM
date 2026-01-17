// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';
import { COLORS, API_BASE_URL as API_URL } from '../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/profile/me');
      if (response.data.success) {
        const user = response.data.data;
        setUserData({
          ...user,
          profileImage: user.profileImage ? `${API_URL}/${user.profileImage}` : null
        });
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.replace('Login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const getVerificationStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return { icon: 'check-circle', text: 'Verified', color: '#4CAF50', bgColor: '#E8F5E9', iconFamily: 'MaterialIcons' };
      case 'rejected':
        return { icon: 'close-circle', text: 'Rejected', color: '#F44336', bgColor: '#FFEBEE', iconFamily: 'MaterialIcons' };
      case 'flagged':
        return { icon: 'flag', text: 'Under Review', color: '#FF9800', bgColor: '#FFF3E0', iconFamily: 'MaterialIcons' };
      default:
        return { icon: 'time-outline', text: 'Pending', color: '#FF9800', bgColor: '#FFF3E0', iconFamily: 'Ionicons' };
    }
  };

  const renderIcon = (item) => {
    if (item.iconFamily === 'Ionicons') return <Ionicons name={item.icon} size={24} color="#666" />;
    return <MaterialIcons name={item.icon} size={24} color="#666" />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.loadingText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = getVerificationStatusConfig(userData.verificationStatus);

  const menuItems = [
    { id: 'details', title: 'My Details', icon: 'person-outline', iconFamily: 'Ionicons', screen: 'Details' },
    { id: 'verification', title: 'Verification', icon: 'shield-checkmark-outline', iconFamily: 'Ionicons', screen: 'Verification', showStatus: true },
    { id: 'my_items', title: 'My Items', icon: 'list-circle-outline', iconFamily: 'Ionicons', screen: 'MyItems' },
    { id: 'my_orders', title: 'My Orders', icon: 'cart-outline', iconFamily: 'Ionicons', screen: 'OrderHistory' },
    { id: 'sales_performance', title: 'Sales Performance', icon: 'trending-up', iconFamily: 'Ionicons', screen: 'SalesDashboard' },
    { id: 'spending_summary', title: 'Spending Summary', icon: 'wallet-outline', iconFamily: 'Ionicons', screen: 'BuyerSpendingSummary' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            {userData.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {userData.name ? userData.name.charAt(0).toUpperCase() : userData.email.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>{userData.name || 'Not set'}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen, {
                role: userData?.user_type || 'student',
                userId: userData?.id
              })}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {renderIcon(item)}
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.showStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    {statusConfig.iconFamily === 'MaterialIcons' ? (
                      <MaterialIcons name={statusConfig.icon} size={12} color={statusConfig.color} />
                    ) : (
                      <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                    )}
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
                  </View>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>ThriftIn UTM</Text>
            <Text style={styles.infoText}>Buy and sell preloved items within the UTM community.</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  headerCard: { backgroundColor: COLORS.primary, padding: 32, alignItems: 'center' },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 40 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#fff', opacity: 0.9 },

  section: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  menuTitle: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  infoCard: { flexDirection: 'row', backgroundColor: COLORS.card, marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  infoText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 12, gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ProfileScreen;
