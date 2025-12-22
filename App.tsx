
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import CasinoView from './components/CasinoView';
import AuthView from './components/AuthView';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = undefined;
      }

      if (firebaseUser) {
        unsubDoc = onSnapshot(doc(db, 'casinousers', firebaseUser.uid), (snapshot) => {
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
    
    // Calculate the delta locally to send an atomic increment to Firestore
    // This prevents race conditions where rapid updates overwrite each other
    const currentBalance = userProfile.balance;
    const nextBalance = typeof updater === 'function' ? updater(currentBalance) : updater;
    const delta = nextBalance - currentBalance;
    
    if (delta === 0) return;

    try {
      // Use Firestore increment for atomic, server-side math
      await updateDoc(doc(db, 'casinousers', userProfile.uid), {
        balance: increment(delta)
      });
    } catch (err) {
      console.error("Failed to sync balance to Firestore:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-amber-500 animate-pulse font-black uppercase tracking-[0.5em] text-xs">Synchronizing Portfolio...</div>
    </div>
  );

  if (!userProfile) {
    return <AuthView onSuccess={setUserProfile} />;
  }

  return (
    <CasinoView 
      balance={userProfile.balance} 
      setBalance={updateBalance as any} 
      onExit={() => auth.signOut()} 
    />
  );
};

export default App;
