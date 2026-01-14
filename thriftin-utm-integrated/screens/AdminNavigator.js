import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import SalesDashboard from './SalesDashboard';
import UserActivityDashboard from './UserActivityDashboard';
import AdminPanel from './AdminPanel';
import Chat from './Chat';

const Tab = createBottomTabNavigator();

const CustomHeader = ({ navigation, title }) => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>ThriftIn UTM</Text>
        <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] })} style={styles.logoutButton}>
            <Icon name="person-circle-outline" size={30} color="#c70000" />
        </TouchableOpacity>
    </View>
);

const AdminNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                header: () => <CustomHeader navigation={navigation} title={route.name} />,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'SalesDashboard') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'UserActivity') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'AdminPanel') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    } else if (route.name === 'Chat') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#c70000',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="SalesDashboard" component={SalesDashboard} options={{ title: 'Sales' }} />
            <Tab.Screen name="UserActivity" component={UserActivityDashboard} options={{ title: 'Activity' }} />
            <Tab.Screen name="AdminPanel" component={AdminPanel} options={{ title: 'Admin' }} />
            <Tab.Screen name="Chat" component={Chat} options={{ title: 'Chat' }} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, // Added padding for safe area (approx) if SafeAreaView is not wrapping entire navigator
        paddingBottom: 15,
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
});

export default AdminNavigator;