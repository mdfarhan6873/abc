import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { SmsRoleModule } = NativeModules;

/**
 * Request SMS-related permissions required for default SMS app functionality.
 */
export async function ensureSmsPermissions(): Promise<boolean> {
  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
    ];

    // Add POST_NOTIFICATIONS for Android 13+ (API 33)
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

    return receiveGranted && readGranted && sendGranted && notifGranted;
  } catch (err) {
    console.warn('Error requesting SMS permissions:', err);
    return false;
  }
}

/**
 * Request to set this app as the default SMS handler.
 * Returns true if the request was initiated successfully.
 */
export async function requestDefaultSmsRole(): Promise<boolean> {
  try {
    const result = await SmsRoleModule.requestDefaultSmsRole();
    return result;
  } catch (error) {
    console.error('Failed to request default SMS role:', error);
    return false;
  }
}

/**
 * Check if this app is currently the default SMS app.
 */
export async function isDefaultSmsApp(): Promise<boolean> {
  try {
    const result = await SmsRoleModule.isDefaultSmsApp();
    return result;
  } catch (error) {
    console.error('Failed to check default SMS app status:', error);
    return false;
  }
}
