// components/TransactionGuard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

/**
 * TransactionGuard Component
 * Wraps buy/sell buttons and checks if user can perform transactions
 * 
 * Usage:
 * <TransactionGuard onAllowed={() => handleBuyItem()}>
 *   <Button title="Buy Item" />
 * </TransactionGuard>
 */
export default function TransactionGuard({ children, onAllowed }) {
  const [checking, setChecking] = useState(false);
  const [restrictionModal, setRestrictionModal] = useState(false);
  const [restrictions, setRestrictions] = useState(null);

  const checkRestrictions = async () => {
  try {
    setChecking(true);
    
    const response = await api.get('/api/account/check-restrictions');

    setChecking(false);

    if (response.data.canTransact) {
      onAllowed();
    } else {
      setRestrictions(response.data.restrictions);
      setRestrictionModal(true);
    }
  } catch (error) {
    setChecking(false);
    console.error('Check restrictions error:', error);
    alert('Failed to verify account status. Please try again.');
  }
};


  const handleResendVerification = async () => {
  try {
    await api.post('/api/email/resend-verification');
    
    alert('Verification email sent! Please check your inbox.');
    setRestrictionModal(false);
  } catch (error) {
    console.error('Resend verification error:', error);
    alert('Failed to send verification email');
  }
};

  const getRestrictionIcon = (type) => {
    switch (type) {
      case 'suspended':
      case 'permanently_suspended':
        return 'ban';
      case 'email_unverified':
        return 'mail-unread';
      case 'under_investigation':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getRestrictionColor = (type) => {
    switch (type) {
      case 'permanently_suspended':
        return '#DC2626';
      case 'suspended':
      case 'under_investigation':
        return '#D97706';
      case 'email_unverified':
        return '#7C3AED';
      default:
        return '#6B7280';
    }
  };

  return (
    <>
      <TouchableOpacity 
        onPress={checkRestrictions}
        disabled={checking}
        activeOpacity={0.7}
      >
        {checking ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#EF4444" />
          </View>
        ) : (
          children
        )}
      </TouchableOpacity>

      {/* Restriction Modal */}
      <Modal
        visible={restrictionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRestrictionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name={getRestrictionIcon(restrictions?.[0]?.type)} 
                size={48} 
                color={getRestrictionColor(restrictions?.[0]?.type)} 
              />
              <Text style={styles.modalTitle}>Action Restricted</Text>
            </View>

            {restrictions?.map((restriction, index) => (
              <View key={index} style={styles.restrictionCard}>
                <Text style={styles.restrictionMessage}>
                  {restriction.message}
                </Text>

                {restriction.type === 'email_unverified' && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendVerification}
                  >
                    <Ionicons name="mail" size={18} color="#FFFFFF" />
                    <Text style={styles.resendButtonText}>
                      Resend Verification Email
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRestrictionModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  restrictionCard: {
    backgroundColor: '#FEF2F2',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  restrictionMessage: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '500',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});