import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons'; // Use Ionicons or similar

const screenWidth = Dimensions.get('window').width;

const AdminHomeScreen = ({ navigation }) => {

    const handleLogout = () => {
        // Navigate back to RoleSelection or equivalent
        navigation.reset({
            index: 0,
            routes: [{ name: 'RoleSelection' }],
        });
    };

    const navigateToTab = (screenName) => {
        navigation.navigate('AdminTabs', { screen: screenName });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ThriftIn UTM</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Icon name="person-circle-outline" size={30} color="#c70000" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.welcomeText}>Admin Dashboard</Text>

                <View style={styles.gridContainer}>
                    {/* Sales Dashboard */}
                    <TouchableOpacity style={styles.card} onPress={() => navigateToTab('SalesDashboard')}>
                        <Icon name="stats-chart" size={40} color="#c70000" />
                        <Text style={styles.cardText}>Sales Dashboard</Text>
                    </TouchableOpacity>

                    {/* User Activity */}
                    <TouchableOpacity style={styles.card} onPress={() => navigateToTab('UserActivity')}>
                        <Icon name="people" size={40} color="#c70000" />
                        <Text style={styles.cardText}>User Activity</Text>
                    </TouchableOpacity>

                    {/* Admin Panel */}
                    <TouchableOpacity style={styles.card} onPress={() => navigateToTab('AdminPanel')}>
                        <Icon name="settings" size={40} color="#c70000" />
                        <Text style={styles.cardText}>Admin Panel</Text>
                    </TouchableOpacity>

                    {/* Chat */}
                    <TouchableOpacity style={styles.card} onPress={() => navigateToTab('Chat')}>
                        <Icon name="chatbubbles" size={40} color="#c70000" />
                        <Text style={styles.cardText}>Chat</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#c70000',
    },
    logoutButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        textAlign: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        width: (screenWidth - 60) / 2, // 20 padding * 2 + 20 gap
        height: 140,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    cardText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
});

export default AdminHomeScreen;
