import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface Props {
  onSuccess: (userData: any) => void;
}

const AuthView: React.FC<Props> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to treat username as email for Firebase Auth
  const getEmailFromUsername = (uname: string) => `${uname.toLowerCase().trim()}@funmoney.com`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authEmail = getEmailFromUsername(username);

      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, authEmail, password);
        // Reading from 'casinousers'
        const userDoc = await getDoc(doc(db, 'casinousers', userCred.user.uid));
        if (userDoc.exists()) {
          onSuccess(userDoc.data());
        } else {
          setError("User record not found in database.");
        }
      } else {
        // Registration
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, password);
        
        // We explicitly save username, password, and balance into Firestore as requested.
        const initialData = {
          uid: userCred.user.uid,
          fullName: fullName,
          username: username,
          password: password, // Saved as requested
          balance: 10000, // Starting capital
          joinedDate: new Date().toISOString()
        };
        
        // Writing to 'casinousers'
        await setDoc(doc(db, 'casinousers', userCred.user.uid), initialData);
        onSuccess(initialData);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('No account found with that username.');
      else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (err.code === 'auth/email-already-in-use') setError('Username is already taken.');
      else if (err.code === 'auth/operation-not-allowed') setError('Email/Password provider is disabled in Firebase Console.');
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] p-6 selection:bg-amber-500/30">
      <div className="w-full max-w-md bg-white/[0.02] border border-white/10 p-10 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl transition-all duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
            <span className="text-black font-black text-4xl -rotate-12">📈</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
            Fun Money Making <br/><span className="text-amber-500">Website</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase mt-4 opacity-50">
            {isLogin ? 'Secure Portfolio Access' : 'Create Global Wealth Identity'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10"
                required
              />
            </div>
          )}
          
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10"
              required
            />
          </div>

          <div className="relative group">
            <input 
              type="password" 
              placeholder="Secure Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 py-3 rounded-xl">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-5 rounded-[1.5rem] shadow-[0_10px_40px_rgba(245,158,11,0.2)] transition-all uppercase tracking-tighter italic text-xl disabled:opacity-50 active:scale-95"
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center space-y-6">
          <div className="h-px w-20 bg-white/5"></div>
          <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
            {isLogin ? "No Access ID?" : "Already Registered?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-amber-500 ml-2 hover:text-amber-300 transition-colors"
            >
              {isLogin ? 'Register Here' : 'Return to Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;