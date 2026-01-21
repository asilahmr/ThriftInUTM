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
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';

const ChatDetailScreen = ({ navigation, route }) => {
  const { conversationId, otherUserId, otherUsername, isAI, userId } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const flatListRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const debugTokens = async () => {
      const token = await AsyncStorage.getItem('token');
      const userToken = await AsyncStorage.getItem('userToken');
      console.log('🔍 Token Debug:');
      console.log('  token:', token ? 'EXISTS' : 'MISSING');
      console.log('  userToken:', userToken ? 'EXISTS' : 'MISSING');
      console.log('  userId:', userId);
    };

    debugTokens();
    fetchMessages();

    intervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 20000);

    if (isAI) {
      fetchQuickActions();
      checkForGreeting();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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

  const checkForGreeting = async () => {
    if (messages.length === 0 && isAI) {
      setTimeout(() => sendAIGreeting(), 500);
    }
  };

  const sendAIGreeting = async () => {
    try {
      const check = await api.get(`/api/messages/${conversationId}`);
      if (check.data.length > 0) return;

      const greetingMessage = {
        conversation_id: conversationId,
        sender_id: otherUserId,
        message_text: `Hello! I'm your AI Shopping Assistant 👋\n\nI can help you with:\n• Finding items within your budget\n• Negotiating better prices\n• General buying and selling advice\n\nHow can I assist you today?`,
        message_type: 'text'
      };
      await api.post(`/api/messages`, greetingMessage);
      fetchMessages(true);
    } catch (error) {
      console.log('Greeting check failed:', error);
    }
  };

  const fetchMessages = async (silent = false) => {
    try {
      console.log('🔄 fetchMessages START, silent:', silent);
      if (!silent) setLoading(true);

      const response = await api.get(`/api/messages/${conversationId}?userId=${userId}&all=true`);

      console.log('📨 API returned:', response.data.length, 'messages');
      console.log('📨 Latest message ID:', response.data[response.data.length - 1]?.message_id);

      setMessages(response.data);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);

      if (!silent) setLoading(false);

    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      if (!silent) setLoading(false);
    }
  };

  const fetchQuickActions = async () => {
    try {
      const response = await api.get(`/api/ai/quick-actions`);
      setQuickActions(response.data);
    } catch (error) {
      console.log('Quick actions not available');
      setQuickActions([
        { id: 1, text: "Check prices" },
        { id: 2, text: "How to buy?" }
      ]);
    }
  };

  const sendMessage = async (text = inputText) => {
    console.log('📤 sendMessage START with:', text);
    if (!text.trim()) {
      console.log('❌ Text is empty, aborting');
      return;
    }

    setInputText('');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      console.log('⏸️ Paused polling during message send');
    }

    const newMessagePayload = {
      conversation_id: conversationId,
      sender_id: userId,
      message_text: text,
      message_type: 'text'
    };

    try {
      const res = await api.post(`/api/messages`, newMessagePayload);
      console.log('✅ Got API response');

      setMessages(prev => {
        const updated = [...prev];

        if (res.data.userMessage) {
          updated.push(res.data.userMessage);
          console.log('✅ Added user msg:', res.data.userMessage.message_id);
        }

        if (res.data.aiMessage) {
          updated.push(res.data.aiMessage);
          console.log('✅ Added AI msg:', res.data.aiMessage.message_id);
          console.log('📝 AI text length:', res.data.aiMessage.message_text?.length);
          console.log('📄 AI text preview:', res.data.aiMessage.message_text?.substring(0, 100));
        }

        console.log('📊 Total messages:', updated.length);
        return updated;
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);

      if (res.data.aiMessage) {
        console.log('🤖 AI message received, waiting 8 seconds before resuming polling');
        setTimeout(() => {
          intervalRef.current = setInterval(() => {
            fetchMessages(true);
          }, 3000);
          console.log('▶️ Resumed polling after AI response');
        }, 8000);
      } else {
        console.log('👤 Non-AI message, resuming polling immediately');
        intervalRef.current = setInterval(() => {
          fetchMessages(true);
        }, 3000);
      }

    } catch (error) {
      console.error('❌ Send error:', error);
      Alert.alert('Failed to send', 'Check your internet connection.');

      intervalRef.current = setInterval(() => {
        fetchMessages(true);
      }, 3000);
    }
  };

  const handleQuickAction = (action) => {
    console.log('🔵 Quick Action clicked:', action.text);
    console.log('🔵 Sending message...');
    sendMessage(action.text);
  };

const handleReport = () => {
  console.log('🔴 handleReport clicked!');
  console.log('📋 Navigation object:', navigation);
  console.log('📋 otherUserId:', otherUserId);
  console.log('📋 otherUsername:', otherUsername);
  console.log('📋 userId:', userId);
  
  setShowMenu(false);
  
  try {
    navigation.navigate('StudentReportUser', {
      reportedUserId: otherUserId,
      reportedUserName: otherUsername,
      reportedUserMatric: 'N/A',
      currentUserId: userId,
      currentUserMatric: 'N/A'
    });
    console.log('✅ Navigation called successfully');
  } catch (error) {
    console.error('❌ Navigation error:', error);
  }
};

  const handleBlock = () => {
    setShowMenu(false);
    navigation.navigate('BlockUser', {
      blockerId: userId,
      blockedId: otherUserId,
      blockedUsername: otherUsername
    });
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
          item.pending && { opacity: 0.7 }
        ]}
      >
        {item.message_type === 'image' ? (
          <Image
            source={{ uri: item.message_text }} // 你后端返回的应该是图片 URL
            style={{ width: 200, height: 200, borderRadius: 12 }}
            resizeMode="cover"
          />
        ) : item.message_type === 'file' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text>📄 {item.message_text}</Text>
          </View>
        ) : (
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}
          >
            {item.message_text}
          </Text>
        )}

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
      enabled={true}
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
          keyExtractor={(item, index) => `${item.message_id}-${index}`}
          contentContainerStyle={styles.messagesList}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={21}
          removeClippedSubviews={false}
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
    maxWidth: '85%',
    flexShrink: 1,
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
    maxWidth: '100%',
    flexShrink: 1,
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
    flexShrink: 1,
    flexWrap: 'wrap',
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
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    elevation: 10,
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
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
    marginBottom: 4,
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
    color: '#000000',
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