import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';

const NotificationSettings = ({ 
  preferences, 
  onPreferenceChange, 
  saving = false 
}) => {
  const settingsGroups = [
    {
      title: 'Message Notifications',
      settings: [
        {
          key: 'new_messages_enabled',
          icon: '💬',
          title: 'New Messages',
          description: 'Get notified when you receive new messages from buyers or sellers'
        }
      ]
    },
    {
      title: 'System Notifications',
      settings: [
        {
          key: 'system_updates_enabled',
          icon: '🔔',
          title: 'System Updates',
          description: 'Receive important announcements, policy changes, and app updates'
        },
        {
          key: 'report_updates_enabled',
          icon: '⚠️',
          title: 'Report Updates',
          description: 'Get notified about your report submissions'
        },
        {
          key: 'feedback_responses_enabled',
          icon: '💭',
          title: 'Feedback Responses',
          description: 'Receive replies to your feedback submissions'
        }
      ]
    },
    {
      title: 'Marketplace Notifications',
      settings: [
        {
          key: 'price_alerts_enabled',
          icon: '💰',
          title: 'Price Alerts',
          description: 'Get notified when textbooks you\'re watching drop in price'
        },
        {
          key: 'new_listings_enabled',
          icon: '📚',
          title: 'New Listings',
          description: 'Receive notifications about new textbook listings'
        }
      ]
    },
    {
      title: 'Delivery Methods',
      settings: [
        {
          key: 'push_enabled',
          icon: '📱',
          title: 'Push Notifications',
          description: 'Show notifications when the app is closed or in background'
        },
        {
          key: 'email_enabled',
          icon: '📧',
          title: 'Email Notifications',
          description: 'Receive notifications via email'
        }
      ]
    },
    {
      title: 'Quiet Hours',
      settings: [
        {
          key: 'quiet_hours_enabled',
          icon: '🌙',
          title: 'Enable Quiet Hours',
          description: 'Mute notifications during specific hours (10 PM - 8 AM)'
        }
      ]
    }
  ];

  const handleToggle = (key, value) => {
    if (onPreferenceChange && !saving) {
      onPreferenceChange(key, value);
    }
  };

  const renderSettingItem = (setting) => (
    <View key={setting.key} style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Text style={styles.settingIcon}>{setting.icon}</Text>
          <Text style={styles.settingTitle}>{setting.title}</Text>
        </View>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      <Switch
        value={preferences[setting.key] || false}
        onValueChange={(value) => handleToggle(setting.key, value)}
        trackColor={{ false: '#D1D1D6', true: '#FFB3B3' }}
        thumbColor={preferences[setting.key] ? '#B71C1C' : '#F4F3F4'}
        disabled={saving}
      />
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {settingsGroups.map((group, index) => (
        <View key={index} style={styles.settingGroup}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.groupContent}>
            {group.settings.map(renderSettingItem)}
          </View>
        </View>
      ))}

      {/* Preview Section */}
      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Notification Preview</Text>
        <Text style={styles.previewSubtitle}>
          This is what your notifications will look like:
        </Text>
        
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewAvatarText}>J</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewSender}>John Doe</Text>
              <Text style={styles.previewMessage}>
                Is the Calculus textbook still available?
              </Text>
              <Text style={styles.previewTime}>2 minutes ago</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ About Notifications</Text>
        <Text style={styles.infoText}>
          • Notifications help you stay updated on important messages{'\n'}
          • You can always change these settings later{'\n'}
          • AI Assistant messages don't trigger notifications{'\n'}
          • Notification history is kept for 30 days
        </Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  groupContent: {
    backgroundColor: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  previewSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  previewHeader: {
    flexDirection: 'row',
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#B71C1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  previewContent: {
    flex: 1,
  },
  previewSender: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  previewMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 12,
    color: '#999999',
  },
  infoSection: {
    backgroundColor: '#FFFBF0',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  spacer: {
    height: 32,
  },
});

export default NotificationSettings;