
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import CasinoView from './components/CasinoView';
import AuthView from './components/AuthView';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fix: properly handle nested unsubscribes to prevent memory leaks
  useEffect(() => {
    let unsubDoc: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clear any existing doc listener when auth state changes
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = undefined;
      }

      if (firebaseUser) {
        // Real-time listener for user document in Firestore
        unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.data() as UserProfile);
          }
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const updateBalance = async (updater: number | ((prev: number) => number)) => {
    if (!userProfile) return;
    
    const nextBalance = typeof updater === 'function' ? updater(userProfile.balance) : updater;
    const finalBalance = Math.max(0, nextBalance);
    
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        balance: finalBalance
      });
    } catch (err) {
      console.error("Failed to sync balance to Firestore:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-amber-500 animate-pulse font-black uppercase tracking-[0.5em] text-xs">Synchronizing Vault...</div>
    </div>
  );

  if (!userProfile) {
    return <AuthView onSuccess={setUserProfile} />;
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      <CasinoView 
        balance={userProfile.balance} 
        setBalance={updateBalance as any} 
        onExit={() => auth.signOut()} 
      />
    </div>
  );
};

export default App;