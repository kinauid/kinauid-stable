/**
 * Firebase Client Configuration — Kinau ID
 * Used for Google SSO / Firebase Authentication (client-side only)
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'kinau-id',
  appId: '1:248162834692:web:6e5f1f6258450c7d665851',
  apiKey: 'AIzaSyCOQDs3yzvfbkVeUfMAtr4LKkkpvVJnObo',
  authDomain: 'kinau-id.firebaseapp.com',
  storageBucket: 'kinau-id.appspot.com',
  messagingSenderId: '248162834692',
  measurementId: 'G-S74RNQBLHJ',
};

// Prevent double-initialization in HMR / SSR hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request profile & email scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');
