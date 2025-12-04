import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatsPage() {
  const chats = [
    {
      id: '1',
      name: 'Sarah',
      lastMessage: 'Is the laptop still available?',
      time: '2m ago',
      unread: 2,
      avatar: 'S',
    },
    {
      id: '2',
      name: 'Lisa',
      lastMessage: 'Can we meet at Library?',
      time: '1h ago',
      unread: 0,
      avatar: 'L',
    },
    {
      id: '3',
      name: 'Farah',
      lastMessage: 'Thank you for the textbook!',
      time: '3h ago',
      unread: 0,
      avatar: 'F',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Chat List */}
      <ScrollView style={styles.chatList}>
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        ) : (
          chats.map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.chatItem} activeOpacity={0.7}>
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{chat.avatar}</Text>
              </View>

              {/* Chat Info */}
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <View style={styles.chatFooter}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                  {chat.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#A30F0F',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  chatList: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#A30F0F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  chatTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#A30F0F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});
