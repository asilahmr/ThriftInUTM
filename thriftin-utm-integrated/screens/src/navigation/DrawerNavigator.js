import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { COLORS } from '../../../utils/constants';

// Screen Imports
import HomeScreen from '../../HomeScreen';
import AddProductScreen from '../../AddProductScreen';
import ProfileScreen from '../../ProfileScreen';
import MyWalletScreen from '../../MyWalletScreen';
import ChatListScreen from '../../chat/ChatListScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content to show User Profile summary
const CustomDrawerContent = (props) => {
    // Mock user data or get from logic/context if available
    // ideally we get this from props.navigation.getState() or similar, or Context
    // For now, we'll placeholder or try to read params if passed down, 
    // but usually global state is better. 
    // Let's use a nice header placeholder "Hello, Student!"
    return (
        <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
            <View style={styles.profileHeader}>
                <View style={styles.profileImageContainer}>
                    <Text style={styles.profileImageText}>👤</Text>
                </View>
                <Text style={styles.profileName}>Student Menu</Text>
                <Text style={styles.profileEmail}>Access your dashboard</Text>
            </View>

            <View style={styles.drawerItemsContainer}>
                <DrawerItemList {...props} />
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => props.navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })}
            >
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </DrawerContentScrollView>
    );
};

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            initialRouteName="Home"
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                drawerActiveTintColor: COLORS.primary,
                drawerInactiveTintColor: '#333',
                drawerLabelStyle: { marginLeft: -20, fontWeight: '500' },
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>
                }}
            />
            <Drawer.Screen
                name="Add Item"
                component={AddProductScreen}
                options={{
                    drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>
                }}
            />
            <Drawer.Screen
                name="Wallet"
                component={MyWalletScreen}
                options={{
                    drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text>
                }}
            />
            <Drawer.Screen
                name="Chat"
                component={ChatListScreen}
                options={{
                    drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text>
                }}
            />
            <Drawer.Screen
                name="My Profile"
                component={ProfileScreen}
                options={{
                    drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>
                }}
            />
        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
    },
    profileHeader: {
        backgroundColor: COLORS.primary,
        padding: 20,
        paddingTop: 40,
        marginBottom: 10,
    },
    profileImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileImageText: {
        fontSize: 30,
    },
    profileName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileEmail: {
        color: '#rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    drawerItemsContainer: {
        flex: 1,
        paddingTop: 10,
    },
    logoutButton: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    logoutText: {
        color: 'red',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default DrawerNavigator;
