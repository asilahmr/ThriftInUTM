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

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [matric, setMatric] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [matricError, setMatricError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email format validation
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@graduate\.utm\.my$/i;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid UTM email (e.g., yourname@graduate.utm.my)');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  // Matric number format validation
  const validateMatric = (matric) => {
    const matricRegex = /^(F\d{2}SP\d{4}|A\d{2}[A-Z]{2}\d{4}|M[A-Z]{2}\d{2}\d{4}|P[A-Z]{2}\d{2}\d{4})$/;
    if (!matricRegex.test(matric)) {
      setMatricError('Please enter a valid matric number');
      return false;
    } else {
      setMatricError('');
      return true;
    }
  };

  // Password validation
  const validatePassword = (password) => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return false;
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError('Password must contain both letters and numbers.');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleRegister = async () => {
    setEmailError('');
    setMatricError('');
    setPasswordError('');
    
    if (email.endsWith("@gmail.com")) {
      Alert.alert("Error", "Please enter a valid UTM email (e.g., yourname@graduate.utm.my)");
      return;
    }
    
    // Ensure all fields are filled
    if (!email || !matric || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    const isEmailValid = validateEmail(email);
    const isMatricValid = validateMatric(matric);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid) {
      Alert.alert("Error", "Please enter a valid UTM email (e.g., yourname@graduate.utm.my)");
      return;
    }
    
    if (!isMatricValid) {
      Alert.alert("Error", "Please enter a valid matric number");
      return;
    }
    
    if (!isPasswordValid) {
      Alert.alert("Error", "Password must be at least 8 characters and contain both letters and numbers");
      return;
    }

    try {
      const response = await axios.post(config.endpoints.register, { 
        email, 
        matric, 
        password 
      });
      Alert.alert("Success", response.data.message);
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Registration failed");
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
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Matric Number Input */}
      <TextInput
        placeholder="matric number"
        value={matric}
        onChangeText={(text) => {
          setMatric(text);
          validateMatric(text);
        }}
        style={styles.input}
        autoCapitalize="characters"
      />
      {matricError ? <Text style={styles.errorText}>{matricError}</Text> : null}

      {/* Password Input */}
      <TextInput
        placeholder="new password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          validatePassword(text);
        }}
        style={styles.input}
        secureTextEntry
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      {/* Confirm Password Input */}
      <TextInput
        placeholder="confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry
      />

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Login Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Log In</Text>
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
  registerButton: {
    backgroundColor: '#8B1A1A',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#8B1A1A',
    fontWeight: '600',
  },
});