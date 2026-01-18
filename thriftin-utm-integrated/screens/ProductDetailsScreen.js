// src/screens/ProductDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, Linking
} from 'react-native';
import { marketplaceApi } from '../api/productApi';
import { COLORS, API_BASE_URL } from '../utils/constants';

const { width } = Dimensions.get('window');

const ProductImage = ({ uri }) => {
  const [error, setError] = useState(false);
  const source = (!error && uri) ? { uri } : { uri: 'https://via.placeholder.com/400' };

  return (
    <Image
      source={source}
      style={styles.image}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
};

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      console.log('📥 Fetching product details:', productId);
      const response = await marketplaceApi.getProductDetails(productId);
      console.log('✅ Product loaded:', response.data);
      setProduct(response.data.data);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!product?.seller) return;

    Alert.alert(
      'Contact Seller',
      `Send email to ${product.seller.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: () => {
            const subject = encodeURIComponent(`Interested in: ${product.name}`);
            const body = encodeURIComponent(
              `Hi ${product.seller.name},\n\nI'm interested in your product "${product.name}" listed on ThriftIn UTM.\n\nPlease let me know if it's still available.\n\nThank you!`
            );
            Linking.openURL(`mailto:${product.seller.email}?subject=${subject}&body=${body}`);
          }
        }
      ]
    );
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (product.status !== 'active') {
      Alert.alert('Unavailable', 'This product is no longer available for purchase.');
      return;
    }

    const firstImage = product.images && product.images.length > 0
      ? product.images[0].image_url
      : null;

    console.log('🛒 Navigating to checkout for product:', productId);

    navigation.navigate('Checkout', {
      productId: product.product_id,
      productImage: firstImage
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const images = product.images || [];
  const currentImage = images[currentImageIndex];
  const imageUrl = currentImage
    ? `${API_BASE_URL.replace('/api', '')}${currentImage.image_url}`
    : 'https://via.placeholder.com/400';

  const isAvailable = product.status === 'active';

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.length > 0 ? (
              images.map((img, index) => (
                <ProductImage
                  key={index}
                  uri={`${API_BASE_URL.replace('/api', '')}${img.image_url}`}
                  index={index}
                />
              ))
            ) : (
              <Image
                source={{ uri: 'https://via.placeholder.com/400' }}
                style={styles.image}
              />
            )}
          </ScrollView>

          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive
                  ]}
                />
              ))}
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* NEW: Status Badge (if sold) */}
          {!isAvailable && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>SOLD</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.category}>{product.category}</Text>
            </View>
            <Text style={styles.price}>RM {parseFloat(product.price).toFixed(2)}</Text>
          </View>

          {/* Condition Badge */}
          <View style={styles.conditionContainer}>
            <View style={[styles.conditionBadge, getConditionColor(product.condition)]}>
              <Text style={styles.conditionText}>{product.condition}</Text>
            </View>
            {product.view_count > 0 && (
              <Text style={styles.viewCount}>👁️ {product.view_count} views</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {product.seller?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{product.seller?.name}</Text>
                <Text style={styles.sellerEmail}>{product.seller?.email}</Text>
              </View>
            </View>
          </View>

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition:</Text>
              <Text style={styles.detailValue}>{product.condition}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Posted:</Text>
              <Text style={styles.detailValue}>
                {new Date(product.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[
                styles.detailValue,
                { color: isAvailable ? COLORS.success : COLORS.error }
              ]}>
                {isAvailable ? 'Available' : 'Sold'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* UPDATED: Footer with Buy Now and Contact Buttons */}
      <View style={styles.footer}>
        {/* Show Buy Now button only if product is available */}
        {isAvailable ? (
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.contactButtonSmall}
              onPress={handleContactSeller}
            >
              <Text style={styles.contactButtonSmallText}>📧 Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buyNowButton}
              onPress={handleBuyNow}
            >
              <Text style={styles.buyNowButtonText}>🛒 Buy Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // If sold, only show contact button
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSeller}
          >
            <Text style={styles.contactButtonText}>📧 Contact Seller</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const getConditionColor = (condition) => {
  const colors = {
    'Like New': { backgroundColor: COLORS.success + '20', borderColor: COLORS.success },
    'Excellent': { backgroundColor: '#4CAF50' + '20', borderColor: '#4CAF50' },
    'Good': { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
    'Fair': { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent },
    'Poor': { backgroundColor: COLORS.error + '20', borderColor: COLORS.error },
  };
  return colors[condition] || colors['Good'];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  errorText: {
    fontSize: 18,
    color: COLORS.error,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 400,
    backgroundColor: COLORS.background,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },

  soldBadge: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  soldBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  sellerEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButtonSmall: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactButtonSmallText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buyNowButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyNowButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  contactButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductDetailsScreen;