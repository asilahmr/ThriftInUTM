// frontend/src/screens/feedback/FeedbackScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import api from '../../utils/api';
import axios from 'axios';

const FeedbackScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 2;
  
  const [feedbackType, setFeedbackType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    { value: 'bug_report', label: 'Bug Report', icon: '🐛', color: '#F44336' },
    { value: 'feature_request', label: 'Feature Request', icon: '💡', color: '#2196F3' },
    { value: 'improvement', label: 'Improvement', icon: '⚡', color: '#FF9800' },
    { value: 'complaint', label: 'Complaint', icon: '😞', color: '#9C27B0' },
    { value: 'compliment', label: 'Compliment', icon: '😊', color: '#4CAF50' },
  ];

  const validateForm = () => {
    if (!feedbackType) {
      Alert.alert('Required', 'Please select a feedback type');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your feedback');
      return false;
    }
    if (['compliment', 'complaint'].includes(feedbackType) && rating === 0) {
      Alert.alert('Required', 'Please provide a rating');
      return false;
    }
    return true;
  };

  const submitFeedback = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const feedbackData = {
        user_id: userId,
        feedback_type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        rating: rating || null,
        category: 'general',
        platform: Platform.OS,
        app_version: '1.0.0',
        device_info: JSON.stringify({
          os: Platform.OS,
          version: Platform.Version
        })
      };

      console.log('📝 Submitting feedback:', feedbackData);

      const response = await api.post('/feedback', feedbackData);
      
      setLoading(false);
      
      if (response.data.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully. We appreciate your input!',
          [
            {
              text: 'View My Feedback',
              onPress: () => navigation.replace('FeedbackHistory', { userId })
            },
            {
              text: 'Close',
              onPress: () => navigation.goBack()
            }
          ]
        );
        
        // Reset form
        setFeedbackType('');
        setTitle('');
        setDescription('');
        setRating(0);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setLoading(false);
      
      const errorMessage = error.response?.data?.error || 
                          error.message === 'Network Error' 
                            ? 'Cannot connect to server. Please check your internet connection.' 
                            : 'Failed to submit feedback. Please try again.';
      
      Alert.alert('Error', errorMessage);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
          >
            <Text style={styles.star}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Send Feedback</Text>
        <Text style={styles.subtitle}>
          Help us improve ThriftIn with your valuable feedback
        </Text>
        
        <Text style={styles.label}>Feedback Type *</Text>
        <View style={styles.typesGrid}>
          {feedbackTypes.map(type => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                feedbackType === type.value && { 
                  borderColor: type.color, 
                  backgroundColor: type.color + '15' 
                }
              ]}
              onPress={() => setFeedbackType(type.value)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={styles.typeLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {['compliment', 'complaint'].includes(feedbackType) && (
          <>
            <Text style={styles.label}>Rating *</Text>
            {renderStars()}
          </>
        )}
        
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief summary of your feedback"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please provide detailed information..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>
        
        {feedbackType === 'bug_report' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>🔍 For Bug Reports, please include:</Text>
            <Text style={styles.infoText}>
              • Steps to reproduce the issue{'\n'}
              • What you expected to happen{'\n'}
              • What actually happened{'\n'}
              • Screenshots (if applicable)
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitFeedback}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
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
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    marginTop: 12,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  star: {
    fontSize: 32,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
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
    marginTop: 20,
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
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FeedbackScreen;