import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Linking,
  RefreshControl, // Added RefreshControl
  Alert
} from 'react-native';
import API_BASE from '../../config';
const API_URL = `${API_BASE}/api`;

const HelpCenterScreen = ({ navigation, route }) => {
  const [categories, setCategories] = useState([]);
  const [featuredFAQs, setFeaturedFAQs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Added refreshing state

  const userId = route.params?.userId || 2;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Don't set loading true on refresh to avoid full screen spinner
      if (!refreshing) setLoading(true);

      const [categoriesRes, faqsRes] = await Promise.all([
        axios.get(`${API_URL}/help/categories`),
        axios.get(`${API_URL}/help/faq?featured=true`)
      ]);

      setCategories(categoriesRes.data);
      setFeaturedFAQs(faqsRes.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.log('API unreachable, using Mock Data for UI testing');
      // FALLBACK TO MOCK DATA so you can see the UI design
      setCategories(MOCK_CATEGORIES);
      setFeaturedFAQs(MOCK_FAQS);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    if (searchQuery.trim().length < 2) {
      Alert.alert('Search', 'Please enter at least 2 characters');
      return;
    }
    // Safety check for navigation
    try {
      navigation.navigate('FAQ', { searchQuery: searchQuery.trim() });
    } catch (e) {
      Alert.alert('Dev Note', 'FAQ Screen not registered yet');
    }
  };

  // Safe navigation wrapper
  const navigateTo = (screen, params = {}) => {
    try {
      navigation.navigate(screen, params);
    } catch (error) {
      console.warn(`Screen ${screen} missing`);
      Alert.alert('Coming Soon', 'This feature is under development.');
    }
  };

  const quickActions = [
    {
      id: 1,
      icon: '💬',
      title: 'Chat Support',
      description: 'Live help',
      action: () => navigateTo('ContactSupport', { userId })
    },
    {
      id: 2,
      icon: '📧',
      title: 'Email Us',
      description: 'Get response in 24h',
      action: () => Linking.openURL('mailto:support@thriftin.utm.my')
    },
    {
      id: 3,
      icon: '📱',
      title: 'WhatsApp',
      description: 'Quick response',
      action: () => Linking.openURL('https://wa.me/60123456789')
    },
    {
      id: 4,
      icon: '📝',
      title: 'Feedback',
      description: 'Share thoughts',
      action: () => navigateTo('Feedback', { userId })
    }
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}


      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🆘</Text>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers, guides, and support
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.action}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionDesc}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured FAQs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Questions</Text>
            <TouchableOpacity onPress={() => navigateTo('FAQ')}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>
          {featuredFAQs.map(faq => (
            <TouchableOpacity
              key={faq.faq_id}
              style={styles.faqItem}
              onPress={() => navigateTo('FAQDetail', { faqId: faq.faq_id })}
            >
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion} numberOfLines={2}>
                  {faq.question}
                </Text>
                <View style={styles.faqMeta}>
                  <Text style={styles.faqViews}>👁 {faq.view_count || 0} views</Text>
                  <Text style={styles.faqHelpful}>👍 {faq.helpful_count || 0}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.category_id}
                style={styles.categoryCard}
                onPress={() => navigateTo('FAQ', {
                  categoryId: category.category_id,
                  categoryName: category.category_name
                })}
              >
                <Text style={styles.categoryIcon}>{category.category_icon}</Text>
                <Text style={styles.categoryName}>{category.category_name}</Text>
                <Text style={styles.categoryCount}>
                  {category.faq_count} articles
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>

          <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => navigateTo('Guides')}
          >
            <View style={styles.resourceIcon}>
              <Text style={styles.resourceIconText}>📚</Text>
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Guides & Tutorials</Text>
              <Text style={styles.resourceDesc}>
                Step-by-step guides to use ThriftIn
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => navigateTo('FeedbackHistory', { userId })}
          >
            <View style={styles.resourceIcon}>
              <Text style={styles.resourceIconText}>🎫</Text>
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>My Support Tickets</Text>
              <Text style={styles.resourceDesc}>
                View your support requests
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Still Need Help */}
        <View style={[styles.section, styles.helpCard]}>
          <Text style={styles.helpCardTitle}>Still need help?</Text>
          <Text style={styles.helpCardText}>
            Our support team is here to assist you. Contact us anytime!
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigateTo('ContactSupport', { userId })}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

// --- MOCK DATA FOR UI TESTING ---
const MOCK_CATEGORIES = [
  { category_id: 1, category_name: 'Account', category_icon: '👤', faq_count: 5 },
  { category_id: 2, category_name: 'Payments', category_icon: '💳', faq_count: 3 },
  { category_id: 3, category_name: 'Buying', category_icon: '🛍️', faq_count: 8 },
  { category_id: 4, category_name: 'Selling', category_icon: '🏷️', faq_count: 6 },
];

const MOCK_FAQS = [
  { faq_id: 101, question: "How do I reset my password?", view_count: 120, helpful_count: 45 },
  { faq_id: 102, question: "Is it safe to pay via ThriftIn?", view_count: 98, helpful_count: 32 },
  { faq_id: 103, question: "How do I arrange a meetup?", view_count: 85, helpful_count: 28 },
];

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1 },
  heroSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  heroIcon: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  heroSubtitle: { fontSize: 14, color: '#666' },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20, // Overlap effect if you want, or keeps it separated
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  clearIcon: { fontSize: 18, color: '#999', padding: 4 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', paddingHorizontal: 16, marginBottom: 10 },
  seeAllText: { fontSize: 14, color: '#B71C1C', fontWeight: '600' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: '1.5%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionIcon: { fontSize: 28, marginBottom: 8 },
  quickActionTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  quickActionDesc: { fontSize: 11, color: '#666', textAlign: 'center' },
  faqItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  faqContent: { flex: 1 },
  faqQuestion: { fontSize: 15, fontWeight: '500', color: '#000', marginBottom: 6 },
  faqMeta: { flexDirection: 'row', gap: 12 },
  faqViews: { fontSize: 12, color: '#999' },
  faqHelpful: { fontSize: 12, color: '#999' },
  chevron: { fontSize: 24, color: '#CCC', marginLeft: 8 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: '1.5%',
    alignItems: 'center',
    elevation: 2,
  },
  categoryIcon: { fontSize: 32, marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  categoryCount: { fontSize: 12, color: '#666' },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceIconText: { fontSize: 20 },
  resourceContent: { flex: 1 },
  resourceTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
  resourceDesc: { fontSize: 13, color: '#666' },
  helpCard: {
    backgroundColor: '#B71C1C',
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  helpCardTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  helpCardText: { fontSize: 14, color: '#FFF', textAlign: 'center', marginBottom: 16, opacity: 0.9, lineHeight: 20 },
  contactButton: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  contactButtonText: { fontSize: 16, fontWeight: 'bold', color: '#B71C1C' },
  spacer: { height: 30 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default HelpCenterScreen;