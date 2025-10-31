import React, { useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Alert,
  Text,
  Platform,
  FlatList,
  View,
  StyleSheet,
  NativeEventEmitter,
  NativeModules
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

    if (receiveGranted && readGranted && sendGranted && notifGranted) {
      Alert.alert('✅ Permissions Granted', 'SMS Forwarder is now active!');
      console.log('✅ All permissions granted successfully');
    } else {
      Alert.alert(
        '⚠️ Permissions Required',
        'Please allow all SMS and notification permissions for the app to function properly.'
      );
      console.warn('❌ Some permissions denied:', granted);
    }
  } catch (err) {
    console.warn('Error requesting permissions:', err);
  }
}

interface SmsMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: Date;
}

export default function App() {
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);

  useEffect(() => {
    requestSmsPermissions();

    // Set up SMS listener
    const eventEmitter = new NativeEventEmitter(NativeModules.SmsModule);
    const subscription = eventEmitter.addListener('onSmsReceived', (smsData: string) => {
      const [sender, body] = smsData.split('\n', 2);
      const newSms: SmsMessage = {
        id: Date.now().toString(),
        sender,
        body,
        timestamp: new Date(),
      };
      setSmsMessages(prev => [newSms, ...prev]);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const renderSmsItem = ({ item }: { item: SmsMessage }) => (
    <View style={styles.smsItem}>
      <Text style={styles.sender}>{item.sender}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.timestamp}>{item.timestamp.toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>📩 SMS Forwarder</Text>

        <Text style={styles.subtitle}>
          Keep this app installed and permissions granted.
          {'\n'}
          Incoming SMS messages will be automatically forwarded.
        </Text>

        <Text style={styles.receivedTitle}>Received SMS Messages:</Text>

        {smsMessages.length === 0 ? (
          <Text style={styles.noMessages}>No SMS messages received yet.</Text>
        ) : (
          <FlatList
            data={smsMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderSmsItem}
            style={styles.list}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#444',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
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
