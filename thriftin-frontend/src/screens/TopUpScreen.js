// src/screens/TopUpScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';
import { walletApi } from '../api/productApi';
import { COLORS } from '../utils/constants';

const TopUpScreen = ({ navigation }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    // Credit Card
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    // E-Wallet
    phoneNumber: '',
    pin: '',
    // Online Banking
    bank: '',
    accountNumber: '',
    tac: '',
  });

  const topUpMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, etc.'
    },
    {
      id: 'e_wallet',
      name: 'E-Wallet',
      icon: '📱',
      description: 'Touch n Go, GrabPay, ShopeePay'
    },
    {
      id: 'online_banking',
      name: 'Online Banking',
      icon: '🏦',
      description: 'Maybank, CIMB, etc.'
    }
  ];

  const quickAmounts = [50, 100, 200, 500];

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const validatePaymentDetails = () => {
    if (selectedMethod === 'credit_card') {
      if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length !== 16) {
        Alert.alert('Validation Error', 'Please enter a valid 16-digit card number');
        return false;
      }
      if (!paymentDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
        Alert.alert('Validation Error', 'Please enter expiry date in MM/YY format');
        return false;
      }
      if (!paymentDetails.cvv || paymentDetails.cvv.length !== 3) {
        Alert.alert('Validation Error', 'Please enter a valid 3-digit CVV');
        return false;
      }
      if (!paymentDetails.cardholderName.trim()) {
        Alert.alert('Validation Error', 'Please enter cardholder name');
        return false;
      }
    } else if (selectedMethod === 'e_wallet') {
      if (!paymentDetails.phoneNumber || paymentDetails.phoneNumber.length < 10) {
        Alert.alert('Validation Error', 'Please enter a valid phone number');
        return false;
      }
      if (!paymentDetails.pin || paymentDetails.pin.length !== 6) {
        Alert.alert('Validation Error', 'Please enter a 6-digit PIN');
        return false;
      }
    } else if (selectedMethod === 'online_banking') {
      if (!paymentDetails.bank) {
        Alert.alert('Validation Error', 'Please select a bank');
        return false;
      }
      if (!paymentDetails.accountNumber || paymentDetails.accountNumber.length < 10) {
        Alert.alert('Validation Error', 'Please enter a valid account number');
        return false;
      }
      if (!paymentDetails.tac || paymentDetails.tac.length !== 6) {
        Alert.alert('Validation Error', 'Please enter 6-digit TAC code');
        return false;
      }
    }
    return true;
  };

  const handleTopUp = async () => {
    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const topUpAmount = parseFloat(amount);

    if (topUpAmount < 10) {
      Alert.alert('Minimum Amount', 'Minimum top-up amount is RM 10.00');
      return;
    }

    if (topUpAmount > 5000) {
      Alert.alert('Maximum Amount', 'Maximum top-up amount is RM 5000.00');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method');
      return;
    }

    if (!validatePaymentDetails()) {
      return;
    }

    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('💰 Processing top-up...');
      const response = await walletApi.topUp(topUpAmount, selectedMethod);
      console.log('✅ Top-up successful:', response.data);

      Alert.alert(
        '✅ Top-Up Successful!',
        `RM ${topUpAmount.toFixed(2)} has been added to your wallet.\n\nNew Balance: RM ${response.data.balance_after.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('❌ Top-up error:', error);
      Alert.alert(
        'Top-Up Failed',
        error.message || 'Unable to process top-up. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    if (!selectedMethod) {
      return (
        <View style={styles.emptyFormContainer}>
          <Text style={styles.emptyFormIcon}>💳</Text>
          <Text style={styles.emptyFormText}>Select a payment method above</Text>
        </View>
      );
    }

    switch (selectedMethod) {
      case 'credit_card':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Enter Card Details</Text>
            
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={16}
              value={paymentDetails.cardNumber}
              onChangeText={(text) => setPaymentDetails({...paymentDetails, cardNumber: text.replace(/\s/g, '')})}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  maxLength={5}
                  value={paymentDetails.expiryDate}
                  onChangeText={(text) => {
                    let formatted = text.replace(/\D/g, '');
                    if (formatted.length >= 2) {
                      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
                    }
                    setPaymentDetails({...paymentDetails, expiryDate: formatted});
                  }}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  value={paymentDetails.cvv}
                  onChangeText={(text) => setPaymentDetails({...paymentDetails, cvv: text})}
                />
              </View>
            </View>

            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="JOHN DOE"
              autoCapitalize="characters"
              value={paymentDetails.cardholderName}
              onChangeText={(text) => setPaymentDetails({...paymentDetails, cardholderName: text})}
            />
          </View>
        );

      case 'e_wallet':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>E-Wallet Payment</Text>
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0123456789"
              keyboardType="phone-pad"
              maxLength={11}
              value={paymentDetails.phoneNumber}
              onChangeText={(text) => setPaymentDetails({...paymentDetails, phoneNumber: text})}
            />

            <Text style={styles.label}>6-Digit PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              value={paymentDetails.pin}
              onChangeText={(text) => setPaymentDetails({...paymentDetails, pin: text})}
            />
          </View>
        );

      case 'online_banking':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Online Banking</Text>
            
            <Text style={styles.label}>Select Bank</Text>
            <View style={styles.bankButtons}>
              {['Maybank', 'CIMB', 'Public Bank', 'RHB', 'Hong Leong'].map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[
                    styles.bankButton,
                    paymentDetails.bank === bank && styles.bankButtonActive
                  ]}
                  onPress={() => setPaymentDetails({...paymentDetails, bank})}
                >
                  <Text style={[
                    styles.bankButtonText,
                    paymentDetails.bank === bank && styles.bankButtonTextActive
                  ]}>
                    {bank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234567890"
              keyboardType="numeric"
              maxLength={14}
              value={paymentDetails.accountNumber}
              onChangeText={(text) => setPaymentDetails({...paymentDetails, accountNumber: text})}
            />

            <Text style={styles.label}>TAC Code (6 digits)</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              keyboardType="numeric"
              maxLength={6}
              value={paymentDetails.tac}
              onChangeText={(text) => setPaymentDetails({...paymentDetails, tac: text})}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>RM</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <Text style={styles.amountHint}>Min: RM 10.00 | Max: RM 5000.00</Text>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Amount</Text>
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountButtonActive
                ]}
                onPress={() => handleQuickAmount(quickAmount)}
              >
                <Text style={[
                  styles.quickAmountText,
                  amount === quickAmount.toString() && styles.quickAmountTextActive
                ]}>
                  RM {quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {topUpMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardActive
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedMethod === method.id && styles.radioOuterActive
              ]}>
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Form */}
        {renderPaymentForm()}

        {/* Mock Note */}
        <View style={styles.mockNote}>
          <Text style={styles.mockNoteText}>
            🧪 <Text style={styles.mockNoteBold}>Demo Mode:</Text> This is a mock top-up.
            Any valid format will be accepted. No real transaction will occur.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.topUpButton, (!selectedMethod || !amount || processing) && styles.topUpButtonDisabled]}
          onPress={handleTopUp}
          disabled={!selectedMethod || !amount || processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.topUpButtonText}>
              Top Up {amount ? `RM ${parseFloat(amount).toFixed(2)}` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Processing Modal */}
      <Modal visible={processing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.modalText}>Processing Top-Up...</Text>
            <Text style={styles.modalSubtext}>Please wait</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingVertical: 16,
  },
  amountHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickAmountButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickAmountTextActive: {
    color: COLORS.primary,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  methodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  methodIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  emptyFormContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyFormIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyFormText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  formContainer: {
    padding: 20,
    paddingTop: 0,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  bankButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  bankButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bankButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bankButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bankButtonTextActive: {
    color: '#FFF',
  },
  mockNote: {
    margin: 20,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mockNoteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  mockNoteBold: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  topUpButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  topUpButtonDisabled: {
    opacity: 0.5,
  },
  topUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  modalSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default TopUpScreen;