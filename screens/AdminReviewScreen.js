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
  RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const AdminReviewScreen = ({ navigation }) => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    autoMatched: 0,
    flagged: 0,
    other: 0
  });

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      console.log('=== FETCHING PENDING REVIEWS ===');
      const response = await api.get('/api/admin/flagged-submissions');
      
      console.log('Response:', response.data);

      const formattedReviews = response.data.map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.email.split('@')[0],
        email: item.email,
        matric: item.matric || 'N/A',
        status: item.status === 'pending' ? 'Pending' : 'Flagged',
        submittedDate: new Date(item.created_at).toLocaleDateString('en-GB'),
        profileImage: null,
        extractedMatric: item.extracted_matric,
        filePath: item.file_path,
        reason: item.reason,
        autoMatchSuccess: item.auto_match_success === 1,
      }));

      setPendingReviews(formattedReviews);
      
      const newStats = {
        total: formattedReviews.length,
        autoMatched: formattedReviews.filter(r => r.autoMatchSuccess).length,
        flagged: formattedReviews.filter(r => r.status === 'Flagged').length,
        other: formattedReviews.filter(r => !r.autoMatchSuccess && r.status === 'Pending').length
      };
      setStats(newStats);
      
      console.log('✓ Loaded', formattedReviews.length, 'pending reviews');
      console.log('Stats:', newStats);
    } catch (error) {
      console.error('Fetch pending reviews error:', error);
      Alert.alert('Error', 'Failed to load pending reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingReviews();
  };

  const handleReviewClick = (review) => {
    navigation.navigate('ReviewSubmission', { review });
  };
  
  const ReviewCard = ({ review }) => (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={() => handleReviewClick(review)}
    >
      <View style={styles.cardContent}>
        <View style={styles.profileSection}>
          {review.profileImage ? (
            <Image
              source={{ uri: review.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <MaterialIcons name="person" size={24} color="#fff" />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{review.name}</Text>
            <Text style={styles.userEmail}>{review.email}</Text>
            <Text style={styles.userMatric}>Matric: {review.matric}</Text>
            {review.autoMatchSuccess && (
              <View style={styles.autoMatchBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.autoMatchText}>Auto-matched</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          review.status === 'Flagged' && { backgroundColor: '#ffebee' },
          review.autoMatchSuccess && { backgroundColor: '#E8F5E9' }
        ]}>
          <MaterialIcons 
            name={
              review.autoMatchSuccess ? 'verified' :
              review.status === 'Flagged' ? 'flag' : 'schedule'
            } 
            size={16} 
            color={
              review.autoMatchSuccess ? '#4CAF50' :
              review.status === 'Flagged' ? '#f44336' : '#ff9800'
            } 
          />
          <Text style={[
            styles.statusText,
            review.status === 'Flagged' && { color: '#f44336' },
            review.autoMatchSuccess && { color: '#4CAF50' }
          ]}>
            {review.autoMatchSuccess ? 'Matched' : review.status}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={14} color="#999" />
          <Text style={styles.dateText}>Submitted: {review.submittedDate}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c85959" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#c85959" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Review Verifications</Text>
        </View>

        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('AdminHistory')}
        >
          <MaterialIcons name="history" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="pending-actions" size={24} color="#c85959" />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <MaterialIcons name="verified" size={24} color="#4CAF50" />
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.autoMatched}</Text>
          <Text style={styles.statLabel}>Auto-matched</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <MaterialIcons name="flag" size={24} color="#FF9800" />
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.flagged}</Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Pending Verifications</Text>
        {pendingReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
        
        {pendingReviews.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No pending reviews</Text>
            <Text style={styles.emptySubtext}>All submissions have been reviewed</Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#c85959',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c85959',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  reviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#c85959',
    justifyContent: 'center',
    alignItems: 'center',
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
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  userMatric: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  autoMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  autoMatchText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
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
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  },

  historyButton: {
    padding: 5,
    marginLeft: 15,
  },

});

export default AdminReviewScreen;