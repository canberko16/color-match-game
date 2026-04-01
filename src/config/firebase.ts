import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase yapılandırması — env değişkenlerinden okunur
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Expo hot-reload'da birden fazla initialize olmasını önle
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/** Realtime Database referansı — matchmaking ve competitive mod için kullanılır */
export const db = getDatabase(app);
