import React, { useLayoutEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from 'react-native-vector-icons/Ionicons';

import styles from "./styles";
import SalesDashboard from "./SalesDashboard";
import BuyerSpendingSummary from "./BuyerSpendingSummary";
import CategoryProducts from './CategoryProducts';
import BuyerCategoryDetail from './BuyerCategoryDetail';
import UserActivityDashboard from './UserActivityDashboard';
import AdminPanel from './AdminPanel';
import Chat from './Chat';
import API_BASE from './config';

const Stack = createStackNavigator();

// ---------------- Role Selection Screen ----------------
function RoleSelectionScreen({ navigation }) {
  const [students, setStudents] = React.useState([]);
  const [selectedStudentId, setSelectedStudentId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/users/students`)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
        if (data.length > 0) setSelectedStudentId(data[0].user_id);
      })
      .catch(err => {
        console.error('Fetch students error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#c70000" />;

  return (
    <SafeAreaView style={styles.roleContainer}>
      <Text style={styles.title}>Thrift In UTM</Text>
      <Text style={styles.subtitle}>Select your role to continue</Text>

      <Text>Select Student:</Text>
      <Picker
        selectedValue={selectedStudentId}
        onValueChange={(id) => setSelectedStudentId(id)}
        style={{ width: 250, color: '#c70000' }}
      >
        {students.map(student => (
          <Picker.Item key={student.user_id} label={student.name} value={student.user_id} />
        ))}
      </Picker>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const student = students.find(s => s.user_id === selectedStudentId);
          const name = student ? student.name : 'Student';
          navigation.navigate('DashboardMenu', { role: 'student', userId: selectedStudentId, name });
        }}
      >
        <Text style={styles.buttonText}>Continue as Student</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('DashboardMenu', { role: 'admin', name: 'Admin' })}
      >
        <Text style={styles.buttonText}>Continue as Admin</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Thrift In UTM</Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------- Dashboard Menu ----------------
function DashboardMenu({ route, navigation }) {
  const { role, userId, name } = route.params;
  const [showLogout, setShowLogout] = useState(false);

  // Custom Header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "ThriftIn UTM",
      headerTintColor: "#c70000",
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          <TouchableOpacity onPress={() => setShowLogout(!showLogout)}>
            <Icon name="person-circle-outline" size={30} color="#c70000" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, showLogout]);

  const handleLogout = () => {
    setShowLogout(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'RoleSelection' }],
    });
  };

  return (
    <SafeAreaView style={styles.roleContainer}>
      {/* Logout Modal/Tooltip */}
      {showLogout && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'white',
            padding: 10,
            borderRadius: 5,
            elevation: 5,
            zIndex: 100,
            borderWidth: 1,
            borderColor: '#eee'
          }}
          onPress={handleLogout}
        >
          <Text style={{ color: '#c70000', fontWeight: 'bold' }}>Log Out</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Welcome, {name}</Text>

      {/* --- Common --- */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SalesDashboard', { role, userId })}
      >
        <Text style={styles.buttonText}>Go to Sales Dashboard</Text>
      </TouchableOpacity>

      {/* --- Student Only --- */}
      {role === 'student' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('BuyerSpendingSummary', { role, userId })}
        >
          <Text style={styles.buttonText}>Go to Buyer Spending Summary</Text>
        </TouchableOpacity>
      )}

      {/* --- Admin Only --- */}
      {role === 'admin' && (
        <>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('UserActivityDashboard')}
          >
            <Text style={styles.buttonText}>Go to User Activity Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('AdminPanel')}
          >
            <Text style={styles.buttonText}>Go to Admin Panel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Chat')}
          >
            <Text style={styles.buttonText}>Go to Chat</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

// ---------------- App ----------------
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="DashboardMenu"
          component={DashboardMenu}
        // Header options set in component
        />

        <Stack.Screen
          name="SalesDashboard"
          component={SalesDashboard}
          options={{ headerTitle: 'Sales Dashboard', headerTintColor: '#c70000' }}
        />

        <Stack.Screen
          name="BuyerSpendingSummary"
          component={BuyerSpendingSummary}
          options={{ headerTitle: 'Buyer Spending Summary', headerTintColor: '#c70000' }}
        />

        <Stack.Screen
          name="CategoryProducts"
          component={CategoryProducts}
        />

        <Stack.Screen
          name="BuyerCategoryDetail"
          component={BuyerCategoryDetail}
        />

        <Stack.Screen
          name="UserActivityDashboard"
          component={UserActivityDashboard}
          options={{ title: 'User Activity', headerTintColor: '#c70000' }}
        />

        <Stack.Screen
          name="AdminPanel"
          component={AdminPanel}
          options={{ title: 'Admin Panel', headerTintColor: '#c70000' }}
        />

        <Stack.Screen
          name="Chat"
          component={Chat}
          options={{ title: 'Chat', headerTintColor: '#c70000' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}