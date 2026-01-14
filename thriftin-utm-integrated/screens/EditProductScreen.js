// src/screens/EditProductScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { productApi } from '../api/productApi';
import { COLORS, PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, API_BASE_URL } from '../utils/constants';

const EditProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price.toString(),
    condition: product.condition,
  });
  const [newImages, setNewImages] = useState([]);
  const [keepExistingImages, setKeepExistingImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const existingImages = product.images || [];

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const images = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || `photo-${Date.now()}.jpg`,
      }));
      setNewImages(images);
      setKeepExistingImages(false); // Replace existing images
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // If new images selected, update with images, otherwise just update data
      if (newImages.length > 0) {
        await productApi.updateProduct(product.product_id, formData, newImages);
      } else {
        await productApi.updateProduct(product.product_id, formData, null);
      }
      
      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Product Name */}
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="e.g., Introduction to Algorithms"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            style={styles.picker}
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
            ))}
          </Picker>
        </View>

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Describe your product..."
          multiline
          numberOfLines={4}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        {/* Price */}
        <Text style={styles.label}>Price (RM) *</Text>
        <TextInput
          style={[styles.input, errors.price && styles.inputError]}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

        {/* Condition */}
        <Text style={styles.label}>Condition *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.condition}
            onValueChange={(value) => setFormData({ ...formData, condition: value })}
            style={styles.picker}
          >
            {PRODUCT_CONDITIONS.map((cond) => (
              <Picker.Item key={cond.value} label={cond.label} value={cond.value} />
            ))}
          </Picker>
        </View>

        {/* Current Images */}
        {keepExistingImages && existingImages.length > 0 && (
          <>
            <Text style={styles.label}>Current Images</Text>
            <ScrollView horizontal style={styles.imagePreview}>
              {existingImages.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: `${API_BASE_URL.replace('/api', '')}${img.image_url}` }}
                  style={styles.image}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Replace Images */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
          <Text style={styles.imagePickerText}>
            {newImages.length > 0 
              ? `${newImages.length} new image(s) selected` 
              : 'Replace Images (Optional)'}
          </Text>
        </TouchableOpacity>

        {/* New Image Preview */}
        {newImages.length > 0 && (
          <>
            <Text style={styles.label}>New Images</Text>
            <ScrollView horizontal style={styles.imagePreview}>
              {newImages.map((img, index) => (
                <Image key={index} source={{ uri: img.uri }} style={styles.image} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Update Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Update Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  imagePicker: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  imagePickerText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    marginTop: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
});

export default EditProductScreen;