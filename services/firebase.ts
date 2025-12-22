// Use standard modular imports for Firebase v9+ SDK.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace placeholders with actual Firebase project configuration if needed.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize the Firebase app instance using the modular approach.
const app = initializeApp(firebaseConfig);
// Export singleton instances for auth and firestore.
export const auth = getAuth(app);
export const db = getFirestore(app);