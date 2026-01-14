import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import API_BASE from '../../config';
// ⚠️ IMPORTANT: Double-check this IP address matches your PC's IPv4 address!
const API_URL = `${API_BASE}/api`;

const ChatDetailScreen = ({ navigation, route }) => {
  const { conversationId, otherUserId, otherUsername, isAI, userId } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    // Set up auto-refresh (Polling) to check for new messages every 3 seconds
    const intervalId = setInterval(() => {
        fetchMessages(true); // true = silent refresh (no loading spinner)
    }, 3000);

    if (isAI) {
      fetchQuickActions();
      checkForGreeting();
    }

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: isAI ? 'AI Shopping Assistant' : otherUsername,
      headerRight: () => !isAI && (
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isAI, otherUsername]);

  // const checkForGreeting = async () => {
  //   if (messages.length === 0 && isAI) {
  //     // Send greeting strictly after a short delay to ensure UI is ready
  //     setTimeout(() => sendAIGreeting(), 500);
  //   }
  // };

  // const sendAIGreeting = async () => {
  //   // Only send if we haven't already
  //   try {
  //       // Check if greeting exists on server first to avoid duplicates
  //       const check = await axios.get(`${API_URL}/messages/${conversationId}`);
  //       if(check.data.length > 0) return;

  //       const greetingMessage = {
  //           conversation_id: conversationId,
  //           sender_id: otherUserId,
  //           message_text: `Hello! I'm your AI Shopping Assistant 👋\n\nI can help you with:\n• Finding textbooks within your budget\n• Negotiating better prices\n• General buying and selling advice\n\nHow can I assist you today?`,
  //           message_type: 'text'
  //       };
  //       await axios.post(`${API_URL}/messages`, greetingMessage);
  //       fetchMessages(true);
  //   } catch (error) {
  //       console.log('Greeting check failed:', error);
  //   }
  // };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await axios.get(
        `${API_URL}/messages/${conversationId}?userId=${userId}`
      );
      setMessages(response.data);
      if (!silent) setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (!silent) setLoading(false);
    }
  };

  const fetchQuickActions = async () => {
    try {
      const response = await axios.get(`${API_URL}/ai/quick-actions`);
      setQuickActions(response.data);
    } catch (error) {
      console.log('Quick actions not available');
      // Fallback data if API fails
      setQuickActions([
          {id: 1, text: "Check prices"}, 
          {id: 2, text: "How to buy?"}
      ]);
    }
  };

  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // 1. OPTIMISTIC UPDATE: Show message immediately in UI
    const tempId = Date.now();
    const tempMessage = {
      message_id: tempId,
      conversation_id: conversationId,
      sender_id: userId,
      message_text: text,
      created_at: new Date().toISOString(),
      pending: true // Flag to show it's sending
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputText(''); // Clear input immediately

    // 2. Send to Server
const newMessagePayload = {
  conversation_id: conversationId,
  sender_id: userId,
  receiver_id: otherUserId, // <--- ADD THIS LINE
  message_text: text,
  message_type: 'text'
};

    try {
      const res = await axios.post(`${API_URL}/messages`, newMessagePayload);

      setMessages(prev => [...prev.filter(m => !m.pending), res.data.userMessage]);

    if (res.data.aiMessage) {
      setMessages(prev => [...prev, res.data.aiMessage]);
    }

      // if (isAI) {
      //   // Trigger AI Response
      //   setTimeout(() => getAIResponse(text), 500);
      // }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Failed to send', 'Check your internet connection.');
      // Remove the optimistic message if it failed
      setMessages(prev => prev.filter(msg => msg.message_id !== tempId));
    }
  };

  // const getAIResponse = async (userMessage) => {
  //   try {
  //     // Simulate "typing" by not showing immediately? 
  //     // For now, we just wait for server
  //     const response = await axios.post(`${API_URL}/ai/respond`, {
  //       message: userMessage,
  //       userId: userId
  //     });

  //     const aiMessage = {
  //       conversation_id: conversationId,
  //       sender_id: otherUserId,
  //       message_text: response.data.response,
  //       message_type: 'text'
  //     };

  //     await axios.post(`${API_URL}/messages`, aiMessage);
  //     fetchMessages(true);
  //   } catch (error) {
  //     console.error('Error getting AI response:', error);
  //   }
  // };

  const handleQuickAction = (action) => {
    sendMessage(action.text);
  };

  // ... [Keep your existing menu handlers: handleReport, handleBlock] ...
  const handleReport = () => {
    setShowMenu(false);
    Alert.alert("Reported", "User has been reported.");
  };

  const handleBlock = () => {
    setShowMenu(false);
    Alert.alert("Blocked", "User has been blocked.");
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === userId;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            item.pending && { opacity: 0.7 } // Dim if sending
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}
          >
            {item.message_text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
          <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#B71C1C" />
          </View>
      ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.message_id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No messages yet. Start chatting!</Text>
                </View>
            }
          />
      )}

      {isAI && quickActions.length > 0 && (
        <View style={styles.quickActionsContainer}>
            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
            >
            {quickActions.map(action => (
                <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action)}
                >
                <Text style={styles.quickActionText}>{action.text}</Text>
                </TouchableOpacity>
            ))}
            </ScrollView>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Text style={styles.menuItemText}>🚫 Report User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                ⛔ Block User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 50,
      opacity: 0.5
  },
  emptyText: {
      fontSize: 16,
      color: '#666'
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#B71C1C',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999999',
  },
  quickActionsContainer: {
    height: 60, // Fixed height to prevent jumping
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  quickActionsContent: {
    padding: 10,
    alignItems: 'center'
  },
  quickActionButton: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B71C1C',
    marginRight: 8,
  },
  quickActionText: {
    color: '#B71C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12, // Extra padding for iPhone home bar
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#B71C1C',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4, // Align with input text
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Changed to black for visibility if header is white
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  menuItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center'
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemDanger: {
    color: '#D32F2F',
  },
  menuItemCancel: {
    borderBottomWidth: 0,
    marginTop: 5
  },
});

export default ChatDetailScreen;