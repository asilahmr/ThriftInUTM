import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

const GuidesScreen = ({ navigation }) => {
  const guides = [
    {
      id: 1,
      title: 'Getting Started with ThriftIn',
      icon: '🚀',
      description: 'Learn the basics of using ThriftIn',
      sections: [
        'Creating your account',
        'Setting up your profile',
        'Finding textbooks',
        'Making your first purchase'
      ]
    },
    {
      id: 2,
      title: 'How to Buy Textbooks',
      icon: '📚',
      description: 'Complete guide for buyers',
      sections: [
        'Searching for textbooks',
        'Contacting sellers',
        'Negotiating prices',
        'Arranging meetups',
        'Completing transactions'
      ]
    },
    {
      id: 3,
      title: 'How to Sell Textbooks',
      icon: '💰',
      description: 'Tips for successful selling',
      sections: [
        'Taking good photos',
        'Writing descriptions',
        'Pricing your books',
        'Responding to buyers',
        'Safe meetup practices'
      ]
    },
    {
      id: 4,
      title: 'Safety Guidelines',
      icon: '🛡️',
      description: 'Stay safe while trading',
      sections: [
        'Meeting in public places',
        'Verifying UTM identity',
        'Avoiding scams',
        'Reporting suspicious users',
        'Payment safety tips'
      ]
    },
    {
      id: 5,
      title: 'Using the AI Assistant',
      icon: '🤖',
      description: 'Get help from our AI',
      sections: [
        'Starting a conversation',
        'Finding textbooks',
        'Getting price recommendations',
        'Negotiation tips',
        'Understanding responses'
      ]
    },
    {
      id: 6,
      title: 'Account & Privacy',
      icon: '🔒',
      description: 'Manage your account',
      sections: [
        'Updating your profile',
        'Privacy settings',
        'Notification preferences',
        'Blocking users',
        'Deleting your account'
      ]
    }
  ];

  const renderGuideCard = (guide) => (
    <TouchableOpacity
      key={guide.id}
      style={styles.guideCard}
      onPress={() => {
        // Navigate to detailed guide (can be implemented later)
        navigation.navigate('FAQDetail', { 
          faqId: guide.id,
          title: guide.title 
        });
      }}
    >
      <View style={styles.guideHeader}>
        <Text style={styles.guideIcon}>{guide.icon}</Text>
        <View style={styles.guideInfo}>
          <Text style={styles.guideTitle}>{guide.title}</Text>
          <Text style={styles.guideDescription}>{guide.description}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      <View style={styles.sectionsContainer}>
        {guide.sections.map((section, index) => (
          <View key={index} style={styles.sectionItem}>
            <Text style={styles.sectionBullet}>•</Text>
            <Text style={styles.sectionText}>{section}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Guides & Tutorials</Text>
        <Text style={styles.subtitle}>
          Step-by-step guides to help you get the most out of ThriftIn
        </Text>
      </View>

      {guides.map(renderGuideCard)}

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Still need help?</Text>
        <Text style={styles.helpText}>
          Can't find what you're looking for? Contact our support team.
        </Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => navigation.navigate('ContactSupport')}
        >
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
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
    lineHeight: 20,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  guideIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 13,
    color: '#666666',
  },
  chevron: {
    fontSize: 24,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  sectionsContainer: {
    paddingLeft: 44,
  },
  sectionItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  sectionBullet: {
    fontSize: 14,
    color: '#B71C1C',
    marginRight: 8,
    fontWeight: 'bold',
  },
  sectionText: {
    fontSize: 13,
    color: '#333333',
    flex: 1,
  },
  helpSection: {
    backgroundColor: '#FFF5F5',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  spacer: {
    height: 32,
  },
});

export default GuidesScreen;