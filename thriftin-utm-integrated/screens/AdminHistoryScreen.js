import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, TextInput
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const AdminHistoryScreen = ({ navigation }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, verified, rejected
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchSubmissions();
  }, [filter, search]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/all-submissions', {
        params: { status: filter, search }
      });

      console.log('=== HISTORY API RESPONSE ===');
      console.log('Full response:', response.data);
      console.log('First item:', response.data.data?.[0]);

      if (response.data.success) {
        setSubmissions(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Fetch submissions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'flagged': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const SubmissionCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReviewSubmission', {
        review: {
          id: item.id,
          email: item.email,
          name: item.name,
          matric: item.matric,
          status: item.status,
          filePath: item.file_path,
          extractedMatric: item.extracted_matric,
          autoMatchSuccess: item.auto_match_success,
          reason: item.reason,
          submittedDate: new Date(item.created_at).toLocaleDateString(),
          reviewedAt: item.reviewed_at,
          degreeType: item.degree_type,
          facultyCode: item.faculty_code,
        }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || item.email}</Text>
          <Text style={styles.userMatric}>{item.matric}</Text>
        </View>
        <View style={[styles.statusBadge, {
          backgroundColor: getStatusColor(item.status) + '20'
        }]}>
          <Text style={[styles.statusText, {
            color: getStatusColor(item.status)
          }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.label}>Submitted:
          <Text style={styles.value}> {new Date(item.created_at).toLocaleString()}</Text>
        </Text>

        {item.reviewed_at && (
          <Text style={styles.label}>Reviewed:
            <Text style={styles.value}> {new Date(item.reviewed_at).toLocaleString()}</Text>
          </Text>
        )}

        {item.reviewer_email && (
          <Text style={styles.label}>Reviewer:
            <Text style={styles.value}> {item.reviewer_email}</Text>
          </Text>
        )}

        {item.extracted_matric && (
          <Text style={styles.label}>
            Extracted:{' '}
            <Text style={[styles.value, {
              color: item.auto_match_success === 1 ? '#4CAF50' : '#FF9800'
            }]}>
              {item.extracted_matric}
              {item.auto_match_success === 1 ? ' ✓' : ''}
            </Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={fetchSubmissions} style={{ marginRight: 15 }}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {stats.verified || 0}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>
            {stats.rejected || 0}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'verified', 'rejected'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.filterButtonActive
              ]}
              onPress={() => setFilter(status)}
            >
              <Text style={[
                styles.filterText,
                filter === status && styles.filterTextActive
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or matric..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* List */}
      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#c85959" />
        ) : submissions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No submissions found</Text>
          </View>
        ) : (
          submissions.map(item => <SubmissionCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c85959',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
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
    backgroundColor: '#c85959',
    borderColor: '#c85959',
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
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  userMatric: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 10,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  value: {
    color: '#333',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
});

export default AdminHistoryScreen;