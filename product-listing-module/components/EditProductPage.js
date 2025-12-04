import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function EditProductPage({ product, onUpdateProduct, onCancel }) {
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price.toString(),
    condition: product.condition,
  });

  const [imageUrls, setImageUrls] = useState(product.images);
  const [imageInput, setImageInput] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const categories = ['Books', 'Electronics', 'Fashion', 'Furniture', 'Others'];
  const conditions = ['Like New', 'Excellent', 'Good', 'Fair', 'Poor'];

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // ⭐ Add Image Picker Handler (same as AddProductPage)
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setImageUrls([...imageUrls, selectedUri]);
    }
  };

  const handleRemoveImage = (index) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    } else {
      Alert.alert('Cannot Remove', 'At least one image is required');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return false;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Valid price is required');
      return false;
    }

    if (imageUrls.length === 0) {
      Alert.alert('Validation Error', 'At least one product image is required');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onUpdateProduct({
        ...product,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        images: imageUrls,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Product</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>

        {/* Product Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Product Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Product name..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={styles.pickerText}>{formData.category}</Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>

          {showCategoryPicker && (
            <View style={styles.pickerOptions}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.pickerOption}
                  onPress={() => {
                    handleChange('category', cat);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.category === cat && styles.pickerOptionTextActive
                  ]}>
                    {cat}
                  </Text>
                  {formData.category === cat && (
                    <Ionicons name="checkmark" size={20} color="#A30F0F" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Condition */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Condition <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowConditionPicker(!showConditionPicker)}
          >
            <Text style={styles.pickerText}>{formData.condition}</Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>

          {showConditionPicker && (
            <View style={styles.pickerOptions}>
              {conditions.map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={styles.pickerOption}
                  onPress={() => {
                    handleChange('condition', cond);
                    setShowConditionPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.condition === cond && styles.pickerOptionTextActive
                  ]}>
                    {cond}
                  </Text>
                  {formData.condition === cond && (
                    <Ionicons name="checkmark" size={20} color="#A30F0F" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Price (RM) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={formData.price}
            onChangeText={(value) => handleChange('price', value)}
            keyboardType="decimal-pad"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your product..."
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Product Images */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Product Images <Text style={styles.required}>*</Text>
          </Text>

          {/* ⭐ Image Picker Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handlePickImage}>
            <Text style={styles.submitButtonText}>Add Image</Text>
          </TouchableOpacity>

          {/* URL Image Input */}
          {/*
          <View style={styles.imageInputContainer}>
            <TextInput
              style={styles.imageInput}
              placeholder="Paste image URL"
              value={imageInput}
              onChangeText={setImageInput}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.addImageText}>Add</Text>
            </TouchableOpacity>
          </View>
          */}

          {imageUrls.length > 0 && (
            <View style={styles.imageGrid}>
              {imageUrls.map((url, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: url }} style={styles.previewImage} />
                  {imageUrls.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Update Product</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#A30F0F',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 15,
    color: '#1f2937',
  },
  pickerOptions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#1f2937',
  },
  pickerOptionTextActive: {
    color: '#A30F0F',
    fontWeight: '600',
  },
  imageInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  imageInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  addImageButton: {
    backgroundColor: '#A30F0F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addImageText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  imagePreview: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#A30F0F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
