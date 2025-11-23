import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image 
} from 'react-native';
import axios from 'axios';
import config from '../config';

export default function ResetPasswordScreen({ route, navigation }) {
  const emailFromRoute = route.params?.email || '';
  
  const [email, setEmail] = useState(emailFromRoute);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!code) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    const containsLetters = /[a-zA-Z]/.test(newPassword);
    const containsNumbers = /[0-9]/.test(newPassword);
    if (!containsLetters || !containsNumbers) {
      Alert.alert("Error", "Password must contain both letters and numbers");
      return;
    }

    try {
      const response = await axios.post(config.endpoints.resetPassword, { 
        email,
        token: code, 
        newPassword 
      });
      Alert.alert(
        "Success", 
        "Password reset successfully! You can now log in with your new password.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Reset password error:', error.response?.data);
      Alert.alert("Error", error.response?.data?.message || "Failed to reset password. Please check your verification code.");
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
        Enter the 6-digit code sent to your email and your new password.
      </Text>

      {/* Email Input */}
      <TextInput
        placeholder="youremail@graduate.utm.my"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!emailFromRoute} // 如果从上一页传来，则不可编辑
      />

      {/* Verification Code Input */}
      <TextInput
        placeholder="6-digit code"
        value={code}
        onChangeText={setCode}
        style={[styles.input, styles.codeInput]}
        keyboardType="number-pad"
        maxLength={6}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* New Password Input */}
      <TextInput
        placeholder="New Password (min 8 characters)"
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Confirm Password Input */}
      <TextInput
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Reset Password Button */}
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={handleResetPassword}
      >
        <Text style={styles.resetButtonText}>Reset Password</Text>
      </TouchableOpacity>

      {/* Back to Login Link */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
    marginBottom: 15,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#8B1A1A',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 14,
    color: '#8B1A1A',
    fontWeight: '600',
    textAlign: 'center',
  },
});