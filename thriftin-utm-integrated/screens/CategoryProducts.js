// CategoryProducts.js
import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import styles from './styles/styles';
import API_BASE from '../config';

export default function CategoryProducts({ route, navigation }) {
  const { userId, category } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: `${category} Products` });
  }, [navigation, category]);

  useEffect(() => {
    fetchCategoryProducts();
  }, []);

  const fetchCategoryProducts = async () => {
    try {
      const url = userId
        ? `${API_BASE}/api/sales/user/${userId}/category/${category}`
        : `${API_BASE}/api/sales/category/${category}`;
      const response = await axios.get(url);
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Category products fetch error:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#c70000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.dashboardContainer}>
      <Text style={styles.dashboardHeader}>{category} Products</Text>

      <Text style={{ fontWeight: 'bold', fontSize: 16, marginVertical: 10, textAlign: 'center', color: '#000' }}>
        Total Products: {products.length} | Total Revenue: RM {products.reduce((sum, p) => sum + parseFloat(p.revenue), 0).toFixed(2)}
      </Text>

      {products.length > 0 ? (
        products.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4, color: '#000' }}>Product: {item.name}</Text>
            <Text style={{ fontSize: 16, marginBottom: 4, color: '#000' }}>
              Amount: RM {parseFloat(item.revenue).toFixed(2)}
            </Text>
            <Text style={{ fontSize: 14, color: '#555' }}>
              Sold At: {item.sold_at ? (() => {
                const d = new Date(item.sold_at);
                return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              })() : 'N/A'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={{ color: '#800000', padding: 20 }}>No products sold in this category yet.</Text>
      )}
    </ScrollView>
  );
}