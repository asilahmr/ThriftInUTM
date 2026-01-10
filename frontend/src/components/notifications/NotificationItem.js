import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const NotificationItem = ({ notification, onPress }) => {
  const getIcon = (type) => {
    const icons = {
      new_message: '💬',
      system_update: '🔔',
      report_update: '⚠️',
      feedback_response: '💭',
      help_ticket: '🎫',
      price_alert: '💰',
      new_listing: '📚'
    };
    return icons[type] || '📌';
  };

  return (
    <TouchableOpacity
      style={[styles.container, !notification.is_read && styles.unread]}
      onPress={onPress}
    >
      <Text style={styles.icon}>{getIcon(notification.notification_type)}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message_preview}
        </Text>
        <Text style={styles.time}>
          {new Date(notification.created_at).toLocaleString()}
        </Text>
      </View>
      {!notification.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  unread: {
    backgroundColor: '#FFF5F5',
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B71C1C',
    marginLeft: 8,
    marginTop: 8,
  },
});

export default NotificationItem;