import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync(userId: string, userToken: string, apiBaseUrl: string) {
  try {
    // Construct a unique mock FCM device token for simulator/testing environments
    const mockDeviceToken = `mock-fcm-user-token-${userId}-${Platform.OS}`;

    console.log(`[Push Notifications] Registering device token: ${mockDeviceToken}`);

    const response = await fetch(`${apiBaseUrl}/api/notifications/save-user-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ token: mockDeviceToken }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Push Notifications] Device token uploaded successfully:', data.message);
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn('[Push Notifications] Failed to upload device token:', errData.message || response.statusText);
    }
  } catch (error) {
    console.error('[Push Notifications] Error registering device token:', error);
  }
}
