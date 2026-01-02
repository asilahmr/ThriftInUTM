// src/screens/MyWalletScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { walletApi } from '../api/productApi';
import { COLORS } from '../utils/constants';

const MyWalletScreen = ({ navigation }) => {
  const [walletSummary, setWalletSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [])
  );

  const fetchWalletData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      console.log('💰 Fetching wallet data...');
      
      // Fetch wallet summary and transactions
      const [summaryResponse, transactionsResponse] = await Promise.all([
        walletApi.getSummary(),
        walletApi.getTransactions(20, 0)
      ]);
      
      console.log('✅ Wallet data loaded');
      setWalletSummary(summaryResponse.data);
      setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error('❌ Fetch wallet error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWalletData(false);
  };

  const handleTopUp = () => {
    navigation.navigate('TopUp');
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'top_up': return '💰';
      case 'purchase': return '🛒';
      case 'refund': return '↩️';
      default: return '💳';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'top_up': return COLORS.success;
      case 'refund': return COLORS.success;
      case 'purchase': return COLORS.error;
      default: return COLORS.text;
    }
  };

  const renderTransaction = ({ item }) => {
    const date = new Date(item.transaction_date);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const isPositive = item.transaction_type === 'top_up' || item.transaction_type === 'refund';
    const amountColor = getTransactionColor(item.transaction_type);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionIconText}>
            {getTransactionIcon(item.transaction_type)}
          </Text>
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>
            {item.transaction_type === 'top_up' ? 'Top Up' :
             item.transaction_type === 'purchase' ? 'Purchase' : 'Refund'}
          </Text>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description || item.product_name || 'Transaction'}
          </Text>
          <Text style={styles.transactionDate}>{formattedDate} at {formattedTime}</Text>
        </View>

        <View style={styles.transactionAmount}>
          <Text style={[styles.transactionAmountText, { color: amountColor }]}>
            {isPositive ? '+' : '-'} RM {parseFloat(item.amount).toFixed(2)}
          </Text>
          <Text style={styles.balanceAfter}>
            Balance: RM {parseFloat(item.balance_after).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  if (!walletSummary) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load wallet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceAmount}>
            RM {parseFloat(walletSummary.balance).toFixed(2)}
          </Text>
          
          <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
            <Text style={styles.topUpButtonText}>💰 Top Up</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💸</Text>
            <Text style={styles.statValue}>
              RM {parseFloat(walletSummary.statistics.total_topped_up).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Topped Up</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🛒</Text>
            <Text style={styles.statValue}>
              RM {parseFloat(walletSummary.statistics.total_spent).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Top up your wallet to start shopping!
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.transaction_id.toString()}
              renderItem={renderTransaction}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
  balanceCard: {
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  topUpButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  topUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceAfter: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default MyWalletScreen;