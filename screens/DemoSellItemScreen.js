// screens/DemoSellItemScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DemoSellItemScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Brand New');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const conditions = ['Brand New', 'Like New', 'Good', 'Fair', 'Poor'];

  const handlePublishListing = () => {
    if (!title || !category || !price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Success! ✓',
      'Your item has been listed successfully.',
      [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell an Item</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos <Text style={styles.required}>* (Max 5)</Text></Text>
          <TouchableOpacity style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={40} color="#999" />
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Engineering Mathematics Textbook"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Select category"
            value={category}
            onChangeText={setCategory}
            placeholderTextColor="#999"
          />
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition <Text style={styles.required}>*</Text></Text>
          <View style={styles.conditionContainer}>
            {conditions.map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.conditionButton,
                  condition === cond && styles.conditionButtonActive
                ]}
                onPress={() => setCondition(cond)}
              >
                <Text style={[
                  styles.conditionText,
                  condition === cond && styles.conditionTextActive
                ]}>
                  {cond}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price (RM) <Text style={styles.required}>*</Text></Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>RM</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item, its condition, and any other relevant details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        {/* Meetup Locations */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Meetup Locations</Text>
          <Text style={styles.infoBoxSubtitle}>Suggest safe locations on campus for meetups</Text>
          <View style={styles.locationList}>
            <Text style={styles.locationItem}>• N28 Cafeteria</Text>
            <Text style={styles.locationItem}>• Library (Main Entrance)</Text>
            <Text style={styles.locationItem}>• Engineering Faculty</Text>
            <Text style={styles.locationItem}>• Student Center</Text>
          </View>
        </View>

        {/* Guidelines */}
        <View style={[styles.infoBox, { backgroundColor: '#FFF4E6' }]}>
          <Text style={styles.guidelineTitle}>Listing Guidelines</Text>
          <View style={styles.guidelineList}>
            <Text style={styles.guidelineItem}>• Be honest about item condition</Text>
            <Text style={styles.guidelineItem}>• Use clear, well-lit photos</Text>
            <Text style={styles.guidelineItem}>• Price items fairly</Text>
            <Text style={styles.guidelineItem}>• Respond to inquiries promptly</Text>
            <Text style={styles.guidelineItem}>• Only sell items you legally own</Text>
          </View>
        </View>

        {/* Publish Button */}
        <TouchableOpacity 
          style={styles.publishButton}
          onPress={handlePublishListing}
        >
          <Text style={styles.publishButtonText}>Publish Listing</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: '#A94442',
  },
  uploadBox: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  conditionButtonActive: {
    backgroundColor: '#A94442',
    borderColor: '#A94442',
  },
  conditionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  conditionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoBoxSubtitle: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 12,
  },
  locationList: {
    gap: 6,
  },
  locationItem: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
  guidelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },
  guidelineList: {
    gap: 6,
  },
  guidelineItem: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
  },
  publishButton: {
    marginTop: 32,
    backgroundColor: '#A94442',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#A94442',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});