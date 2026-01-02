// src/screens/PaymentScreen.js - UPDATED TO USE WALLET
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal
} from 'react-native';
import { orderApi, walletApi } from '../api/productApi';
import { COLORS } from '../utils/constants';

const PaymentScreen = ({ route, navigation }) => {
  const { productId, checkoutData } = route.params;
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      console.log('💰 Fetching wallet balance...');
      const response = await walletApi.getBalance();
      console.log('✅ Wallet balance loaded:', response.data);
      setWalletBalance(response.data);
    } catch (error) {
      console.error('❌ Wallet balance error:', error);
      Alert.alert('Error', 'Failed to load wallet balance');
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    const orderAmount = parseFloat(checkoutData.total_amount);
    const currentBalance = parseFloat(walletBalance.balance);

    // Check sufficient balance
    if (currentBalance < orderAmount) {
      const shortage = orderAmount - currentBalance;
      Alert.alert(
        'Insufficient Balance',
        `You need RM ${shortage.toFixed(2)} more in your wallet.\n\nCurrent Balance: RM ${currentBalance.toFixed(2)}\nRequired: RM ${orderAmount.toFixed(2)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Top Up Wallet',
            onPress: () => navigation.navigate('TopUp')
          }
        ]
      );
      return;
    }

    // Confirm payment
    Alert.alert(
      'Confirm Payment',
      `Pay RM ${orderAmount.toFixed(2)} from your wallet?\n\nNew balance will be: RM ${(currentBalance - orderAmount).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: processWalletPayment
        }
      ]
    );
  };

  const processWalletPayment = async () => {
    setProcessing(true);

    try {
      // Simulate 2-second payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('💳 Processing wallet payment...');
      const response = await orderApi.processPayment(productId);
      console.log('✅ Payment successful:', response.data);

      // Navigate to success/receipt screen
      Alert.alert(
        '✅ Payment Successful!',
        `Order #${response.data.order_id} has been created successfully.\n\nAmount deducted from wallet: RM ${parseFloat(checkoutData.total_amount).toFixed(2)}`,
        [
          {
            text: 'View Receipt',
            onPress: () => {
              // Reset navigation stack and go to receipt
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'Main' },
                  {
                    name: 'OrderReceipt',
                    params: { orderId: response.data.order_id }
                  }
                ],
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Payment error:', error);
      
      if (error.message.includes('Insufficient wallet balance')) {
        Alert.alert(
          'Insufficient Balance',
          'Your wallet balance is not enough for this purchase. Please top up your wallet.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Top Up',
              onPress: () => navigation.navigate('TopUp')
            }
          ]
        );
      } else if (error.message === 'Product is no longer available') {
        Alert.alert(
          'Product Unavailable',
          'This product was just purchased by another buyer.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          error.message || 'Unable to process payment. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading payment...</Text>
      </View>
    );
  }

  if (!walletBalance) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load wallet</Text>
      </View>
    );
  }

  const orderAmount = parseFloat(checkoutData.total_amount);
  const currentBalance = parseFloat(walletBalance.balance);
  const hasSufficientBalance = currentBalance >= orderAmount;
  const shortage = hasSufficientBalance ? 0 : orderAmount - currentBalance;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>My Wallet</Text>
            <TouchableOpacity
              style={styles.topUpLink}
              onPress={() => navigation.navigate('TopUp')}
            >
              <Text style={styles.topUpLinkText}>💰 Top Up</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.walletBalance}>
            RM {currentBalance.toFixed(2)}
          </Text>
          <View style={[
            styles.balanceStatusBadge,
            { backgroundColor: hasSufficientBalance ? COLORS.success + '20' : COLORS.error + '20' }
          ]}>
            <Text style={[
              styles.balanceStatusText,
              { color: hasSufficientBalance ? COLORS.success : COLORS.error }
            ]}>
              {hasSufficientBalance ? '✓ Sufficient Balance' : '✕ Insufficient Balance'}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Price</Text>
              <Text style={styles.summaryValue}>RM {orderAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>RM {orderAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Balance</Text>
              <Text style={styles.summaryValue}>RM {currentBalance.toFixed(2)}</Text>
            </View>
            {hasSufficientBalance ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Balance After Payment</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  RM {(currentBalance - orderAmount).toFixed(2)}
                </Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shortage</Text>
                <Text style={[styles.summaryValue, { color: COLORS.error }]}>
                  RM {shortage.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.productCard}>
            <Text style={styles.productName}>{checkoutData.product.name}</Text>
            <Text style={styles.productCategory}>{checkoutData.product.category}</Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{checkoutData.product.condition}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💳</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Paying with Wallet</Text>
            <Text style={styles.infoText}>
              Amount will be deducted from your ThriftIn Wallet balance.
            </Text>
          </View>
        </View>

        {/* Insufficient Balance Warning */}
        {!hasSufficientBalance && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Insufficient Balance</Text>
              <Text style={styles.warningText}>
                You need to top up RM {shortage.toFixed(2)} more to complete this purchase.
              </Text>
            </View>
          </View>
        )}

        {/* Mock Payment Note */}
        <View style={styles.mockNote}>
          <Text style={styles.mockNoteText}>
            🧪 <Text style={styles.mockNoteBold}>Demo Mode:</Text> This is a simulated payment.
            No real money will be transferred.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {hasSufficientBalance ? (
          <TouchableOpacity
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handlePayWithWallet}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay RM {orderAmount.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.topUpButton}
            onPress={() => navigation.navigate('TopUp')}
          >
            <Text style={styles.topUpButtonText}>
              💰 Top Up RM {shortage.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Processing Modal */}
      <Modal visible={processing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.modalText}>Processing Payment...</Text>
            <Text style={styles.modalSubtext}>Please wait</Text>
          </View>
        </View>
      </Modal>
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
  walletCard: {
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletLabel: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  topUpLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topUpLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  walletBalance: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  balanceStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
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
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
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
  productCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.error + '10',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  mockNote: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mockNoteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  mockNoteBold: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  topUpButton: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  topUpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  modalSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default PaymentScreen;