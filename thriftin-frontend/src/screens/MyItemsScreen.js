// src/screens/MyItemsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { productApi } from '../api/productApi';
import ProductCard from '../components/ProductCard';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { COLORS } from '../utils/constants';

const MyItemsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    product: null,
    loading: false,
  });

  const fetchProducts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      console.log('📥 Fetching products...');
      const response = await productApi.getMyProducts();
      console.log('✅ API Response:', response);
      console.log('Products data:', response.data);
      console.log('Products count:', response.data?.length);
      setProducts(response.data || []);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(false);
  };

  const handleEdit = (product) => {
    navigation.navigate('EditProduct', { product });
  };

  const handleDeletePress = (product) => {
    setDeleteModal({
      visible: true,
      product,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    setDeleteModal({ ...deleteModal, loading: true });
    try {
      await productApi.deleteProduct(deleteModal.product.product_id);
      Alert.alert('Success', 'Product deleted successfully');
      setDeleteModal({ visible: false, product: null, loading: false });
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', error.message);
      setDeleteModal({ ...deleteModal, loading: false });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ visible: false, product: null, loading: false });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No products listed yet</Text>
      <Text style={styles.emptySubtext}>
        Start selling by adding your first product!
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Text style={styles.addButtonText}>+ Add Product</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onEdit={handleEdit}
            onDelete={handleDeletePress}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* Floating Add Button */}
      {products.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteModal.visible}
        productName={deleteModal.product?.name}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteModal.loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default MyItemsScreen;