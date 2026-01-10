import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import SuccessModal from '../../components/common/SuccessModal';

const API_URL = 'http://172.20.10.2:3000/api';

const ReportUserScreen = ({ navigation, route }) => {
  const { reportedId, reporterId, reportedUsername, conversationId, messageId } = route.params;
  
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const reasons = [
    { 
      value: 'spam', 
      label: 'Spam', 
      icon: '🚫',
      description: 'Sending unwanted or repetitive messages'
    },
    { 
      value: 'scam', 
      label: 'Scam', 
      icon: '⚠️',
      description: 'Fraudulent behavior or fake listings'
    },
    { 
      value: 'harassment', 
      label: 'Harassment', 
      icon: '😠',
      description: 'Offensive or threatening messages'
    },
    { 
      value: 'inappropriate', 
      label: 'Inappropriate Content', 
      icon: '🔞',
      description: 'Inappropriate images or messages'
    },
    { 
      value: 'fake_listing', 
      label: 'Fake Listing', 
      icon: '📝',
      description: 'Misleading or fake textbook listings'
    },
    { 
      value: 'impersonation', 
      label: 'Impersonation', 
      icon: '🎭',
      description: 'Pretending to be someone else'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: '❓',
      description: 'Other violation not listed above'
    }
  ];

  const submitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for reporting', [{ text: 'OK' }]);
      return;
    }

    if (selectedReason === 'other' && !additionalDetails.trim()) {
      Alert.alert('Required', 'Please provide details for "Other" reason', [{ text: 'OK' }]);
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/reports/user`, {
        reporter_id: reporterId,
        reported_id: reportedId,
        conversation_id: conversationId,
        message_id: messageId,
        reason: selectedReason,
        additional_details: additionalDetails.trim()
      });

      setLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      setLoading(false);
      console.error('Error submitting report:', error);
      Alert.alert(
        'Error',
        'Failed to submit report. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Report {reportedUsername}</Text>
          <Text style={styles.subtitle}>
            Please select a reason for reporting this user. Your report will be reviewed by our team.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            False reports may result in action against your account. Please report only genuine violations.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reason for Report *</Text>
        <Text style={styles.sectionSubtitle}>
          Select the most appropriate reason for your report
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
            ? 'Please explain your reason in detail' 
            : 'Provide more information to help us understand the issue'}
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the issue in detail..."
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={500}
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>{additionalDetails.length}/500</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 What happens next?</Text>
          <Text style={styles.infoText}>
            • Our team will review your report within 24-48 hours{'\n'}
            • We'll take appropriate action if violations are confirmed{'\n'}
            • You'll receive an update on the report status{'\n'}
            • Your report is confidential and anonymous
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitReport}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
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

      <SuccessModal
        visible={showSuccessModal}
        message={`Successfully reported ${reportedUsername}. Our team will review this report.`}
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
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
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
    borderColor: '#B71C1C',
    backgroundColor: '#FFF5F5',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B71C1C',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#B71C1C',
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
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#B71C1C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
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
});

export default ReportUserScreen;