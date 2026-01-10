import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const MessageBubble = ({ message, isMyMessage, onPress, onLongPress }) => {
  const renderAttachment = () => {
    if (!message.attachment_url) return null;
    
    const isImage = message.attachment_name?.match(/\.(jpg|jpeg|png|gif)$/i);
    
    return (
      <TouchableOpacity style={styles.attachment} onPress={() => onPress && onPress(message)}>
        {isImage ? (
          <Image source={{ uri: message.attachment_url }} style={styles.attachmentImage} />
        ) : (
          <View style={styles.fileAttachment}>
            <Text style={styles.fileIcon}>📄</Text>
            <Text style={styles.fileName} numberOfLines={1}>{message.attachment_name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.bubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}
      >
        {renderAttachment()}
        {message.message_text && (
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}
          >
            {message.message_text}
          </Text>
        )}
        <Text
          style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
          {isMyMessage && message.is_read && <Text> ✓✓</Text>}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
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
  attachment: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
});

export default MessageBubble;
