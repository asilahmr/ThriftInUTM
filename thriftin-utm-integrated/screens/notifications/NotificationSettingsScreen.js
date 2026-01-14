// frontend/src/screens/NotificationSettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import API_BASE from '../../config';
const API_URL = `${API_BASE}/api`;

const NotificationSettingsScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 2;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    new_messages_enabled: true,
    system_updates_enabled: true,
    push_enabled: true
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notifications/preferences/${userId}`);
      setPreferences({
        new_messages_enabled: response.data.new_messages_enabled,
        system_updates_enabled: response.data.system_updates_enabled,
        push_enabled: response.data.push_enabled
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    const newPreferences = {
      ...preferences,
      [key]: value
    };

    // Validate that at least one notification type is enabled
    if (!newPreferences.new_messages_enabled &&
      !newPreferences.system_updates_enabled &&
      !newPreferences.push_enabled) {
      Alert.alert(
        'Warning',
        'At least one notification type must be enabled to receive important updates.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSaving(true);
      setPreferences(newPreferences);

      await axios.put(`${API_URL}/notifications/preferences/${userId}`, newPreferences);

      // Show success toast
      showToast('Settings saved');
      setSaving(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  const showToast = (message) => {
    Alert.alert('', message, [{ text: 'OK' }], {
      cancelable: true,
      onDismiss: () => { }
    });
  };

  const handleResetToDefault = () => {
    Alert.alert(
      'Reset to Default',
      'Are you sure you want to reset all notification settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaultPrefs = {
              new_messages_enabled: true,
              system_updates_enabled: true,
              push_enabled: true
            };

            try {
              setSaving(true);
              await axios.put(`${API_URL}/notifications/preferences/${userId}`, defaultPrefs);
              setPreferences(defaultPrefs);
              showToast('Settings reset to default');
              setSaving(false);
            } catch (error) {
              console.error('Error resetting preferences:', error);
              Alert.alert('Error', 'Failed to reset settings');
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* New Messages Setting */}
        <View style={styles.settingSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingIcon}>💬</Text>
                <Text style={styles.settingTitle}>New Messages</Text>
              </View>
              <Text style={styles.settingDescription}>
                Get notified when you receive new messages from buyers or sellers
              </Text>
            </View>
            <Switch
              value={preferences.new_messages_enabled}
              onValueChange={(value) => updatePreference('new_messages_enabled', value)}
              trackColor={{ false: '#D1D1D6', true: '#FFB3B3' }}
              thumbColor={preferences.new_messages_enabled ? '#B71C1C' : '#F4F3F4'}
              disabled={saving}
            />
          </View>
        </View>

        {/* System Updates Setting */}
        <View style={styles.settingSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingIcon}>🔔</Text>
                <Text style={styles.settingTitle}>System Updates</Text>
              </View>
              <Text style={styles.settingDescription}>
                Receive important announcements, policy changes, and app updates
              </Text>
            </View>
            <Switch
              value={preferences.system_updates_enabled}
              onValueChange={(value) => updatePreference('system_updates_enabled', value)}
              trackColor={{ false: '#D1D1D6', true: '#FFB3B3' }}
              thumbColor={preferences.system_updates_enabled ? '#B71C1C' : '#F4F3F4'}
              disabled={saving}
            />
          </View>
        </View>

        {/* Push Notifications Setting */}
        <View style={styles.settingSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingIcon}>📱</Text>
                <Text style={styles.settingTitle}>Push Notifications</Text>
              </View>
              <Text style={styles.settingDescription}>
                Show notifications when the app is closed or in background
              </Text>
            </View>
            <Switch
              value={preferences.push_enabled}
              onValueChange={(value) => updatePreference('push_enabled', value)}
              trackColor={{ false: '#D1D1D6', true: '#FFB3B3' }}
              thumbColor={preferences.push_enabled ? '#B71C1C' : '#F4F3F4'}
              disabled={saving}
            />
          </View>
        </View>

        {/* Notification Preview Section */}
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

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetToDefault}
          disabled={saving}
        >
          <Text style={styles.resetButtonText}>Reset to Default</Text>
        </TouchableOpacity>

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

      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#B71C1C" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  content: {
    flex: 1,
  },
  settingSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  previewSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
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
    fontSize: 16,
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
  resetButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B71C1C',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B71C1C',
  },
  infoSection: {
    backgroundColor: '#FFFBF0',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  spacer: {
    height: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  savingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});

export default NotificationSettingsScreen;