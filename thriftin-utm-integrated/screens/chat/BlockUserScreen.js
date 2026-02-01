import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import SuccessModal from '../../components/common/SuccessModal';
import api from '../../utils/api'; 

const BlockUserScreen = ({ navigation, route }) => {
  const { blockedId, blockerId, blockedUsername } = route.params;
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const confirmBlock = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for blocking');
      return;
    }

    setShowConfirm(false);
    setLoading(true);
    
    try {
      console.log('🚫 Blocking user:', { blockerId, blockedId, reason: selectedReason });
      
      // ✅ Include /api prefix to match server.js mounting
      const response = await api.post('/api/reports/block', {
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason: selectedReason,
        additional_details: additionalDetails.trim() || ''
      });

      console.log('✅ Block successful:', response.data);
      setLoading(false);
      setShowSuccessModal(true);
      
    } catch (error) {
      setLoading(false);
      console.error('❌ Block Error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to block user. Please try again.';
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Block {blockedUsername}</Text>
        
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠️ They won't be able to message you or see your profile.</Text>
        </View>
        
        <Text style={styles.label}>Reason for blocking *</Text>
        {['spam', 'harassment', 'scam', 'other'].map(r => (
          <TouchableOpacity 
            key={r} 
            style={[styles.opt, selectedReason === r && styles.sel]} 
            onPress={() => setSelectedReason(r)}
          >
            <Text style={[styles.optText, selectedReason === r && styles.selText]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Additional details (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Provide more context if needed..."
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity 
          style={[styles.btn, (!selectedReason || loading) && styles.btnDisabled]} 
          onPress={() => setShowConfirm(true)} 
          disabled={!selectedReason || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF"/>
          ) : (
            <Text style={styles.btnText}>Block User</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Confirm Block?</Text>
            <Text style={styles.dialogText}>
              Are you sure you want to block {blockedUsername}? This action can be reversed later.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity 
                style={[styles.dialogBtn, styles.cancelBtn]} 
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dialogBtn, styles.confirmBtn]} 
                onPress={confirmBlock}
              >
                <Text style={styles.btnText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <SuccessModal 
        visible={showSuccessModal} 
        message={`${blockedUsername} has been blocked`}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.navigate('ChatList');
        }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  content: { 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 15,
    color: '#1F2937'
  },
  warningBox: { 
    backgroundColor: '#FFEBEE', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F'
  },
  warningText: { 
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20
  },
  label: { 
    fontWeight: '600', 
    marginBottom: 10,
    marginTop: 5,
    fontSize: 15,
    color: '#374151'
  },
  opt: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 10, 
    borderWidth: 2, 
    borderColor: '#E5E7EB' 
  },
  sel: { 
    borderColor: '#D32F2F', 
    backgroundColor: '#FEF2F2' 
  },
  optText: {
    fontSize: 15,
    color: '#6B7280'
  },
  selText: {
    color: '#D32F2F',
    fontWeight: '600'
  },
  input: { 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 8, 
    minHeight: 100, 
    textAlignVertical: 'top', 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    fontSize: 14,
    marginBottom: 20
  },
  btn: { 
    backgroundColor: '#D32F2F', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30
  },
  btnDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.6
  },
  btnText: { 
    color: '#FFF', 
    fontWeight: 'bold',
    fontSize: 16
  },
  modal: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  dialog: { 
    backgroundColor: '#FFF', 
    padding: 24, 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937'
  },
  dialogText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 10
  },
  dialogBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  confirmBtn: {
    backgroundColor: '#D32F2F'
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15
  }
});

export default BlockUserScreen;