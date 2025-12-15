import React, { useState, useEffect } from 'react';
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

const API_URL = 'http://10.198.209.113:3000';

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
      console.log('=== FETCHING PROFILE ===');
      
      const response = await api.get('/api/profile/me');

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.data.success) {
        const user = response.data.data;
        setUserData({
          ...user,
          profileImage: user.profileImage ? `${API_URL}/${user.profileImage}` : null
        });
        console.log('✓ Profile loaded successfully');
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.replace('Login');
      } else {
        Alert.alert('Error', 'Failed to load profile');
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
    switch(status) {
      case 'verified':
        return {
          icon: 'checkmark-circle',
          text: 'Verified',
          color: '#4CAF50',
          bgColor: '#E8F5E9'
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          text: 'Rejected',
          color: '#F44336',
          bgColor: '#FFEBEE'
        };
      case 'flagged':
        return {
          icon: 'flag',
          text: 'Under Review',
          color: '#FF9800',
          bgColor: '#FFF3E0',
          iconFamily: 'MaterialIcons'
        };
      default: // pending
        return {
          icon: 'time-outline',
          text: 'Pending',
          color: '#FF9800',
          bgColor: '#FFF3E0'
        };
    }
  };

  const renderIcon = (item) => {
    if (item.iconFamily === 'Ionicons') {
      return <Ionicons name={item.icon} size={24} color="#666" />;
    }
    return <MaterialIcons name={item.icon} size={24} color="#666" />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = getVerificationStatusConfig(userData.verificationStatus);

  const menuItems = [
    {
      id: 1,
      title: 'My Details',
      icon: 'person-outline',
      iconFamily: 'Ionicons',
      screen: 'Details',
    },
    {
      id: 2,
      title: 'Verification',
      icon: 'shield-checkmark-outline',
      iconFamily: 'Ionicons',
      screen: 'Verification',
      showStatus: true, // Show status badge for this item
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {userData.profileImage ? (
              <Image
                source={{ uri: userData.profileImage }}
                style={styles.profileImage}
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitials}>
                  {userData.name ? userData.name.charAt(0).toUpperCase() : 
                   userData.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>
            {userData.name || 'Not set'}
          </Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          
          <View style={styles.userInfoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="badge" size={16} color="#666" />
              <Text style={styles.infoText}>{userData.matric}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <MaterialIcons name="school" size={16} color="#666" />
              <Text style={styles.infoText}>{userData.degreeType}</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuItemLeft}>
                {renderIcon(item)}
                <Text style={styles.menuItemText}>{item.title}</Text>
                {item.showStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    {statusConfig.iconFamily === 'MaterialIcons' ? (
                      <MaterialIcons name={statusConfig.icon} size={12} color={statusConfig.color} />
                    ) : (
                      <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                    )}
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.text}
                    </Text>
                  </View>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#A94442',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#A94442',
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A94442',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#ddd',
    marginHorizontal: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ce4d4bff',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 15,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 20,
  },
});

export default ProfileScreen;