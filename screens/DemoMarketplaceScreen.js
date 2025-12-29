// screens/DemoMarketplaceScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TransactionGuard from '../components/TransactionGuard';

export default function DemoMarketplaceScreen({ navigation }) {
  
  // demo buy product navigation
  const handleBuyProduct = () => {
    Alert.alert(
      'Purchase Successful! ✓',
      'Your purchase has been processed successfully.',
      [{ text: 'OK' }]
    );
  };

  // demo sell item navigation
  const handleSellItem = () => {
    navigation.navigate('DemoSellItem');
  };

  // Demo product data
  const demoProduct = {
    name: 'Scientific Calculator Casio',
    price: 65.00,
    condition: 'Good',
    seller: 'John Doe'
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A94442" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ThriftIn UTM</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.searchText}>Browse Items</Text>
          </View>
          
          {/* Sell Button - Protected */}
          <TransactionGuard onAllowed={handleSellItem}>
            <View style={styles.sellButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.sellButtonText}>Sell an Item</Text>
            </View>
          </TransactionGuard>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <TouchableOpacity style={[styles.categoryChip, styles.categoryChipActive]}>
            <Text style={styles.categoryTextActive}>All Items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryChip}>
            <Text style={styles.categoryText}>Books</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryChip}>
            <Text style={styles.categoryText}>Electronics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryChip}>
            <Text style={styles.categoryText}>Stationery</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Product Card */}
        <View style={styles.productCard}>
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="calculator" size={80} color="#A94442" />
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{demoProduct.name}</Text>
            <Text style={styles.productPrice}>RM {demoProduct.price.toFixed(2)}</Text>
            <Text style={styles.productCondition}>{demoProduct.condition}</Text>
            <Text style={styles.productDescription}>
              Casio FX-991ES Plus. Fully functional, with case.
            </Text>

            {/* Seller Info */}
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitial}>J</Text>
              </View>
              <View>
                <Text style={styles.sellerName}>{demoProduct.seller}</Text>
                <Text style={styles.sellerMatric}>A23CS8234</Text>
              </View>
            </View>

            {/* Buy Button - Protected */}
            <TransactionGuard onAllowed={handleBuyProduct}>
              <View style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Buy Now</Text>
              </View>
            </TransactionGuard>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            This is a demo marketplace. The "Buy Now" and "Sell an Item" buttons are protected by TransactionGuard.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#A94442',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#666',
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A94442',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#A94442',
    borderColor: '#A94442',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImagePlaceholder: {
    height: 200,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A94442',
    marginBottom: 8,
  },
  productCondition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A94442',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sellerMatric: {
    fontSize: 13,
    color: '#666',
  },
  buyButton: {
    backgroundColor: '#A94442',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});