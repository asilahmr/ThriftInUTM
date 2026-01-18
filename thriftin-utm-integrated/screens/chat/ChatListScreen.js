// frontend/src/screens/ChatListScreen.js
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';
import NotificationBadge from '../../components/notifications/NotificationBadge';
// import API_BASE from '../../config';
// const API_URL = `${API_BASE}/api`;

const ChatListScreen = ({ navigation, route }) => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [mappedUserId, setMappedUserId] = useState(route.params?.userId || null);

  const fetchUserData = async () => {
    try {
      if (route.params?.userId) {
        setMappedUserId(route.params.userId);
        return;
      }
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setMappedUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const fetchConversations = async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    try {
      console.log('Fetching conversations for user:', idToFetch);
      const response = await api.get(`/api/conversations/${idToFetch}`);
      console.log('Conversations loaded:', response.data.length);
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (mappedUserId) {
      fetchConversations(mappedUserId);
      fetchUnreadNotificationCount(mappedUserId);
    }
  }, [mappedUserId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <NotificationBadge
          count={unreadNotificationCount}
          onPress={() => navigation.navigate('NotificationList', { userId: mappedUserId })}
        />
      ),
    });
  }, [navigation, unreadNotificationCount, mappedUserId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData(); // Re-check user data on focus just in case
      if (mappedUserId) {
        fetchConversations(mappedUserId);
        fetchUnreadNotificationCount(mappedUserId);
      }
    });
    return unsubscribe;
  }, [navigation, mappedUserId]);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  const fetchUnreadNotificationCount = async (idToFetch) => {
    if (!idToFetch) return;
    try {
      const response = await api.get(`/api/notifications/${idToFetch}/unread-count`);
      setUnreadNotificationCount(response.data.count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (mappedUserId) {
      await fetchConversations(mappedUserId);
      await fetchUnreadNotificationCount(mappedUserId);
    }
    setRefreshing(false);
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv =>
      conv.other_username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredConversations(filtered);
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

  const getOnlineStatus = (conv) => {
    if (conv.is_ai_conversation) return null;

    if (conv.other_is_online) {
      return <Text style={styles.onlineStatus}>Online</Text>;
    } else if (conv.other_last_seen) {
      return (
        <Text style={styles.lastSeen}>
          Last seen {formatTime(conv.other_last_seen)}
        </Text>
      );
    }
    return null;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (userId) => {
    const colors = ['#B71C1C', '#1976D2', '#388E3C', '#F57C00', '#7B1FA2'];
    return colors[userId % colors.length];
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatDetail', {
        conversationId: item.conversation_id,
        otherUserId: item.other_user_id,
        otherUsername: item.other_username,
        isAI: item.is_ai_conversation,
        userId: mappedUserId
      })}
    >
      <View style={styles.avatarContainer}>
        {item.other_profile_picture ? (
          <Image
            source={{ uri: item.other_profile_picture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[
            styles.avatar,
            styles.avatarPlaceholder,
            item.is_ai_conversation
              ? styles.aiAvatar
              : { backgroundColor: getAvatarColor(item.other_user_id) }
          ]}>
            <Text style={styles.avatarText}>
              {item.is_ai_conversation ? '🤖' : getInitials(item.other_username)}
            </Text>
          </View>
        )}
        {item.other_is_online && !item.is_ai_conversation && (
          <View style={styles.onlineDot} />
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.username}>
            {item.is_ai_conversation ? 'AI Shopping Assistant' : item.other_username}
          </Text>
          <Text style={styles.timestamp}>
            {formatTime(item.last_message_time)}
          </Text>
        </View>

        {item.is_ai_conversation ? (
          <Text style={styles.subtitle}>Your personal shopping assistant</Text>
        ) : (
          getOnlineStatus(item)
        )}

        <View style={styles.messagePreview}>
          <Text numberOfLines={1} style={{ fontStyle: item.last_message ? 'normal' : 'italic', color: item.last_message ? 'black' : 'gray' }}>
            {item.last_message ? item.last_message : "No messages yet"}  {/* ✅ The Fix */}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ========================================== */}
      {/* ADD THIS: Quick Access Bar */}
      {/* ========================================== */}
      <View style={styles.quickAccessBar}>
        <TouchableOpacity
          style={styles.quickAccessButton}
          onPress={() => navigation.navigate('HelpCenter', { userId: mappedUserId })}
        >
          <Text style={styles.quickAccessIcon}>🆘</Text>
          <Text style={styles.quickAccessText}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAccessButton}
          onPress={() => navigation.navigate('Feedback', { userId: mappedUserId })}
        >
          <Text style={styles.quickAccessIcon}>💬</Text>
          <Text style={styles.quickAccessText}>Feedback</Text>
        </TouchableOpacity>
      </View>
      {/* ========================================== */}
      {/* END OF Quick Access Bar */}
      {/* ========================================== */}

      <FlatList
        data={filteredConversations}
        renderItem={renderChatItem}
        keyExtractor={item => item.conversation_id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },
  // ========================================
  // ADD THESE NEW STYLES
  // ========================================
  quickAccessBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  quickAccessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B71C1C',
  },
  quickAccessIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B71C1C',
  },
  // ========================================
  // END OF NEW STYLES
  // ========================================
  listContainer: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatar: {
    backgroundColor: '#4285F4',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
  },
  subtitle: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  onlineStatus: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
  lastSeen: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
  },
  unreadBadge: {
    backgroundColor: '#4285F4',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
});

export default ChatListScreen;