// src/screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, ScrollView, Image, Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { marketplaceApi } from '../api/productApi';
import { COLORS, PRODUCT_CATEGORIES, API_BASE_URL } from '../utils/constants';
import TransactionGuard from '../components/TransactionGuard';

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      fetchRecommendations();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await marketplaceApi.getAllProducts();
      console.log('Products API Response:', JSON.stringify(response.data));
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await marketplaceApi.getRecommendations(5);
      setRecommendations(response.data.data || []);
    } catch {
      setRecommendations([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }
    setLoading(true);
    try {
      const response = await marketplaceApi.searchProducts(searchQuery);
      setProducts(response.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      if (category === 'All') {
        await fetchProducts();
      } else {
        const response = await marketplaceApi.getProductsByCategory(category);
        setProducts(response.data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    setSelectedCategory('All');
    fetchProducts();
    fetchRecommendations();
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', {
      productId: product.product_id
    });
  };

  /* =========================
     Product Card (PROTECTED)
     ========================= */
  const renderProductCard = ({ item }) => {
    const primaryImage =
      item.images?.find(img => img.is_primary) || item.images?.[0];

    const imageUrl = primaryImage
      ? `${API_BASE_URL.replace('/api', '')}${primaryImage.image_url}`
      : 'https://via.placeholder.com/150';

    return (
      <TransactionGuard
        action="VIEW_PRODUCT"
        onAllowed={() => handleProductPress(item)}
      >
        <TouchableOpacity style={styles.productCard} activeOpacity={0.7}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={styles.productPrice}>
              RM {parseFloat(item.price).toFixed(2)}
            </Text>
            <Text style={styles.productCondition}>{item.condition}</Text>
          </View>
        </TouchableOpacity>
      </TransactionGuard>
    );
  };

  /* =========================
     Recommendation Card
     ========================= */
  const renderRecommendationCard = ({ item }) => {
    const primaryImage =
      item.images?.find(img => img.is_primary) || item.images?.[0];

    const imageUrl = primaryImage
      ? `${API_BASE_URL.replace('/api', '')}${primaryImage.image_url}`
      : 'https://via.placeholder.com/150';

    return (
      <TransactionGuard
        action="VIEW_PRODUCT"
        onAllowed={() => handleProductPress(item)}
      >
        <TouchableOpacity style={styles.recommendationCard}>
          <Image source={{ uri: imageUrl }} style={styles.recommendationImage} />
          <View style={styles.recommendationInfo}>
            <Text style={styles.recommendationName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.recommendationPrice}>
              RM {parseFloat(item.price).toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>
      </TransactionGuard>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ThriftIn UTM</Text>
        <Text style={styles.headerSubtitle}>
          Find your perfect preloved items
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Category */}
      {/* Category */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'All' && styles.categoryChipActive
            ]}
            onPress={() => handleCategoryFilter('All')}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === 'All' && styles.categoryTextActive
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {PRODUCT_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                selectedCategory === cat.value && styles.categoryChipActive
              ]}
              onPress={() => handleCategoryFilter(cat.value)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.value && styles.categoryTextActive
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recommendations */}
      {recommendations.length > 0 && selectedCategory === 'All' && !searchQuery && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommended for You ✨</Text>
          <FlatList
            data={recommendations}
            renderItem={renderRecommendationCard}
            keyExtractor={item => `rec-${item.product_id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Products */}
      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={item => item.product_id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
};

const { width } = Dimensions.get('window');
const CARD_MARGIN = 6;
const CARD_WIDTH = (width / 2) - (CARD_MARGIN * 3);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  columnWrapper: {
    justifyContent: 'flex-start', // specific alignment
    paddingHorizontal: 6,
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
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  categoryContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTextActive: {
    color: '#FFF',
  },
  recommendationsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 16,
    marginBottom: 12,
  },
  recommendationsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  recommendationCard: {
    width: 140,
    height: 250, // Slightly increased height
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    marginLeft: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationImage: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.background,
    resizeMode: 'cover',
  },
  recommendationInfo: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recommendationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    width: CARD_WIDTH, // Fixed width based on screen
    height: 290, // Strict fixed height
    backgroundColor: COLORS.card,
    borderRadius: 12,
    margin: CARD_MARGIN,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.background,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between', // Distribute space evenly
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    height: 40,
  },
  productCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  productCondition: {
    fontSize: 12,
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
    textAlign: 'center',
  },
});

export default HomeScreen;