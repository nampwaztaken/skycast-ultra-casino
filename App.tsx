import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import CasinoView from './components/CasinoView';
import AuthView from './components/AuthView';
// Import from local firebase service to ensure unified module resolution.
import { auth, db, onAuthStateChanged, doc, onSnapshot, updateDoc, increment } from './services/firebase';

// This is the current version of the code deployed. 
// If Firestore's minRequiredVersion is higher than this, the app forces a refresh.
const LOCAL_VERSION = 110; 

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    // REAL-TIME VERSION ENFORCEMENT
    // Listens to system/config in Firestore. If minRequiredVersion > LOCAL_VERSION, force update.
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const minRequired = Number(data?.minRequiredVersion);
        
        if (!isNaN(minRequired) && LOCAL_VERSION < minRequired) {
          setIsOutdated(true);
        } else {
          setIsOutdated(false);
        }
      }
    }, (error) => {
      console.error("System version check failed:", error);
    });

    return () => unsubConfig();
  }, []);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = undefined;
      }

      if (firebaseUser) {
        // Real-time synchronization of user profile and balance from 'casinousers' collection.
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
    
    const currentBalance = userProfile.balance;
    const nextBalance = typeof updater === 'function' ? updater(currentBalance) : updater;
    const delta = nextBalance - currentBalance;
    
    if (delta === 0) return;

    try {
      await updateDoc(doc(db, 'casinousers', userProfile.uid), {
        balance: increment(delta)
      });
    } catch (err) {
      console.error("Failed to sync balance to Firestore:", err);
    }
  };

  if (isOutdated) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center selection:bg-amber-500/20">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20 animate-pulse">
          <span className="text-4xl">🔄</span>
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Update Required</h1>
        <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mb-10 leading-relaxed">
          The platform has deployed a critical security and performance patch (v{LOCAL_VERSION}).<br/>Please synchronize your assets to continue.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-amber-500 hover:bg-amber-400 text-black font-black py-4 px-12 rounded-2xl shadow-[0_10px_40px_rgba(245,158,11,0.2)] transition-all uppercase tracking-tighter italic text-xl active:scale-95"
        >
          Refresh Portfolio
        </button>
      </div>
    );
  }

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
