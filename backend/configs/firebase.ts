import admin from 'firebase-admin';
import 'dotenv/config';

let firebaseApp: admin.app.App | null = null;

try {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountVar) {
    const serviceAccount = JSON.parse(serviceAccountVar);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized using environment variable');
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT env variable not found. Firebase Push Notifications will run in warning/mock mode.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
}

export { firebaseApp };

export const sendPushNotification = async (tokens: string[], title: string, body: string, data: any = {}) => {
  if (tokens.length === 0) return;

  // Filter out any empty tokens
  const validTokens = tokens.filter(t => t && t.trim() !== '');
  if (validTokens.length === 0) return;

  if (!firebaseApp) {
    console.warn(`[FCM MOCK] Push notification triggered (No credentials). Title: "${title}", Body: "${body}", Tokens: [${validTokens.join(', ')}]`);
    return;
  }

  try {
    const response = await firebaseApp.messaging().sendEachForMulticast({
      tokens: validTokens,
      notification: {
        title,
        body,
      },
      data: data ? Object.keys(data).reduce((acc: any, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}) : undefined,
    });
    console.log(`Successfully sent ${response.successCount} push notifications; failed to send ${response.failureCount}.`);
  } catch (error) {
    console.error('Error sending push notifications via FCM:', error);
  }
};
