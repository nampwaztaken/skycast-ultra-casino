import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace placeholders with actual Firebase project configuration if needed.
const firebaseConfig = {
  apiKey: "AIzaSyDUJJYk-QS9FQ6xnr8xHTmE9BvE-gq8F5A",
  authDomain: "bankingapp-7f285.firebaseapp.com",
  projectId: "bankingapp-7f285",
  storageBucket: "bankingapp-7f285.firebasestorage.app",
  messagingSenderId: "92117373268",
  appId: "1:92117373268:web:bc48b6bab9dcfbc6f578c1",
  measurementId: "G-QJH7J5JJXK"
};

// Initialize the Firebase app instance using the modular approach.
const app = initializeApp(firebaseConfig);
// Export singleton instances for auth and firestore.
export const auth = getAuth(app);
export const db = getFirestore(app);