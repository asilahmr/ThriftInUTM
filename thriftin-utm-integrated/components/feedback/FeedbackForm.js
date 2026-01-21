
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
import axios from 'axios';
import API_BASE from '../../config';
import RatingStars from './RatingStars';

const API_URL = `${API_BASE}/api`;

const FeedbackForm = ({ userId, onSubmit, initialData = {}, loading = false }) => {
  const [feedbackType, setFeedbackType] = useState(initialData.feedbackType || '');
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [rating, setRating] = useState(initialData.rating || 0);
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    { value: 'bug_report', label: 'Bug Report', icon: '🐛', color: '#F44336' },
    { value: 'feature_request', label: 'Feature Request', icon: '💡', color: '#2196F3' },
    { value: 'improvement', label: 'Improvement', icon: '⚡', color: '#FF9800' },
    { value: 'complaint', label: 'Complaint', icon: '😞', color: '#9C27B0' },
    { value: 'compliment', label: 'Compliment', icon: '😊', color: '#4CAF50' },
  ];

  const validate = () => {
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

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setSubmitting(true);
    
    try {
      const feedbackData = {
        user_id: userId,
        feedback_type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        rating: rating || null,
        category: 'general',
        platform: Platform.OS,
        app_version: '1.0.0'
      };

      const response = await axios.post(`${API_URL}/feedback`, feedbackData);
      
      setSubmitting(false);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Your feedback has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFeedbackType('');
                setTitle('');
                setDescription('');
                setRating(0);
                
                // Call parent callback if provided
                if (onSubmit) {
                  onSubmit(response.data);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitting(false);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit feedback. Please try again.'
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Feedback Type *</Text>
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
            activeOpacity={0.7}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={styles.typeLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {['compliment', 'complaint'].includes(feedbackType) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating *</Text>
          <RatingStars 
            rating={rating} 
            onRatingChange={setRating}
            size="large"
          />
          <Text style={styles.ratingLabel}>
            {rating === 0 && 'Tap to rate'}
            {rating === 1 && '😞 Poor'}
            {rating === 2 && '😕 Fair'}
            {rating === 3 && '😐 Good'}
            {rating === 4 && '😊 Very Good'}
            {rating === 5 && '🤩 Excellent'}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief summary of your feedback"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>{title.length}/100</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please provide detailed information..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          maxLength={1000}
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>
      </View>

      {feedbackType === 'bug_report' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔍 For Bug Reports, please include:</Text>
          <Text style={styles.infoText}>
            • Steps to reproduce the issue{'\n'}
            • What you expected to happen{'\n'}
            • What actually happened{'\n'}
            • Device and app version
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (loading || submitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading || submitting}
        activeOpacity={0.8}
      >
        {(loading || submitting) ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};