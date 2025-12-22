
import React, { useState, useEffect } from 'react';
import { UserProfile, SystemConfig } from './types';
import CasinoView from './components/CasinoView';
import AuthView from './components/AuthView';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, increment, setDoc } from 'firebase/firestore';

// CURRENT CLIENT VERSION
const APP_VERSION = 107;

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  useEffect(() => {
    // 1. Version Check & System Config Listener
    // This stays here as it's a passive check for all clients
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const config = snapshot.data() as SystemConfig;
        if (config.minRequiredVersion > APP_VERSION) {
          setIsOutdated(true);
        }
        if (config.alertMessage) {
          setSystemAlert(config.alertMessage);
        }
      } else {
        // Initialize config if it doesn't exist
        setDoc(doc(db, 'system', 'config'), {
          minRequiredVersion: APP_VERSION,
          maintenanceMode: false
        });
      }
    });

    // 2. Auth State Listener
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
      unsubConfig();
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

  // BLOCKING OVERLAY FOR OUTDATED VERSIONS
  if (isOutdated) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-center z-[9999]">
        <div className="max-w-md w-full bg-red-950/20 border-2 border-red-500/30 p-12 rounded-[3rem] backdrop-blur-3xl shadow-[0_0_100px_rgba(239,68,68,0.1)]">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <span className="text-5xl">⚠️</span>
          </div>
          <h2 className="text-red-500 font-black uppercase tracking-[0.4em] text-xs mb-4">Protocol Error 409</h2>
          <h1 className="text-3xl font-black text-white italic tracking-tighter mb-6 uppercase">Outdated Core Detected</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium">
            Your terminal is running an expired security protocol (v{APP_VERSION}). To maintain asset integrity, you must initialize the latest core update.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-500 hover:bg-red-400 text-black font-black py-5 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.2)] transition-all uppercase italic tracking-tighter text-xl active:scale-95"
          >
            Re-Initialize Core
          </button>
          <p className="mt-8 text-[9px] font-black text-slate-600 uppercase tracking-widest">System Lockdown Active</p>
        </div>
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
    <>
      {systemAlert && (
        <div className="bg-amber-500 text-black py-2 px-4 text-center text-[10px] font-black uppercase tracking-[0.3em] fixed top-0 w-full z-[100] shadow-xl">
          System Alert: {systemAlert}
        </div>
      )}
      <CasinoView 
        balance={userProfile.balance} 
        setBalance={updateBalance as any} 
        onExit={() => auth.signOut()} 
      />
    </>
  );
};

export default App;
