import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const ReviewSubmissionScreen = ({ navigation, route }) => {
  const { review } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = () => {
    Alert.alert(
      'Approve Registration',
      `Are you sure you want to approve ${review.name}'s registration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await api.post(`/api/admin/approve-submission/${review.id}`);
              Alert.alert('Success', 'Registration approved successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Approve error:', error);
              Alert.alert('Error', 'Failed to approve registration');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Registration',
      `Are you sure you want to reject ${review.name}'s registration?\n\nThe existing reason will be kept: "${review.reason || 'No reason provided'}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await api.post(`/api/admin/reject-submission/${review.id}`);
              Alert.alert('Rejected', 'Registration has been rejected.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Reject error:', error);
              Alert.alert('Error', 'Failed to reject registration');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const InfoRow = ({ icon, label, value, iconFamily = 'MaterialIcons', highlight = false }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        {iconFamily === 'Ionicons' ? (
          <Ionicons name={icon} size={20} color="#666" />
        ) : (
          <MaterialIcons name={icon} size={20} color="#666" />
        )}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[
        styles.infoValue,
        highlight && { color: '#4CAF50', fontWeight: 'bold' }
      ]}>
        {String(value || 'N/A')}
      </Text>
    </View>
  );

  const isMatched = review.autoMatchSuccess || 
    (review.extractedMatric && review.matric && 
     review.extractedMatric.toUpperCase() === review.matric.toUpperCase());

  // Safely handle reason string
  const hasReason = review.reason && typeof review.reason === 'string' && review.reason.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#c85959" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Submission</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileImagePlaceholder}>
            <MaterialIcons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.profileName}>{review.name || 'Unknown'}</Text>
          <Text style={styles.profileEmail}>{review.email || 'No email'}</Text>
          <View style={[
            styles.statusBadge,
            review.autoMatchSuccess && { backgroundColor: '#E8F5E9' }
          ]}>
            <MaterialIcons 
              name={review.autoMatchSuccess ? "verified" : "schedule"} 
              size={16} 
              color={review.autoMatchSuccess ? "#4CAF50" : "#ff9800"} 
            />
            <Text style={[
              styles.statusText,
              review.autoMatchSuccess && { color: '#4CAF50' }
            ]}>
              {review.autoMatchSuccess ? 'Auto-matched' : review.status || 'pending'}
            </Text>
          </View>
        </View>

        {review.autoMatchSuccess ? (
          <View style={styles.matchBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.matchBannerText}>
              <Text style={styles.matchBannerTitle}>Matric Number Matched!</Text>
              <Text style={styles.matchBannerSubtitle}>
                Extracted matric matches registered matric
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={styles.card}>
            <InfoRow 
              icon="badge" 
              label="Registered Matric" 
              value={review.matric}
              highlight={isMatched}
            />
            <InfoRow icon="mail" label="Email" value={review.email} />
            <InfoRow
              icon="calendar-outline"
              iconFamily="Ionicons"
              label="Submitted"
              value={review.submittedDate}
            />
            {review.extractedMatric ? (
              <InfoRow 
                icon="scanner" 
                label="Extracted Matric" 
                value={review.extractedMatric}
                highlight={isMatched}
              />
            ) : null}
          </View>
        </View>

        {isMatched ? (
          <View style={styles.matchInfo}>
            <Ionicons name="information-circle" size={20} color="#4CAF50" />
            <Text style={styles.matchInfoText}>
              The extracted matric number matches the registered matric. This submission can be quickly approved.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uploaded Matric Card</Text>
          <View style={styles.card}>
            {review.filePath ? (
              <Image
                source={{ 
                  uri: `http://10.198.209.113:3000/${review.filePath.replace(/\\/g, '/').replace(/^\/+/, '')}` 
                }}
                style={styles.matricCardImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.matricCardPlaceholder}>
                <MaterialIcons name="credit-card" size={48} color="#ccc" />
                <Text style={styles.placeholderText}>No matric card uploaded</Text>
              </View>
            )}
          </View>
        </View>

        {hasReason ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flag Reason</Text>
            <View style={styles.card}>
              <View style={styles.reasonContainer}>
                <MaterialIcons name="info-outline" size={20} color="#FF9800" />
                <Text style={styles.reasonText}>{review.reason}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Only show action buttons if status is pending or flagged */}
        {(review.status === 'pending' || review.status === 'flagged') ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.approveButton, submitting && styles.buttonDisabled]} 
              onPress={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={22} color="#fff" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.rejectButton, submitting && styles.buttonDisabled]} 
              onPress={handleReject}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="cancel" size={22} color="#fff" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Show final decision banner for verified/rejected submissions */}
        {(review.status === 'verified' || review.status === 'rejected') ? (
          <View style={[
            styles.finalDecisionBanner,
            { backgroundColor: review.status === 'verified' ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <MaterialIcons 
              name={review.status === 'verified' ? "check-circle" : "cancel"} 
              size={24} 
              color={review.status === 'verified' ? "#4CAF50" : "#F44336"} 
            />
            <View style={styles.finalDecisionText}>
              <Text style={[
                styles.finalDecisionTitle,
                { color: review.status === 'verified' ? '#2E7D32' : '#C62828' }
              ]}>
                {review.status === 'verified' ? 'Verified' : 'Rejected'}
              </Text>
              <Text style={styles.finalDecisionSubtitle}>
                {review.reviewedAt 
                  ? `Reviewed on ${new Date(review.reviewedAt).toLocaleString()}`
                  : 'Decision has been finalized'}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#c85959',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#c85959',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff9800',
  },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  matchBannerText: {
    flex: 1,
  },
  matchBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 3,
  },
  matchBannerSubtitle: {
    fontSize: 13,
    color: '#4CAF50',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  matchInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
  },
  matricCardImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  matricCardPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    gap: 10,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalDecisionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  finalDecisionText: {
    flex: 1,
  },
  finalDecisionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  finalDecisionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});

export default ReviewSubmissionScreen;