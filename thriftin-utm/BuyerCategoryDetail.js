import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BuyerCategoryDetail = ({ route }) => {
  const { category, items: navItems } = route.params;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (Array.isArray(navItems)) {
      setItems(navItems);
    } else {
      setItems([]);
    }
    setLoading(false);
  }, [navItems]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c70000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        {category} Items
      </Text>

      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
        Total Products: {items.length} | Total Spending: RM {items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
      </Text>

      {items.length === 0 ? (
        <Text style={styles.noData}>No items found.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <Text style={styles.itemName}>Product: {item.name}</Text>
              <Text style={styles.itemAmount}>Amount: RM {item.amount.toFixed(2)}</Text>
              <Text style={styles.itemDate}>
                Bought At: {(() => {
                  const d = new Date(item.sold_at);
                  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                })()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default BuyerCategoryDetail;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  itemName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  itemAmount: { fontSize: 16, marginBottom: 4 },
  itemDate: { fontSize: 14, color: '#555' },
  noData: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#555' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
