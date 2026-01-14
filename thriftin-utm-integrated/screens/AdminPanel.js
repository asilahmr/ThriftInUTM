import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdminPanel = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Admin Panel</Text>
            <Text style={styles.subText}>This is a dummy page.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
});

export default AdminPanel;