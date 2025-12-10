// src/components/ProductCard.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, API_BASE_URL } from '../utils/constants';

const ProductCard = ({ product, onEdit, onDelete }) => {
  const primaryImage = product.images && product.images.length > 0 
    ? product.images.find(img => img.is_primary) || product.images[0]
    : null;

  const imageUrl = primaryImage 
    ? `${API_BASE_URL.replace('/api', '')}${primaryImage.image_url}`
    : 'https://via.placeholder.com/150';

  return (
    <View style={styles.card}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.condition}>Condition: {product.condition}</Text>
        <Text style={styles.price}>RM {parseFloat(product.price).toFixed(2)}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.editButton]} 
            onPress={() => onEdit(product)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.deleteButton]} 
            onPress={() => onDelete(product)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  condition: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductCard;