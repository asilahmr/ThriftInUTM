import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MyProductsPage({ products, onEdit, onDelete }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteClick = (productId) => {
    setDeleteConfirm(productId);
  };

  const handleConfirmDelete = (productId) => {
    onDelete(productId);
    setDeleteConfirm(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Product Listings</Text>
        <Text style={styles.subtitle}>
          {products.length} {products.length === 1 ? 'item' : 'items'} listed
        </Text>
      </View>

      {/* Products List */}
      <ScrollView style={styles.productList} contentContainerStyle={styles.productListContent}>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No products listed yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add" to create your first listing</Text>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productContent}>
                {/* Product Image */}
                <Image
                  source={{ uri: product.images[0] }}
                  style={styles.productImage}
                  resizeMode="cover"
                />

                {/* Product Info */}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.badgeContainer}>
                    <View style={styles.conditionBadge}>
                      <Text style={styles.conditionText}>{product.condition}</Text>
                    </View>
                    <Text style={styles.category}>{product.category}</Text>
                  </View>
                  <Text style={styles.price}>RM {product.price}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => onEdit(product)}
                >
                  <Ionicons name="create-outline" size={18} color="#A30F0F" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.buttonDivider} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteClick(product.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Product?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this product? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteConfirm(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={() => handleConfirmDelete(deleteConfirm)}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  productList: {
    flex: 1,
  },
  productListContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  conditionText: {
    fontSize: 11,
    color: '#A30F0F',
    fontWeight: '500',
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A30F0F',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  editButtonText: {
    color: '#A30F0F',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
