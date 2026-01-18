import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Linking, Image
} from 'react-native';
import { COLORS, API_BASE_URL } from '../utils/constants';
import api from '../utils/api';

const SoldItemScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSaleDetails();
    }, [orderId]);

    const fetchSaleDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/sales/sold/${orderId}`);
            setSale(response.data);
        } catch (error) {
            console.error('Fetch sale details error:', error);
            Alert.alert('Error', 'Failed to load sale details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleEmailBuyer = () => {
        if (!sale) return;
        const subject = encodeURIComponent(`Regarding your purchase: ${sale.product_name}`);
        const body = encodeURIComponent(
            `Hi ${sale.buyer_name},\n\nI'm contacting you about your order #${sale.order_id}.\n\n`
        );
        Linking.openURL(`mailto:${sale.buyer_email}?subject=${subject}&body=${body}`);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!sale) return null;

    const orderDate = new Date(sale.order_date);
    const formattedDate = orderDate.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const imageUrl = sale.product_image
        ? `${API_BASE_URL.replace('/api', '')}${sale.product_image}`
        : 'https://via.placeholder.com/400';

    return (
        <View style={styles.container}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={[styles.headerRow, { justifyContent: 'center' }]}>
                    <Text style={[styles.orderId, { marginRight: 10 }]}>Sold Item #{sale.sales_rank}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>✓ Sold</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Product Section */}
                <View style={styles.section}>
                    <View style={styles.card}>
                        <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        <View style={styles.productDetails}>
                            <Text style={styles.productName}>{sale.product_name}</Text>
                            <Text style={styles.productCategory}>{sale.product_category}</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Sold Price:</Text>
                                <Text style={styles.priceValue}>RM {parseFloat(sale.product_price).toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Transaction Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction Details</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Sale Date</Text>
                            <Text style={styles.infoValue}>{formattedDate}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.totalLabel}>Total Earnings</Text>
                            <Text style={styles.totalValue}>RM {parseFloat(sale.product_price).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Buyer Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Buyer Information</Text>
                    <View style={styles.buyerCard}>
                        <View style={styles.buyerAvatar}>
                            <Text style={styles.avatarText}>{sale.buyer_name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.buyerInfo}>
                            <Text style={styles.buyerName}>{sale.buyer_name}</Text>
                            <Text style={styles.buyerEmail}>{sale.buyer_email}</Text>
                        </View>
                        <TouchableOpacity style={styles.contactButton} onPress={handleEmailBuyer}>
                            <Text style={styles.contactIcon}>✉️</Text>
                        </TouchableOpacity>
                    </View>
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
    },
    content: {
        flex: 1,
    },
    headerCard: {
        backgroundColor: '#fff',
        margin: 20,
        marginBottom: 0,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 14,
    },
    orderId: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: COLORS.text,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    productImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#f0f0f0',
    },
    productDetails: {
        padding: 16,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: COLORS.text,
    },
    productCategory: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginRight: 8,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    buyerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    buyerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    buyerInfo: {
        flex: 1,
    },
    buyerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    buyerEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    buyerMatric: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    contactButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactIcon: {
        fontSize: 20,
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    infoValue: {
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
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
});

export default SoldItemScreen;
