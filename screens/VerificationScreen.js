import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';

const API_URL = 'http://10.198.209.113:3000';

export default function VerificationScreen({ navigation }) {
  const [matricCardImage, setMatricCardImage] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedMatric, setExtractedMatric] = useState(null);
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('=== LOADING VERIFICATION STATUS ===');
      const response = await api.get('/api/profile/me');
      
      if (response.data.success) {
        const user = response.data.data;
        setStudentId(user.matric || '');
        setVerificationStatus(user.verificationStatus || 'pending');
        
        if (user.matricCardPath) {
          const imageUrl = user.matricCardPath.startsWith('http') 
          ? user.matricCardPath 
          : `${API_URL}/${user.matricCardPath}`;
        
        console.log('Matric card image URL:', imageUrl);
        setMatricCardImage(imageUrl);
        }
        
        console.log('Verification status loaded:', user.verificationStatus);
      }
    } catch (error) {
      console.error('Load verification status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setMatricCardImage(imageUri);
      setExtractedMatric(null);
      setIsMatched(false);
      await extractMatricFromImage(imageUri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Camera permission is needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setMatricCardImage(imageUri);
      setExtractedMatric(null);
      setIsMatched(false);
      await extractMatricFromImage(imageUri);
    }
  };

  const extractMatricFromImage = async (imageUri) => {
    setExtracting(true);
    try {
      console.log('=== EXTRACTING MATRIC NUMBER ===');
      
      const formData = new FormData();
      formData.append('matricCard', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'matric_card.jpg'
      });

      const response = await api.post('/api/verification/extract-matric', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      });

      console.log('OCR Response:', response.data);

      if (response.data.success && response.data.extractedMatric) {
        setExtractedMatric(response.data.extractedMatric);
        
        // Check if extracted matric matches registered matric
        if (response.data.extractedMatric === studentId) {
          setIsMatched(true);
          
          // Auto-submit for verification
          Alert.alert(
            'Match Found!',
            `Matric number ${response.data.extractedMatric} detected and matches your registered ID. Submitting for verification...`,
            [
              {
                text: 'OK',
                onPress: () => autoSubmitVerification(imageUri)
              }
            ]
          );
        } else {
          setIsMatched(false);
          Alert.alert(
            'Mismatch Detected', 
            `Detected matric (${response.data.extractedMatric}) does not match your registered matric (${studentId}).\n\nYou can:\n• Re-upload a clearer image\n• Submit anyway for manual review`,
            [
              { text: 'Re-upload', onPress: handleUploadMatricCard },
              { text: 'Submit Anyway', onPress: () => handleSubmitVerification(imageUri) }
            ]
          );
        }
      } else {
        setIsMatched(false);
        Alert.alert(
          'No Matric Detected',
          'Could not automatically extract matric number.\n\nYou can:\n• Re-upload a clearer image\n• Submit for manual review',
          [
            { text: 'Re-upload', onPress: handleUploadMatricCard },
            { text: 'Submit Anyway', onPress: () => handleSubmitVerification(imageUri) }
          ]
        );
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setIsMatched(false);
      Alert.alert(
        'Extraction Failed',
        'Could not extract matric number automatically.\n\nYou can:\n• Re-upload the image\n• Submit for manual review',
        [
          { text: 'Re-upload', onPress: handleUploadMatricCard },
          { text: 'Submit Anyway', onPress: () => handleSubmitVerification(imageUri) }
        ]
      );
    } finally {
      setExtracting(false);
    }
  };

  const autoSubmitVerification = async (imageUri) => {
    try {
      setSubmitting(true);
      console.log('=== AUTO-SUBMITTING VERIFICATION ===');

      const formData = new FormData();
      formData.append('matricCard', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'matric_card.jpg'
      });

      const response = await api.post('/api/verification/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      });

      console.log('Auto-submit response:', response.data);

      if (response.data.success) {
        Alert.alert('Success!', 'Your verification has been automatically submitted for review!');
        setVerificationStatus(response.data.data.status);

        if (response.data.data.matricCardPath) {
        const imageUrl = `${API_URL}/${response.data.data.matricCardPath}`;
        setMatricCardImage(imageUrl);
      }

        await loadUserData();
      }
    } catch (error) {
      console.error('Auto-submit verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit verification';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadMatricCard = () => {
    Alert.alert(
      'Upload Matric Card',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleSubmitVerification = async (imageUri = matricCardImage) => {
    if (!imageUri) {
      Alert.alert('Error', 'Please upload your matric card first');
      return;
    }

    try {
      setSubmitting(true);
      console.log('=== SUBMITTING VERIFICATION ===');

      const formData = new FormData();
      formData.append('matricCard', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'matric_card.jpg'
      });

      const response = await api.post('/api/verification/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      });

      console.log('Verification response:', response.data);

      if (response.data.success) {
        Alert.alert('Success', 'Your verification has been submitted for review!');
        setVerificationStatus(response.data.data.status);

        if (response.data.data.matricCardPath) {
          const imageUrl = `${API_URL}/${response.data.data.matricCardPath}`;
          setMatricCardImage(imageUrl);
        }
        await loadUserData();
      }
    } catch (error) {
      console.error('Submit verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit verification';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = () => {
    switch(verificationStatus) {
      case 'verified': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'flagged': return '#FF9800';
      default: return '#FFA726';
    }
  };

  const getStatusText = () => {
    switch(verificationStatus) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'flagged': return 'Under Review';
      default: return 'Pending';
    }
  };

  const getStatusMessage = () => {
    switch(verificationStatus) {
      case 'verified': return 'Your identity has been verified';
      case 'rejected': return 'Verification rejected. Please upload a valid matric card';
      case 'flagged': return 'Your submission is under manual review';
      default: return 'Please upload your matric card to verify your identity';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A94442" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A94442" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Matric Number</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons 
            name={
              verificationStatus === 'verified' ? "checkmark-circle" : 
              verificationStatus === 'rejected' ? "close-circle" : 
              "time-outline"
            } 
            size={24} 
            color={getStatusColor()} 
          />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Information</Text>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Matric number</Text>
              <Text style={styles.infoValue}>{studentId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload Matric Card</Text>
          
          {!matricCardImage ? (
            <TouchableOpacity 
              style={styles.uploadBox}
              onPress={handleUploadMatricCard}
              disabled={verificationStatus === 'verified' || submitting}
            >
              <View style={styles.uploadIcon}>
                <Ionicons name="cloud-upload-outline" size={48} color="#999" />
              </View>
              <Text style={styles.uploadText}>Click to upload matric card</Text>
              <Text style={styles.uploadSubtext}>Take photo or choose from gallery</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadedContainer}>
              <Image 
                source={{ uri: matricCardImage }} 
                style={styles.uploadedImage}
                resizeMode="contain"
              />
              
              {extracting && (
                <View style={styles.extractingBanner}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.extractingText}>Extracting and verifying matric number...</Text>
                </View>
              )}
              
              {submitting && (
                <View style={styles.extractingBanner}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={[styles.extractingText, { color: '#2E7D32' }]}>Submitting for verification...</Text>
                </View>
              )}
              
              {extractedMatric && !extracting && !submitting && (
                <View style={[
                  styles.extractedBanner,
                  { backgroundColor: isMatched ? '#E8F5E9' : '#FFF3E0' }
                ]}>
                  <Ionicons 
                    name={isMatched ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={isMatched ? "#4CAF50" : "#FF9800"} 
                  />
                  <Text style={[
                    styles.extractedText,
                    { color: isMatched ? '#2E7D32' : '#E65100' }
                  ]}>
                    Detected: {extractedMatric}
                    {isMatched ? ' ✓ Match' : ' ⚠ Mismatch'}
                  </Text>
                </View>
              )}
              
              {verificationStatus !== 'verified' && !submitting && (
                <TouchableOpacity 
                  style={styles.reuploadButton}
                  onPress={handleUploadMatricCard}
                >
                  <Ionicons name="refresh-outline" size={20} color="#A94442" />
                  <Text style={styles.reuploadText}>Re-upload</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {matricCardImage && verificationStatus !== 'verified' && !isMatched && !submitting && !extracting && (
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={() => handleSubmitVerification()}
          >
            <Text style={styles.submitButtonText}>Submit for Manual Review</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
          <Text style={styles.infoBoxText}>
            {isMatched 
              ? 'Your matric card has been auto-submitted since it matches your registered ID. Review typically takes 1-2 business days.'
              : 'Upload a clear photo of your matric card. If the matric number matches your registered ID, it will be automatically submitted for verification.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#A94442',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadIcon: {
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#999',
  },
  uploadedContainer: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  extractingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    width: '100%',
  },
  extractingText: {
    fontSize: 14,
    color: '#1976D2',
  },
  extractedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    width: '100%',
  },
  extractedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reuploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A94442',
  },
  reuploadText: {
    fontSize: 14,
    color: '#A94442',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF9800',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});