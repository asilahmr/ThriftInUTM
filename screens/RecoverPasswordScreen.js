import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import api from '../utils/api';

export default function RecoverPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSendResetLink = async () => {
    if (email.endsWith("@gmail.com")) {
      Alert.alert("Error", "Please use a valid UTM student email (@graduate.utm.my). Admin accounts cannot register.");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/recover-password', { 
        email 
      });
      setLoading(false);
      Alert.alert(
        "Success", 
        "A 6-digit verification code has been sent to your email",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('ResetPassword', { email }) 
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", error.response?.data?.message || "Failed to send reset code");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we will send you a 6-digit verification code.
      </Text>

      <TextInput
        placeholder="youremail@graduate.utm.my"
        value={email}
        onChangeText={(text) => setEmail(text)}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={handleSendResetLink} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.resetButtonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backContainer} 
        onPress={() => navigation.navigate('Login')} 
        disabled={loading}
      >
        <Text style={styles.backText}>Back to Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -60,  
  },
  logo: {
    width: 280,      
    height: 180,    
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#8B1A1A',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backContainer: {
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#8B1A1A',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 15,
  },
});