import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:demo',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();

export const firebaseAnalyticsPromise =
  typeof window === 'undefined' || !firebaseConfig.measurementId
    ? Promise.resolve(null)
    : isSupported()
        .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
        .catch(() => null);
