// src/screens/OrderHistoryScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderApi } from '../api/productApi';
import { COLORS, API_BASE_URL } from '../utils/constants';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrderHistory();
    }, [])
  );

  const fetchOrderHistory = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      console.log('📦 Fetching order history...');
      const response = await orderApi.getOrderHistory();
      console.log('✅ Orders loaded:', response.count);
      setOrders(response.data || []);
    } catch (error) {
      console.error('❌ Fetch orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrderHistory(false);
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderReceipt', { orderId: order.order_id });
  };

  const getStatusBadgeStyle = (status) => {
    if (status === 'completed') {
      return { backgroundColor: COLORS.success + '20', color: COLORS.success };
    } else if (status === 'cancelled') {
      return { backgroundColor: COLORS.error + '20', color: COLORS.error };
    }
    return { backgroundColor: COLORS.textSecondary + '20', color: COLORS.textSecondary };
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card': return '💳';
      case 'e_wallet': return '📱';
      case 'online_banking': return '🏦';
      default: return '💰';
    }
  };

  const renderOrderCard = ({ item }) => {
    const imageUrl = item.product_image
      ? `${API_BASE_URL.replace('/api', '')}${item.product_image}`
      : 'https://via.placeholder.com/100';

    const orderDate = new Date(item.order_date);
    const formattedDate = orderDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusStyle = getStatusBadgeStyle(item.order_status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Order #{item.order_id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {item.order_status === 'completed' ? 'Completed' : 'Cancelled'}
              </Text>
            </View>
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>

          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{formattedDate} at {formattedTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>{getPaymentMethodIcon(item.payment_method)}</Text>
              <Text style={styles.detailText}>
                {item.payment_method === 'credit_card' ? 'Card' :
                 item.payment_method === 'e_wallet' ? 'E-Wallet' : 'Banking'}
              </Text>
            </View>
          </View>

          <View style={styles.orderFooter}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalAmount}>RM {parseFloat(item.total_amount).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyText}>No orders yet</Text>
      <Text style={styles.emptySubtext}>
        Start shopping and your purchases will appear here
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Main', { screen: 'Home' })}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.order_id.toString()}
        renderItem={renderOrderCard}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
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
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  orderDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
    alignSelf: 'center',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderHistoryScreen;