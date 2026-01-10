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
import RatingStars from './RatingStars';

const FeedbackForm = ({ onSubmit, initialData = {}, loading = false }) => {
  const [feedbackType, setFeedbackType] = useState(initialData.feedbackType || '');
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [rating, setRating] = useState(initialData.rating || 0);

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

  const handleSubmit = () => {
    if (!validate()) return;
    
    onSubmit({
      feedback_type: feedbackType,
      title: title.trim(),
      description: description.trim(),
      rating: rating || null,
      category: 'general',
      platform: Platform.OS,
      app_version: '1.0.0'
    });
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
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#000000',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
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
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedbackForm;