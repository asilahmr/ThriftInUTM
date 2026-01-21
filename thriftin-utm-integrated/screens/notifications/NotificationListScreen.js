// frontend/src/screens/NotificationListScreen.js
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import api from '../../utils/api';

const NotificationListScreen = ({ navigation, route }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = route.params?.userId || 2;

  useEffect(() => {
    fetchNotifications();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('NotificationSettings', { userId })}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, userId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotifications();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching notifications for user:', userId);
      
      // Fixed: Correct API path
      const response = await api.get(`/notifications/${userId}`);
      
      console.log('✅ Received notifications:', response.data?.length || 0);
      setNotifications(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 404) {
        Alert.alert(
          'Not Found',
          'Notification endpoint not found. Please check server configuration.',
          [{ text: 'OK' }]
        );
      } else if (error.message === 'Network Error') {
        Alert.alert(
          'Connection Error',
          'Cannot connect to server. Please check your internet connection.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to load notifications',
          [{ text: 'OK' }]
        );
      }
      
      setNotifications([]);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read
      await api.put(`/notifications/${notification.notification_id}/read`);

      // Navigate to conversation if it's a message notification
      if (notification.conversation_id && notification.sender_id) {
        navigation.navigate('ChatDetail', {
          conversationId: notification.conversation_id,
          otherUserId: notification.sender_id,
          otherUsername: notification.sender_name,
          isAI: false,
          userId: userId
        });
      }

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('❌ Error handling notification:', error);
      Alert.alert('Error', 'Failed to open notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all/${userId}`);
      fetchNotifications();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (userId) => {
    const colors = ['#B71C1C', '#1976D2', '#388E3C', '#F57C00', '#7B1FA2'];
    return colors[(userId || 0) % colors.length];
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatar,
          styles.avatarPlaceholder,
          { backgroundColor: getAvatarColor(item.sender_id || 0) }
        ]}>
          <Text style={styles.avatarText}>
            {getInitials(item.sender_name)}
          </Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.senderName}>{item.sender_name || 'System'}</Text>
          <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {item.message_preview || item.title || 'New notification'}
        </Text>
        <View style={styles.actionButtons}>
          <Text style={styles.actionText}>
            {item.is_read ? 'Read' : 'Unread'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B71C1C" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.unreadCountText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Mark All as Read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.notification_id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll see notifications here when someone sends you a message
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  settingsButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  unreadCountText: {
    fontSize: 14,
    color: '#666666',
  },
  markAllButton: {
    fontSize: 14,
    color: '#B71C1C',
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  unreadNotification: {
    backgroundColor: '#FFF5F5',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#B71C1C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionText: {
    fontSize: 13,
    color: '#B71C1C',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
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
});

export default NotificationListScreen;