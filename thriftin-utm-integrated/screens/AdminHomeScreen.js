import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../utils/api';

const AdminHomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    restrictedUsers: 0,
    totalUsers: 0,
    verifiedToday: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
          <MaterialIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadDashboardStats = async () => {
    try {
      const [verificationsRes, usersRes] = await Promise.all([
        api.get('/api/admin/flagged-submissions'),
        api.get('/api/account/admin/all-users'),
      ]);

      const users = usersRes.data.users || [];
      const restrictedUsers = users.filter(
        u => u.accountStatus === 'restricted'
      );

      setStats({
        pendingVerifications: verificationsRes.data.length || 0,
        restrictedUsers: restrictedUsers.length,
        totalUsers: users.length,
        verifiedToday: 0,
      });

      setLoading(false);
    } catch (error) {
      console.error('Load stats error:', error);
      setLoading(false);
    }
  };

  const MenuCard = ({ icon, title, color, onPress }) => (
    <TouchableOpacity
      style={styles.menuCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={28} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#B85450" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>


      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="description" size={24} color="#5B9BD5" />
            <Text style={styles.statLabel}>Pending{'\n'}Verifications</Text>
            <Text style={styles.statNumber}>
              {stats.pendingVerifications}
            </Text>
          </View>

          <View style={[styles.statCard, styles.statCardOrange]}>
            <MaterialIcons name="person-off" size={24} color="#ED7D31" />
            <Text style={styles.statLabel}>Restricted Users</Text>
            <Text style={styles.statNumber}>{stats.restrictedUsers}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <MenuCard
            icon="description"
            title="Verification Review"
            color="#5B9BD5"
            onPress={() => navigation.navigate('AdminReview')}
          />

          <MenuCard
            icon="person-off"
            title="User Access Management"
            color="#ED7D31"
            onPress={() => navigation.navigate('UserAccessManagement')}
          />

          <MenuCard
            icon="shield"
            title="Transaction Insight"
            color="#70AD47"
            onPress={() => navigation.navigate('TransactionInsight')}
          />

          <MenuCard
            icon="analytics"
            title="User Activity Dashboard"
            color="#7B1FA2"
            onPress={() => navigation.navigate('UserActivityDashboard')}
          />

          <MenuCard
            icon="trending-up"
            title="Sales Performance"
            color="#D32F2F"
            onPress={() => navigation.navigate('SalesDashboard', { role: 'admin' })}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#E7F1FA',
    borderRadius: 12,
    padding: 18,
  },
  statCardOrange: {
    backgroundColor: '#FFF4E6',
  },
  statLabel: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default AdminHomeScreen;
