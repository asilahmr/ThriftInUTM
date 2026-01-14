import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);

  // Load saved credentials when component mounts
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  // Load saved email from local storage
  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const wasRemembered = await AsyncStorage.getItem('rememberMe');

      if (wasRemembered === 'true' && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  // Save or clear credentials based on remember me checkbox
  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberMe');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  // Email format validation (student + admin)
  const validateEmail = (email) => {
    const studentEmailRegex = /^[a-zA-Z0-9._%+-]+@graduate\.utm\.my$/i;
    const adminEmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    if (!studentEmailRegex.test(email) && !adminEmailRegex.test(email)) {
      setEmailError("Please enter a valid email (@graduate.utm.my or @gmail.com)");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  // Password validation
  const validatePassword = (password) => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }

    setResending(true);

    try {
      const response = await api.post('/api/email/resend', {
        email
      });

      Alert.alert(
        "Success",
        response.data.message || "Verification email sent! Please check your inbox.",
        [{ text: "OK" }]
      );
      setShowResendButton(false);
    } catch (error) {
      console.error('Resend error:', error.response?.data);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send verification email'
      );
    } finally {
      setResending(false);
    }
  };

  const handleLogin = async () => {
    console.log("=== LOGIN ATTEMPT START ===");
    console.log("Email:", email);
    console.log("Password length:", password.length);

    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!validateEmail(email) || !validatePassword(password)) {
      console.log("Validation failed");
      return;
    }

    setLoading(true);
    setShowResendButton(false);

    try {
      console.log("Sending request to server...");

      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      console.log("Response received:", JSON.stringify(response.data, null, 2));
      console.log("Response status:", response.status);

      if (!response.data) {
        console.error("No data in response");
        Alert.alert("Error", "Invalid server response");
        return;
      }

      if (!response.data.user) {
        console.error("No user object in response");
        Alert.alert("Error", "Invalid user data from server");
        return;
      }

      console.log("User type:", response.data.user.userType);

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        console.log('Token and user data saved');
      }

      await saveCredentials();

      if (response.data.user.userType === "admin") {
        Alert.alert("Success", response.data.message || "Admin login successful");
        navigation.navigate("AdminDashboard");
      } else if (response.data.user.userType === "student") {
        Alert.alert("Success", response.data.message || "Student login successful");
        navigation.navigate("Main", {
          screen: "Home",
          params: {
            user: response.data.user,
            products: []
          }
        });
      } else {
        console.error("Unknown user type:", response.data.user.userType);
        Alert.alert("Error", "Unknown user type");
      }
    } catch (error) {
      console.log("=== ERROR CAUGHT ===");
      console.log("Error type:", error.constructor.name);

      if (error.response) {
        console.log("Server error response:");
        console.log("Status:", error.response.status);
        console.log("Data:", JSON.stringify(error.response.data, null, 2));
        console.log("Headers:", JSON.stringify(error.response.headers, null, 2));

        const errorMessage = error.response.data?.message ||
          `Server error (${error.response.status})`;

        if (errorMessage.includes('verify your email')) {
          setShowResendButton(true);
        }

        Alert.alert("Login Failed", errorMessage);
      } else if (error.request) {
        console.log("No response received:");
        console.log("Request:", error.request);
        console.log("Network error or server not responding");

        Alert.alert(
          "Connection Error",
          "Cannot connect to server. Please check:\n" +
          "1. Server is running\n" +
          "2. IP address is correct\n" +
          "3. You're on the same network"
        );
      } else {
        console.log("General error:");
        console.log("Message:", error.message);
        console.log("Stack:", error.stack);

        Alert.alert("Error", error.message || "Login failed");
      }

      console.log("=== ERROR END ===");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Email Input */}
      <TextInput
        placeholder="youremail@graduate.utm.my"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          validateEmail(text);
        }}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Password Input */}
      <TextInput
        placeholder="your password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          validatePassword(text);
        }}
        style={styles.input}
        secureTextEntry
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      {/* Remember Me & Forgot Password */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.rememberMeContainer}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('RecoverPassword')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Log In</Text>
        )}
      </TouchableOpacity>

      {showResendButton && (
        <TouchableOpacity
          style={[styles.resendButton, resending && styles.buttonDisabled]}
          onPress={handleResendVerification}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator color="#8B1A1A" />
          ) : (
            <View style={styles.resendContent}>
              <Text style={styles.resendButtonText}>Resend verification email</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Register Link */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    borderRadius: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8B1A1A',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8B1A1A',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666',
  },
  forgotText: {
    fontSize: 14,
    color: '#8B1A1A',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#8B1A1A',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8B1A1A',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  resendContent: {
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#8B1A1A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resendSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#8B1A1A',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
  },
});