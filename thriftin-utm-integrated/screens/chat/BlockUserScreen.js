import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import axios from 'axios';
import SuccessModal from '../../components/common/SuccessModal';
import API_BASE from '../../config';
const API_URL = `${API_BASE}/api`;

const BlockUserScreen = ({ navigation, route }) => {
  const { blockedId, blockerId, blockedUsername } = route.params;
  
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const reasons = [
    { 
      value: 'spam', 
      label: 'Spam', 
      icon: '🚫',
      description: 'Sending unwanted or repetitive messages'
    },
    { 
      value: 'harassment', 
      label: 'Harassment', 
      icon: '😠',
      description: 'Offensive or threatening behavior'
    },
    { 
      value: 'inappropriate', 
      label: 'Inappropriate Content', 
      icon: '🔞',
      description: 'Sending inappropriate messages or images'
    },
    { 
      value: 'fake_profile', 
      label: 'Fake Profile', 
      icon: '🎭',
      description: 'Suspicious or impersonating account'
    },
    { 
      value: 'scam', 
      label: 'Scam/Fraud', 
      icon: '⚠️',
      description: 'Fraudulent behavior or scam attempts'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: '❓',
      description: 'Other reason not listed above'
    }
  ];

  const blockUser = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for blocking this user', [{ text: 'OK' }]);
      return;
    }

    if (selectedReason === 'other' && !additionalDetails.trim()) {
      Alert.alert('Required', 'Please provide details for "Other" reason', [{ text: 'OK' }]);
      return;
    }

    if (additionalDetails.trim().length > 0 && additionalDetails.trim().length < 10) {
      Alert.alert('Too Short', 'Please provide more details (at least 10 characters)', [{ text: 'OK' }]);
      return;
    }

    setShowConfirm(true);
  };

  const confirmBlock = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      await axios.post(`${API_URL}/reports/block`, {
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason: selectedReason,
        additional_details: additionalDetails.trim()
      });

      setLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      setLoading(false);
      console.error('Error blocking user:', error);
      Alert.alert(
        'Error',
        'Failed to block user. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('ChatList');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Block {blockedUsername}</Text>
          <Text style={styles.subtitle}>
            Blocking this user will prevent all future communication
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>🚫</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>When you block this user:</Text>
            <Text style={styles.warningText}>
              • You won't receive messages from them{'\n'}
              • They won't see your online status{'\n'}
              • Your conversation will be hidden{'\n'}
              • They won't be notified about the block{'\n'}
              • You can unblock them later from settings
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reason for Blocking *</Text>
        <Text style={styles.sectionSubtitle}>
          Please select why you're blocking this user
        </Text>
        <View style={styles.reasonsContainer}>
          {reasons.map(reason => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonOption,
                selectedReason === reason.value && styles.reasonSelected
              ]}
              onPress={() => setSelectedReason(reason.value)}
              activeOpacity={0.7}
            >
              <View style={styles.radioButton}>
                {selectedReason === reason.value && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
              <View style={styles.reasonContent}>
                <View style={styles.reasonHeader}>
                  <Text style={styles.reasonIcon}>{reason.icon}</Text>
                  <Text style={styles.reasonText}>{reason.label}</Text>
                </View>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Additional Details {selectedReason === 'other' ? '*' : '(Optional)'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {selectedReason === 'other' 
            ? 'Please explain your reason (minimum 10 characters)' 
            : 'Provide more information if needed'}
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder="Example: This user keeps sending spam messages about unrelated products..."
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={500}
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>{additionalDetails.length}/500</Text>

        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 Before you block:</Text>
          <Text style={styles.tipsText}>
            • Consider reporting if they've violated our policies{'\n'}
            • You can also mute notifications instead{'\n'}
            • Blocking is reversible from your settings{'\n'}
            • Serious violations should be reported to our team
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.blockButton, loading && styles.blockButtonDisabled]}
          onPress={blockUser}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.blockButtonIcon}>🚫</Text>
              <Text style={styles.blockButtonText}>Block {blockedUsername}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmIcon}>🚫</Text>
            <Text style={styles.confirmTitle}>Block {blockedUsername}?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to block this user? You won't be able to send or receive messages from them until you unblock.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowConfirm(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBlockButton}
                onPress={confirmBlock}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmBlockText}>Block User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        message={`Successfully blocked ${blockedUsername}. You won't receive messages from them anymore.`}
        onClose={handleModalClose}
      />
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
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#C62828',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 12,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  reasonSelected: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFEBEE',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D32F2F',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D32F2F',
  },
  reasonContent: {
    flex: 1,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  reasonDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    color: '#000000',
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 20,
  },
  tipsBox: {
    backgroundColor: '#FFFBF0',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
  },
  blockButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  blockButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  blockButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  blockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  confirmBlockButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
  },
  confirmBlockText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BlockUserScreen;