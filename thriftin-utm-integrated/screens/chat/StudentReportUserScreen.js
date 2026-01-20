// StudentReportUserScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../utils/api';

export default function StudentReportUserScreen({ route, navigation }) {
  const { reportedUserId, reportedUserName, reportedUserMatric, currentUserId, currentUserMatric } = route.params;

  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const reportReasons = [
    'Fraudulent listing - fake items',
    'Spam listings',
    'Suspicious pricing behavior',
    'Harassment or inappropriate behavior',
    'Scam or non-delivery of items',
    'Fake account or impersonation',
    'Other'
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload evidence.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setEvidence({
        uri: result.assets[0].uri,
        type: 'image',
        name: `evidence_${Date.now()}.jpg`
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        setEvidence({
          uri: result.uri,
          type: 'document',
          name: result.name
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const removeEvidence = () => {
    setEvidence(null);
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for reporting.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required', 'Please provide a description of the issue.');
      return;
    }

    Alert.alert(
      'Confirm Report',
      `Are you sure you want to report ${reportedUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: submitReport
        }
      ]
    );
  };

  const submitReport = async () => {
    try {
      setSubmitting(true);
      console.log('📤 Submitting report...');

      const formData = new FormData();
      formData.append('reporter_id', currentUserId);
      formData.append('reporter_matric', currentUserMatric);
      formData.append('reported_user_id', reportedUserId);
      formData.append('reported_matric', reportedUserMatric);
      formData.append('reason', selectedReason);
      formData.append('description', description.trim());

      if (evidence) {
        formData.append('evidence', {
          uri: evidence.uri,
          type: evidence.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
          name: evidence.name
        });
      }

      const response = await api.post('/api/reports/submit', formData);

      console.log('✅ Report submitted:', response.data);

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting. Our team will review this case.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report User</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.userHeader}>
            <Ionicons name="alert-circle" size={24} color="#DC2626" />
            <Text style={styles.userHeaderText}>Reporting</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(reportedUserName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{reportedUserName}</Text>
              <Text style={styles.userMatric}>{reportedUserMatric}</Text>
            </View>
          </View>
        </View>

        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Report *</Text>
          {reportReasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonOption,
                selectedReason === reason && styles.reasonSelected
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={[
                styles.radioOuter,
                selectedReason === reason && styles.radioOuterSelected
              ]}>
                {selectedReason === reason && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={[
                styles.reasonText,
                selectedReason === reason && styles.reasonTextSelected
              ]}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <Text style={styles.sectionSubtitle}>
            Please provide details about this issue
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what happened..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length} / 500</Text>
        </View>

        {/* Evidence Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Upload screenshots or documents to support your report
          </Text>

          {!evidence ? (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#4B5563" />
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Ionicons name="document-outline" size={24} color="#4B5563" />
                <Text style={styles.uploadButtonText}>Upload Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.evidencePreview}>
              {evidence.type === 'image' ? (
                <Image source={{ uri: evidence.uri }} style={styles.evidenceImage} />
              ) : (
                <View style={styles.documentPreview}>
                  <Ionicons name="document-text" size={48} color="#6B7280" />
                  <Text style={styles.documentName} numberOfLines={2}>
                    {evidence.name}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.removeButton} onPress={removeEvidence}>
                <Ionicons name="close-circle" size={24} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            False reports may result in action against your account. Please ensure all information is accurate.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  header: {
    backgroundColor: '#DC2626',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userMatric: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reasonSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#DC2626',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#DC2626',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 8,
  },
  evidencePreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  documentPreview: {
    alignItems: 'center',
    padding: 32,
  },
  documentName: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});