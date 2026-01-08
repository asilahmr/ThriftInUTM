import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import styles from "./styles";
import SalesDashboard from "./SalesDashboard";
import BuyerSpendingSummary from "./BuyerSpendingSummary";
import CategoryProducts from './CategoryProducts';
import BuyerCategoryDetail from './BuyerCategoryDetail';
import UserActivityDashboard from './UserActivityDashboard';
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
        onPress={() => navigation.navigate('DashboardMenu', { role: 'student', userId: selectedStudentId })}
      >
        <Text style={styles.buttonText}>Continue as Student</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('DashboardMenu', { role: 'admin' })}
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
  const { role, userId } = route.params;

  return (
    <SafeAreaView style={styles.roleContainer}>
      <Text style={styles.title}>Welcome, {role === 'student' ? 'Student' : 'Admin'}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SalesDashboard', { role, userId })}
      >
        <Text style={styles.buttonText}>Go to Sales Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('BuyerSpendingSummary', { role, userId })}
      >
        <Text style={styles.buttonText}>Go to Buyer Spending Summary</Text>
      </TouchableOpacity>

      {role === 'admin' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('UserActivityDashboard')}
        >
          <Text style={styles.buttonText}>Go to User Activity Dashboard</Text>
        </TouchableOpacity>
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
          options={{ title: 'Dashboard', headerTintColor: '#c70000' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}