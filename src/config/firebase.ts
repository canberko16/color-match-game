import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: 'REMOVED',
  authDomain: 'colormatch-ca6fd.firebaseapp.com',
  databaseURL: 'https://colormatch-ca6fd-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'colormatch-ca6fd',
  storageBucket: 'colormatch-ca6fd.firebasestorage.app',
  messagingSenderId: '506380169355',
  appId: '1:506380169355:web:aec73e0b60719e843b248e',
  measurementId: 'G-XD2SBETMGN',
};

// Expo hot-reload'da birden fazla initialize olmasını önle
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/** Realtime Database referansı — matchmaking ve competitive mod için kullanılır */
export const db = getDatabase(app);
