// src/screens/OrderReceiptScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Share, Linking, Image
} from 'react-native';
import { orderApi } from '../api/productApi';
import { COLORS, API_BASE_URL } from '../utils/constants';

const OrderReceiptScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrderReceipt();
  }, [orderId]);

  const fetchOrderReceipt = async () => {
    try {
      console.log('📄 Fetching receipt for order:', orderId);
      const response = await orderApi.getOrderReceipt(orderId);
      console.log('✅ Receipt loaded:', response.data);
      setOrder(response.data);
    } catch (error) {
      console.error('❌ Receipt error:', error);
      Alert.alert('Error', 'Failed to load order receipt', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order.can_cancel) {
      Alert.alert(
        'Cannot Cancel',
        'Cancellation period has expired (24 hours)',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Order?',
      'Are you sure you want to cancel this order? The item will be returned to the marketplace.',
      [
        { text: 'No, Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: confirmCancelOrder
        }
      ]
    );
  };

  const confirmCancelOrder = async () => {
    setCancelling(true);
    try {
      console.log('🚫 Cancelling order:', orderId);
      await orderApi.cancelOrder(orderId);
      Alert.alert(
        'Order Cancelled',
        'Your order has been cancelled successfully. The item is now available in the marketplace.',
        [{ text: 'OK', onPress: fetchOrderReceipt }]
      );
    } catch (error) {
      console.error('❌ Cancel error:', error);
      Alert.alert('Error', error.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleContactSeller = () => {
    if (!order) return;

    const subject = encodeURIComponent(`Order #${order.order_id} - ${order.product_name}`);
    const body = encodeURIComponent(
      `Hi ${order.seller_name},\n\nI've purchased your item "${order.product_name}" (Order #${order.order_id}).\n\nPlease let me know about pickup/delivery arrangements.\n\nThank you!`
    );

    Linking.openURL(`mailto:${order.seller_email}?subject=${subject}&body=${body}`);
  };

  const handleShareReceipt = async () => {
    if (!order) return;

    const receiptText = `
Order Receipt - ThriftIn UTM
━━━━━━━━━━━━━━━━━━━━━━━━━
Order #${order.order_id}
Status: ${order.order_status}

Product: ${order.product_name}
Price: RM ${parseFloat(order.product_price).toFixed(2)}

Seller: ${order.seller_name}
Email: ${order.seller_email}

Payment: ${order.payment_method}
Date: ${new Date(order.order_date).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    try {
      await Share.share({ message: receiptText });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Receipt not found</Text>
      </View>
    );
  }

  const orderDate = new Date(order.order_date);
  const formattedDate = orderDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusStyle = order.order_status === 'completed'
    ? { backgroundColor: COLORS.success + '20', color: COLORS.success }
    : { backgroundColor: COLORS.error + '20', color: COLORS.error };

  const primaryImage = order.product_images && order.product_images.length > 0
    ? order.product_images[0]
    : null;
  
  const imageUrl = primaryImage
    ? `${API_BASE_URL.replace('/api', '')}${primaryImage.image_url}`
    : 'https://via.placeholder.com/400';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.receiptTitle}>Order Receipt</Text>
          <Text style={styles.orderId}>Order #{order.order_id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {order.order_status === 'completed' ? '✓ Completed' : '✕ Cancelled'}
            </Text>
          </View>
        </View>

        {/* Product Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.productCard}>
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{order.product_name}</Text>
              <Text style={styles.productCategory}>{order.product_category}</Text>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{order.product_condition}</Text>
              </View>
              {order.product_description && (
                <Text style={styles.productDescription} numberOfLines={3}>
                  {order.product_description}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Date</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Time</Text>
              <Text style={styles.infoValue}>{formattedTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>
                {order.payment_method === 'wallet' ? '💰 Wallet' :
                order.payment_method === 'credit_card' ? '💳 Credit/Debit Card' :
                order.payment_method === 'e_wallet' ? '📱 E-Wallet' :
                '🏦 Online Banking'}
              </Text>
            </View>
            {order.cancelled_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cancelled At</Text>
                <Text style={[styles.infoValue, { color: COLORS.error }]}>
                  {new Date(order.cancelled_at).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Seller Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {order.seller_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{order.seller_name}</Text>
              <Text style={styles.sellerEmail}>{order.seller_email}</Text>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactSeller}
            >
              <Text style={styles.contactButtonText}>📧</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Price</Text>
              <Text style={styles.summaryValue}>
                RM {parseFloat(order.product_price).toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>
                RM {parseFloat(order.total_amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        {order.order_status === 'completed' && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📦 Next Steps</Text>
            <Text style={styles.instructionsText}>
              1. Contact the seller using the button above to arrange pickup/delivery{'\n'}
              2. Meet at a safe location on campus{'\n'}
              3. Inspect the item before finalizing the exchange
            </Text>
          </View>
        )}

        {order.order_status === 'cancelled' && (
          <View style={styles.cancelledCard}>
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledText}>
              This order has been cancelled. The item has been returned to the marketplace 
              and is now available for other buyers.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareReceipt}
        >
          <Text style={styles.shareButtonText}>📤 Share Receipt</Text>
        </TouchableOpacity>

        {order.order_status === 'completed' && order.can_cancel && (
          <TouchableOpacity
            style={[styles.cancelOrderButton, cancelling && styles.cancelOrderButtonDisabled]}
            onPress={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color={COLORS.error} />
            ) : (
              <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
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
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: 18,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  orderId: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.background,
  },
  productDetails: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
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
    fontSize: 20,
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
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  instructionsCard: {
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  cancelledCard: {
    backgroundColor: COLORS.error + '10',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 8,
  },
  cancelledText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  cancelOrderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  cancelOrderButtonDisabled: {
    opacity: 0.5,
  },
  cancelOrderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});

export default OrderReceiptScreen;