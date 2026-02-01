import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api'; //

export default function StudentReportUserScreen({ route, navigation }) {
  const { reportedUserId, reportedUserName, reportedUserMatric, currentUserId, currentUserMatric } = route.params;
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to attach evidence.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setEvidence({ 
          uri: asset.uri, 
          type: 'image', 
          name: `report_${Date.now()}.jpg`,
          mimeType: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

const submitReport = async () => {
  if (!selectedReason || !description.trim()) {
    Alert.alert('Missing Information', 'Please select a reason and provide a description');
    return;
  }

  try {
    setSubmitting(true);
    
    const formData = new FormData();
    
    formData.append('reporter_id', String(currentUserId));
    formData.append('reporter_matric', String(currentUserMatric));
    formData.append('reported_user_id', String(reportedUserId));
    formData.append('reported_matric', String(reportedUserMatric));
    formData.append('reason', String(selectedReason));
    formData.append('description', String(description).trim());
    
    console.log('📝 Form data prepared');
    
    if (evidence) {
      console.log('📎 Adding file');
      formData.append('evidence', {
        uri: evidence.uri,
        type: 'image/jpeg',
        name: `evidence_${Date.now()}.jpg`
      });
    }

    console.log('🚀 Sending request...');
    
    const token = await AsyncStorage.getItem('token');
    
    // ✅ 创建超时 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
    });
    
    // ✅ 创建 fetch Promise
    const fetchPromise = fetch('http://10.201.106.118:3000/api/reports/submit', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    
    // ✅ Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log('📡 Response received, status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    // ✅ 检查响应是否有内容
    const contentType = response.headers.get('content-type');
    console.log('📡 Content-Type:', contentType);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('✅ Response data:', data);
    } else {
      const text = await response.text();
      console.log('⚠️ Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }
    
    setSubmitting(false);
    
    if (response.ok && data.success) {
      Alert.alert(
        'Report Submitted', 
        'Our team will review your report shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Submission Failed', data.error || data.message || 'Unknown error');
    }
    
  } catch (error) {
    setSubmitting(false);
    
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.message.includes('timeout')) {
      Alert.alert(
        'Request Timeout', 
        'The server is taking too long to respond. The report may have been submitted. Please check your reports list.',
        [
          { text: 'Check Reports', onPress: () => navigation.goBack() },
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert('Submission Failed', error.message || 'Network error occurred');
    }
  }
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report User</Text>
        <View style={{width: 24}}/>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.userInfoBox}>
          <Text style={styles.userInfoLabel}>Reporting:</Text>
          <Text style={styles.userName}>{reportedUserName}</Text>
        </View>

        <Text style={styles.label}>Reason for Report *</Text>
        {['Spam', 'Harassment', 'Scam', 'Other'].map(r => (
          <TouchableOpacity 
            key={r} 
            style={[styles.opt, selectedReason === r && styles.sel]} 
            onPress={() => setSelectedReason(r)}
          >
            <View style={styles.radioOuter}>
              {selectedReason === r && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.optText, selectedReason === r && styles.selText]}>{r}</Text>
          </TouchableOpacity>
        ))}
        
        <Text style={styles.label}>Description *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Describe what happened..."
          value={description} 
          onChangeText={setDescription} 
          multiline 
          numberOfLines={5}
        />
        
        <Text style={styles.label}>Evidence (Optional)</Text>
        <TouchableOpacity style={styles.upload} onPress={pickImage}>
          {evidence ? (
            <View style={styles.evidencePreview}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.evidenceText}>{evidence.name}</Text>
              <TouchableOpacity onPress={() => setEvidence(null)}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadContent}>
              <Ionicons name="cloud-upload-outline" size={32} color="#6B7280" />
              <Text style={styles.uploadText}>Tap to upload evidence</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, (submitting || !selectedReason || !description.trim()) && styles.btnDisabled]} 
          onPress={submitReport} 
          disabled={submitting || !selectedReason || !description.trim()}
        >
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Submit Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    backgroundColor: '#DC2626', 
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  userInfoBox: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#DC2626' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  label: { fontWeight: '700', marginBottom: 10, marginTop: 12, fontSize: 15, color: '#1F2937' },
  opt: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  sel: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  input: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E7EB' },
  upload: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, marginTop: 4, marginBottom: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#D1D5DB' },
  evidencePreview: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  evidenceText: { flex: 1, fontSize: 14, color: '#10B981' },
  btn: { backgroundColor: '#DC2626', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  btnDisabled: { backgroundColor: '#FCA5A5' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});