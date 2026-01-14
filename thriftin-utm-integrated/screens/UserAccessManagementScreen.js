// screens/UserAccessManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Image,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function UserAccessManagementScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, restricted, suspended, permanently_suspended
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    restricted: 0,
    suspended: 0,
    permanentlySuspended: 0,
    active: 0
  });

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filter, search, users]);

  const loadAllUsers = async () => {
    try {
      const response = await api.get('/api/account/admin/all-users');
      setUsers(response.data.users);
      calculateStats(response.data.users);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Load users error:', error);
      Alert.alert('Error', 'Failed to load users');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (userList) => {
    const restricted = userList.filter(u => u.accountStatus === 'restricted').length;
    const suspended = userList.filter(u => u.accountStatus === 'suspended').length;
    const permanentlySuspended = userList.filter(u => u.accountStatus === 'permanently_suspended').length;
    const active = userList.filter(u => u.accountStatus === 'active').length;

    setStats({
      restricted: restricted,
      suspended: suspended,
      permanentlySuspended: permanentlySuspended,
      active: active
    });
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(user => user.accountStatus === filter);
    }

    // Apply search filter
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.matric?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllUsers();
  };

  const getStatusInfo = (user) => {
    if (user.accountStatus === 'permanently_suspended') {
      return {
        label: 'Permanently Suspended',
        bgColor: '#FEE2E2',
        textColor: '#991B1B'
      };
    }
    if (user.accountStatus === 'suspended') {
      return {
        label: 'Temporarily Suspended',
        bgColor: '#FFF4E0',
        textColor: '#D97706'
      };
    }
    if (user.accountStatus === 'restricted') {
      const isReported = user.reportCount > 0;
      const isUnverified = !user.emailVerified || user.verificationStatus !== 'verified';

      if (isReported && isUnverified) {
        return {
          label: 'Restricted (Reported & Unverified)',
          bgColor: '#FFE5E5',
          textColor: '#DC2626'
        };
      } else if (isReported) {
        return {
          label: 'Restricted (Reported)',
          bgColor: '#FFE5E5',
          textColor: '#DC2626'
        };
      } else if (isUnverified) {
        return {
          label: 'Restricted (Unverified)',
          bgColor: '#FEF3C7',
          textColor: '#D97706'
        };
      }
    }
    return {
      label: 'Active',
      bgColor: '#D1FAE5',
      textColor: '#059669'
    };
  };

  const handleUserPress = (user) => {
    navigation.navigate('ReportDetail', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userMatric: user.matric
    });
  };

  const renderUserCard = ({ item }) => {
    const statusInfo = getStatusInfo(item);

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.profilePicture || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{item.name || 'No Name'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <Text style={styles.userMatric}>{item.matric}</Text>

          {item.reportCount > 0 && (
            <View style={styles.reportRow}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.reportText}>
                {item.reportCount} report{item.reportCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {item.verificationStatus !== 'verified' && (
            <View style={styles.reportRow}>
              <Ionicons name="shield-outline" size={14} color="#D97706" />
              <Text style={[styles.reportText, { color: '#D97706' }]}>
                Unverified Account
              </Text>
            </View>
          )}

          <Text style={styles.userDescription} numberOfLines={1}>
            {item.reportReason || item.description || 'No description'}
          </Text>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Latest</Text>
            <Text style={styles.dateValue}>
              {item.latestReportDate || item.lastReported || '2025-12-16'}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#C75450" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#FFE5E5' }]}
          onPress={() => setFilter('restricted')}
        >
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.restricted}</Text>
          <Text style={[styles.statLabel, { color: '#DC2626' }]}>Restricted</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#FFF4E0' }]}
          onPress={() => setFilter('suspended')}
        >
          <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.suspended}</Text>
          <Text style={[styles.statLabel, { color: '#D97706' }]}>Suspended</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}
          onPress={() => setFilter('permanently_suspended')}
        >
          <Text style={[styles.statNumber, { color: '#991B1B' }]}>{stats.permanentlySuspended}</Text>
          <Text style={[styles.statLabel, { color: '#991B1B' }]}>Permanent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: '#059669' }]}>Active</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All Users' },
            { key: 'active', label: 'Active' },
            { key: 'restricted', label: 'Restricted' },
            { key: 'suspended', label: 'Suspended' },
            { key: 'permanently_suspended', label: 'Permanent' }
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterButton,
                filter === item.key && styles.filterButtonActive
              ]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[
                styles.filterText,
                filter === item.key && styles.filterTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or matric..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>
        {filter === 'all' ? 'All Users' : `${filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')} Users`}
        <Text style={styles.countText}> ({filteredUsers.length})</Text>
      </Text>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C75450"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={80} color="#D1D5DB" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {search ? 'Try adjusting your search' : 'No users match the selected filter'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 20,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#C75450',
    borderColor: '#C75450',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  countText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userMatric: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginLeft: 4,
  },
  userDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 6,
  },
  dateValue: {
    fontSize: 11,
    color: '#6B7280',
  },
  chevron: {
    marginLeft: 8,
    marginTop: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});