import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../utils/api';
import { COLORS } from '../utils/constants';

export default function UserTransactions({ route, navigation }) {
    const { userId, userName, type, filter } = route.params; // type: 'sold' | 'bought'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: type === 'sold' ? 'Sold Items' : 'Purchased Items',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#c70000' },
        });
    }, [navigation, type]);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const endpoint = type === 'sold'
                ? `/api/sales/user/${userId}/items`
                : `/api/buying/user/${userId}/items`;

            // Pass filter params
            const params = {};
            if (filter) {
                if (filter.type) params.type = filter.type;
                if (filter.month) params.month = filter.month;
                if (filter.year) params.year = filter.year;
            }

            const response = await api.get(endpoint, { params });
            setItems(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch user transactions error:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#c70000" />
            </View>
        );
    }

    const totalValue = items.reduce((sum, item) => sum + parseFloat(item.price), 0);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>{userName}</Text>
                <Text style={styles.headerSubtitle}>
                    {type === 'sold' ? 'Items Sold' : 'Items Bought'} • {filter?.label || 'All Time'}
                </Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>Count: {items.length}</Text>
                    <Text style={styles.summaryText}>Total: RM {totalValue.toFixed(2)}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (item.order_id) {
                                    navigation.navigate('SoldItemScreen', { orderId: item.order_id });
                                }
                            }}
                        >
                            <View style={styles.cardRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{item.name}</Text>
                                    <Text style={styles.category}>{item.category}</Text>
                                    <Text style={styles.date}>
                                        {new Date(item.date).toLocaleDateString(undefined, {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.price}>RM {parseFloat(item.price).toFixed(2)}</Text>
                                    <Text style={styles.viewDetails}>View ›</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No items found for this period.</Text>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 8,
    },
    summaryText: {
        color: '#b71c1c',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    category: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        backgroundColor: '#f0f0f0',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#c70000',
        textAlign: 'right',
    },
    viewDetails: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        padding: 40,
        color: '#777',
    }
});
