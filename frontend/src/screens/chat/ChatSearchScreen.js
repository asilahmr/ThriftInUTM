import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://172.20.10.2:3000/api';

const ChatSearchScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 2;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await axios.get(`${API_URL}/messages/search/${userId}`, {
        params: { query: searchQuery.trim() }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <Text key={index} style={styles.highlight}>{part}</Text>
        : part
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        navigation.navigate('ChatDetail', {
          conversationId: item.conversation_id,
          otherUserId: item.sender_id === userId ? 0 : item.sender_id,
          otherUsername: item.other_username,
          userId: userId
        });
      }}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.username}>{item.sender_name}</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.conversationWith}>
        in conversation with {item.other_username}
      </Text>
      <Text style={styles.messageText} numberOfLines={3}>
        {highlightText(item.message_text, searchQuery)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setSearchResults([]);
            setSearched(false);
          }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Type at least 2 characters to search</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#B71C1C" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searched && searchResults.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No messages found</Text>
          <Text style={styles.emptySubtext}>
            Try different keywords or check spelling
          </Text>
        </View>
      ) : !searched ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>Search your messages</Text>
          <Text style={styles.emptySubtext}>
            Find specific conversations or messages quickly
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderResultItem}
          keyExtractor={item => item.message_id.toString()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            searchResults.length > 0 ? (
              <Text style={styles.resultsCount}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
            ) : null
          }
        />
      )}
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
  hintContainer: {
    padding: 16,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#999999',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
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
  listContainer: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    fontWeight: '500',
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  conversationWith: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  highlight: {
    backgroundColor: '#FFEB3B',
    fontWeight: '600',
  },
});

export default ChatSearchScreen;