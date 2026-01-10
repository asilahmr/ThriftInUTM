import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FAQItem = ({ faq, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.question}>{faq.question}</Text>
        <Text style={styles.preview} numberOfLines={2}>
          {faq.answer}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>👁 {faq.view_count}</Text>
          <Text style={styles.metaText}>👍 {faq.helpful_count}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999999',
  },
  chevron: {
    fontSize: 24,
    color: '#CCCCCC',
    marginLeft: 8,
  },
});

export default FAQItem;
