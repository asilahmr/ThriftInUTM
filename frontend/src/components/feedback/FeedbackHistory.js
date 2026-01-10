import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native';

const FeedbackHistory = ({ 
  feedbackList, 
  onItemPress, 
  onRefresh, 
  refreshing = false,
  loading = false 
}) => {
  const getStatusColor = (status) => {
    const colors = {
      'submitted': '#2196F3',
      'under_review': '#FF9800',
      'planned': '#9C27B0',
      'in_progress': '#00BCD4',
      'completed': '#4CAF50',
      'rejected': '#F44336'
    };
    return colors[status] || '#999999';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'bug_report': '🐛',
      'feature_request': '💡',
      'improvement': '⚡',
      'complaint': '😞',
      'compliment': '😊',
      'app_rating': '⭐'
    };
    return icons[type] || '📝';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderFeedbackItem = ({ item }) => (
    <TouchableOpacity
      style={styles.feedbackCard}
      onPress={() => onItemPress && onItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.typeIcon}>{getTypeIcon(item.feedback_type)}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>{'⭐'.repeat(item.rating)}</Text>
          </View>
        )}
      </View>

      {item.upvote_count > 0 && (
        <View style={styles.upvoteContainer}>
          <Text style={styles.upvote}>👍 {item.upvote_count} upvotes</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyText}>No feedback yet</Text>
      <Text style={styles.emptySubtext}>
        Share your thoughts to help us improve
      </Text>
    </View>
  );

  if (loading && feedbackList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading feedback...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={feedbackList}
      renderItem={renderFeedbackItem}
      keyExtractor={item => item.feedback_id.toString()}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#B71C1C"
            colors={['#B71C1C']}
          />
        ) : undefined
      }
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  rating: {
    fontSize: 14,
  },
  upvoteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  upvote: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
});

export default FeedbackHistory;