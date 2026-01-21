// frontend/src/screens/help/ContactSupportScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import api from '../../utils/api';
import axios from 'axios';

const ContactSupportScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 2;
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'technical', label: 'Technical Issue', icon: '🔧' },
    { value: 'account', label: 'Account Problem', icon: '👤' },
    { value: 'payment', label: 'Payment Issue', icon: '💳' },
    { value: 'listing', label: 'Listing Problem', icon: '📚' },
    { value: 'safety', label: 'Safety Concern', icon: '🛡️' },
    { value: 'other', label: 'Other', icon: '❓' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'normal', label: 'Normal', color: '#2196F3' },
    { value: 'high', label: 'High', color: '#FF9800' },
    { value: 'urgent', label: 'Urgent', color: '#F44336' }
  ];

  const validateForm = () => {
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter a subject');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your issue');
      return false;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category');
      return false;
    }
    return true;
  };

  const submitTicket = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const ticketData = {
        user_id: userId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority
      };

      console.log('🎫 Submitting ticket:', ticketData);

      const response = await api.post('/help/tickets', ticketData);
      
      setLoading(false);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          `Your support ticket ${response.data.ticket_number} has been created. We'll respond within 24 hours.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
        
        // Reset form
        setSubject('');
        setDescription('');
        setCategory('');
        setPriority('normal');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setLoading(false);
      
      const errorMessage = error.response?.data?.error || 
                          error.message === 'Network Error' 
                            ? 'Cannot connect to server. Please check your internet connection.' 
                            : 'Failed to submit ticket. Please try again.';
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Contact Support</Text>
        <Text style={styles.subtitle}>
          We typically respond within 24 hours
        </Text>
        
        <Text style={styles.label}>Subject *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief description of your issue"
          value={subject}
          onChangeText={setSubject}
          maxLength={100}
        />
        
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryCard,
                category === cat.value && styles.categoryCardSelected
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {priorities.map(pri => (
            <TouchableOpacity
              key={pri.value}
              style={[
                styles.priorityChip,
                priority === pri.value && { backgroundColor: pri.color }
              ]}
              onPress={() => setPriority(pri.value)}
            >
              <Text style={[
                styles.priorityText,
                priority === pri.value && styles.priorityTextSelected
              ]}>
                {pri.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please provide as much detail as possible..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitTicket}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Ticket</Text>
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
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  categoryCardSelected: {
    borderColor: '#B71C1C',
    backgroundColor: '#FFF5F5',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  priorityText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  priorityTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
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

export default ContactSupportScreen;