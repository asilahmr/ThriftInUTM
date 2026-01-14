// screens/ReportDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function ReportDetailScreen({ route, navigation }) {
  const { userId, userName, userEmail, userMatric } = route.params;
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [reports, setReports] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    try {
      console.log('\n=== LOADING USER DETAILS ===');
      console.log('User ID:', userId);

      const [userResponse, reportsResponse] = await Promise.all([
        api.get(`/api/account/admin/user/${userId}`),
        api.get(`/api/account/admin/user/${userId}/reports`)
      ]);

      console.log('User details:', userResponse.data);
      console.log('Reports:', reportsResponse.data.reports);
      console.log('Number of reports:', reportsResponse.data.reports?.length || 0);

      setUserDetails(userResponse.data);
      setReports(reportsResponse.data.reports || []);
      setLoading(false);
      console.log('=== USER DETAILS LOADED ===\n');
    } catch (error) {
      console.error('❌ Load details error:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', 'Failed to load user details');
      setLoading(false);
    }
  };

  const handleSuspendTemporarily = () => {
    Alert.alert(
      'Suspend Temporarily',
      `Suspend ${userName || 'this user'} temporarily?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              console.log('Suspending user:', userId);
              
              const response = await api.post('/api/account/admin/suspend-temporary', { 
                userId: parseInt(userId) 
              });
              
              console.log('Suspend response:', response.data);
              
              Alert.alert('Success', 'User has been temporarily suspended',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    navigation.goBack();
                    // Refresh the previous screen if possible
                    if (route.params?.onGoBack) {
                      route.params.onGoBack();
                    }
                  }
                }]
              );
            } catch (error) {
              console.error('Suspend error:', error.response?.data || error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to suspend user');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleSuspendPermanently = () => {
    Alert.alert(
      'Permanent Suspension',
      `Permanently ban ${userName || 'this user'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              console.log('Permanently suspending user:', userId);
              
              const response = await api.post('/api/account/admin/suspend-permanent', { 
                userId: parseInt(userId) 
              });
              
              console.log('Permanent suspend response:', response.data);
              
              Alert.alert('Success', 'User has been permanently suspended',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    navigation.goBack();
                    if (route.params?.onGoBack) {
                      route.params.onGoBack();
                    }
                  }
                }]
              );
            } catch (error) {
              console.error('Permanent suspend error:', error.response?.data || error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to suspend user');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleReinstate = () => {
    Alert.alert(
      'Reinstate User',
      `Restore ${userName || 'this user'} to Active status?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reinstate',
          onPress: async () => {
            try {
              setProcessing(true);
              console.log('Reinstating user:', userId);
              
              const response = await api.post('/api/account/admin/reinstate', { 
                userId: parseInt(userId) 
              });
              
              console.log('Reinstate response:', response.data);
              
              Alert.alert('Success', 'User has been reinstated',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    navigation.goBack();
                    if (route.params?.onGoBack) {
                      route.params.onGoBack();
                    }
                  }
                }]
              );
            } catch (error) {
              console.error('Reinstate error:', error.response?.data || error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to reinstate user');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#A94442" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Details</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A94442" />
        </View>
      </View>
    );
  }

  const accountStatus = userDetails?.accountStatus || userDetails?.account_status || 'active';
  const verificationStatus = userDetails?.verification_status || 'pending';
  const emailVerified = userDetails?.email_verified || false;
  
  const isPermanentlySuspended = accountStatus === 'permanently_suspended';
  const isTemporarilySuspended = accountStatus === 'suspended';
  const isRestricted = accountStatus === 'restricted';

  const hasReports = reports.length > 0;
  const isUnverified = !emailVerified || verificationStatus !== 'verified';

  console.log('=== STATUS CHECK ===');
  console.log('Account Status:', accountStatus);
  console.log('Has Reports:', hasReports, '(Count:', reports.length, ')');
  console.log('Is Unverified:', isUnverified);
  console.log('Email Verified:', emailVerified);
  console.log('Verification Status:', verificationStatus);

  //Allow reinstate for restricted users with reports
  const canReinstate = isTemporarilySuspended || isRestricted;
  const canSuspendTemp = !isTemporarilySuspended && !isPermanentlySuspended;

  console.log('Can Reinstate:', canReinstate);
  console.log('Can Suspend Temp:', canSuspendTemp);
  console.log('==================\n');

  const getStatusBadge = () => {
    if (isPermanentlySuspended) {
      return { icon: 'ban', text: 'Permanently Suspended', color: '#DC2626' };
    }
    if (isTemporarilySuspended) {
      return { icon: 'time', text: 'Temporarily Suspended', color: '#F59E0B' };
    }
    if (isRestricted) {
      if (hasReports && isUnverified) {
        return { icon: 'alert-circle', text: 'Restricted (Reported & Unverified)', color: '#DC2626' };
      }
      if (hasReports) {
        return { icon: 'alert-circle', text: 'Restricted (Reported)', color: '#DC2626' };
      }
      if (isUnverified) {
        return { icon: 'shield-outline', text: 'Restricted (Unverified)', color: '#F59E0B' };
      }
    }
    return { icon: 'checkmark-circle', text: 'Active', color: '#10B981' };
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A94442" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Details</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {(userName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{userName || 'No Name'}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
          <Text style={styles.profileMatric}>{userMatric}</Text>
          
          <View style={[styles.statusBadgeLarge, { backgroundColor: statusBadge.color }]}>
            <Ionicons name={statusBadge.icon} size={16} color="#FFFFFF" />
            <Text style={styles.statusTextLarge}>{statusBadge.text}</Text>
          </View>

          {isRestricted && (
            <View style={styles.restrictionInfoBox}>
              {hasReports && (
                <View style={styles.restrictionRow}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.restrictionText}>
                    {reports.length} report{reports.length > 1 ? 's' : ''} filed against this user
                  </Text>
                </View>
              )}
              {isUnverified && (
                <View style={styles.restrictionRow}>
                  <Ionicons name="shield-outline" size={16} color="#F59E0B" />
                  <Text style={[styles.restrictionText, { color: '#F59E0B' }]}>
                    Account not verified
                  </Text>
                </View>
              )}
              {!hasReports && !isUnverified && (
                <View style={styles.restrictionRow}>
                  <Ionicons name="information-circle" size={16} color="#6B7280" />
                  <Text style={[styles.restrictionText, { color: '#6B7280' }]}>
                    Account is restricted
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Show report status even for non-restricted users */}
          {!isRestricted && hasReports && (
            <View style={styles.reportBadge}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.reportBadgeText}>
                {reports.length} report{reports.length > 1 ? 's' : ''} on file
              </Text>
            </View>
          )}
        </View>

        {reports.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color="#DC2626" />
              <Text style={styles.sectionTitle}>
                Report File ({reports.length})
              </Text>
            </View>
            
            {reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                {/* Report Reason Section */}
                <View style={styles.reportReasonSection}>
                  <View style={styles.reportReasonHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#DC2626" />
                    <Text style={styles.reportReasonTitle}>Report Reason</Text>
                  </View>
                  <Text style={styles.reportReasonText}>{report.reason}</Text>
                  {report.description && (
                    <Text style={styles.reportDescription}>{report.description}</Text>
                  )}
                </View>

                {/* Evidence Section */}
                <View style={styles.evidenceSection}>
                  <View style={styles.evidenceHeader}>
                    <Ionicons name="shield-outline" size={20} color="#DC2626" />
                    <Text style={styles.evidenceTitle}>Evidence</Text>
                  </View>
                  
                  {report.evidence && report.evidence.length > 0 ? (
                    report.evidence.map((evidence, index) => (
                      <View key={index} style={styles.evidenceContent}>
                        {evidence.fileType && evidence.fileType.startsWith('image/') ? (
                          <View style={styles.evidenceImageContainer}>
                            <Image 
                              source={{ uri: `${api.defaults.baseURL}/${evidence.filePath}` }}
                              style={styles.evidenceImage}
                              resizeMode="contain"
                            />
                            <View style={styles.evidenceFooter}>
                              <Ionicons name="image-outline" size={14} color="#6B7280" />
                              <Text style={styles.evidenceFooterText}>Evidence image uploaded</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.evidenceFileContainer}>
                            <Ionicons name="document-outline" size={20} color="#6B7280" />
                            <Text style={styles.evidenceFileName}>
                              {evidence.filePath.split('/').pop()}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={styles.noEvidenceContainer}>
                      <Text style={styles.noEvidenceText}>No evidence</Text>
                    </View>
                  )}
                </View>

                {/* Reporter Info */}
                <View style={styles.reportFooter}>
                  <Ionicons name="person-outline" size={14} color="#6B7280" />
                  <Text style={styles.reportedBy}>
                    Reported by: {report.reporterName} ({report.reporterEmail})
                  </Text>
                </View>

                {/* Report Date */}
                <View style={styles.reportDateContainer}>
                  <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.reportDate}>
                    Reported on {new Date(report.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Show message if no reports */}
        {reports.length === 0 && (
          <View style={styles.section}>
            <View style={styles.noReportsCard}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.noReportsTitle}>No Reports Filed</Text>
              <Text style={styles.noReportsText}>
                This user has no reports against their account.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>Administrative Actions</Text>
          </View>

          {isPermanentlySuspended ? (
            <View style={styles.permanentBanner}>
              <Ionicons name="ban" size={24} color="#DC2626" />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Account Permanently Suspended</Text>
                <Text style={styles.bannerSubtitle}>
                  This user can no longer access the platform.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              {canReinstate && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.successButton]}
                  onPress={handleReinstate}
                  disabled={processing}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {processing ? 'Processing...' : 'Reinstate Account'}
                  </Text>
                </TouchableOpacity>
              )}

              {canSuspendTemp && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.warningButton]}
                  onPress={handleSuspendTemporarily}
                  disabled={processing}
                >
                  <Ionicons name="time" size={22} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {processing ? 'Processing...' : 'Suspend Temporarily'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleSuspendPermanently}
                disabled={processing}
              >
                <Ionicons name="ban" size={22} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {processing ? 'Processing...' : 'Escalate to Permanent Suspension'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: {
    backgroundColor: '#A94442',
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
    marginBottom: 8,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#FFFFFF', 
    opacity: 0.9 
  },
  content: { 
    flex: 1, 
    paddingTop: 20 
  },
  profileCard: {
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginBottom: 16,
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    elevation: 2,
  },
  avatarLarge: {
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#FEE2E2',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  avatarLargeText: { 
    fontSize: 36, 
    fontWeight: '700', 
    color: '#DC2626' 
  },
  profileName: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 4 
  },
  profileEmail: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginBottom: 2 
  },
  profileMatric: { 
    fontSize: 13, 
    color: '#9CA3AF', 
    marginBottom: 16 
  },
  statusBadgeLarge: {
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginBottom: 12,
  },
  statusTextLarge: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#FFFFFF', 
    marginLeft: 6 
  },
  restrictionInfoBox: {
    width: '100%', 
    backgroundColor: '#FEF2F2', 
    borderRadius: 12,
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#FEE2E2',
  },
  restrictionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 4 
  },
  restrictionText: { 
    fontSize: 13, 
    color: '#DC2626', 
    fontWeight: '500', 
    marginLeft: 8,
    flex: 1
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  reportBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 6,
  },
  noReportsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1FAE5',
    borderStyle: 'dashed',
  },
  noReportsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 12,
    marginBottom: 8,
  },
  noReportsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: { 
    marginHorizontal: 16, 
    marginBottom: 16 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#111827', 
    marginLeft: 8 
  },
  reportCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 0,
    marginBottom: 16, 
    elevation: 2,
    overflow: 'hidden',
  },
  reportReasonSection: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  reportReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportReasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  reportReasonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#DC2626',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  evidenceSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  evidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  evidenceContent: {
    marginTop: 8,
  },
  evidenceImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  evidenceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  evidenceFooterText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  evidenceFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  evidenceFileName: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  noEvidenceContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 60,
  },
  noEvidenceText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reportedBy: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  reportDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  reportDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  permanentBanner: {
    flexDirection: 'row', 
    backgroundColor: '#FEE2E2', 
    borderRadius: 16,
    padding: 20, 
    borderWidth: 2, 
    borderColor: '#FCA5A5',
  },
  bannerTextContainer: { 
    flex: 1, 
    marginLeft: 12 
  },
  bannerTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#DC2626', 
    marginBottom: 4 
  },
  bannerSubtitle: { 
    fontSize: 13, 
    color: '#991B1B', 
    lineHeight: 18 
  },
  actionsContainer: { 
    gap: 12 
  },
  actionButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 16, 
    borderRadius: 12, 
    elevation: 2,
  },
  successButton: { 
    backgroundColor: '#10B981' 
  },
  warningButton: { 
    backgroundColor: '#F59E0B' 
  },
  dangerButton: { 
    backgroundColor: '#DC2626' 
  },
  actionButtonText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#FFFFFF', 
    marginLeft: 8 
  },
});