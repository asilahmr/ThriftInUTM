// ============================================
// FAQ Detail Screen
// frontend/src/screens/help/FAQDetailScreen.js
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';

const FAQDetailScreen = ({ navigation, route }) => {
  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);
  
  const faqId = route.params?.faqId;
  const userId = route.params?.userId || 2;

  useEffect(() => {
    loadFAQ();
  }, []);

  const loadFAQ = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/help/faq/${faqId}`);
      setFaq(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading FAQ:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load FAQ');
    }
  };

  const handleVote = async (isHelpful) => {
    try {
      await axios.post(`${API_URL}/help/faq/${faqId}/helpful`, {
        userId,
        isHelpful
      });
      
      setUserVote(isHelpful);
      loadFAQ(); // Reload to get updated counts
      
      Alert.alert(
        'Thank you!',
        'Your feedback helps us improve our support content.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  if (loading || !faq) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {faq.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>⭐ Featured Article</Text>
          </View>
        )}
        
        <Text style={styles.question}>{faq.question}</Text>
        
        <View style={styles.metaBar}>
          <Text style={styles.metaText}>👁 {faq.view_count} views</Text>
          <Text style={styles.metaText}>👍 {faq.helpful_count} helpful</Text>
        </View>
        
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{faq.answer}</Text>
        </View>
        
        <View style={styles.helpfulSection}>
          <Text style={styles.helpfulTitle}>Was this article helpful?</Text>
          <View style={styles.helpfulButtons}>
            <TouchableOpacity
              style={[
                styles.helpfulButton,
                userVote === true && styles.helpfulButtonActive
              ]}
              onPress={() => handleVote(true)}
            >
              <Text style={styles.helpfulButtonText}>👍 Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.helpfulButton,
                userVote === false && styles.helpfulButtonActive
              ]}
              onPress={() => handleVote(false)}
            >
              <Text style={styles.helpfulButtonText}>👎 No</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.stillNeedHelp}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupport', { userId })}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};


// ============================================
// Shared Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  featuredText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  answerPreview: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  faqMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999999',
  },
  metaBar: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  readMore: {
    fontSize: 12,
    color: '#B71C1C',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  answerContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  answer: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  helpfulSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  helpfulTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  helpfulButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  helpfulButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  helpfulButtonActive: {
    borderColor: '#B71C1C',
    backgroundColor: '#FFF5F5',
  },
  helpfulButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  stillNeedHelp: {
    backgroundColor: '#FFF5F5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  stillNeedHelpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
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

export default FAQDetailScreen ;