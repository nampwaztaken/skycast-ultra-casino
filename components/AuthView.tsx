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
  const getEmailFromUsername = (uname: string) => `${uname.toLowerCase().trim()}@levican.express`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authEmail = getEmailFromUsername(username);

      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, authEmail, password);
        const userDoc = await getDoc(doc(db, 'casinousers', userCred.user.uid));
        if (userDoc.exists()) {
          onSuccess(userDoc.data());
        } else {
          setError("User record not found.");
        }
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, password);
        const initialData = {
          uid: userCred.user.uid,
          fullName: fullName,
          username: username.trim(),
          password: password,
          balance: 1000,
          joinedDate: new Date().toISOString()
        };
        await setDoc(doc(db, 'casinousers', userCred.user.uid), initialData);
        onSuccess(initialData);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Account not found.');
      else if (err.code === 'auth/wrong-password') setError('Invalid password.');
      else if (err.code === 'auth/email-already-in-use') setError('Username taken.');
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] p-4 sm:p-6 selection:bg-amber-500/30 overflow-x-hidden">
      <div className="w-full max-w-md bg-white/[0.02] border border-white/10 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] backdrop-blur-3xl shadow-2xl relative">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 blur-[100px] rounded-full"></div>
        
        <div className="text-center mb-6 sm:mb-10 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl rotate-12 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
            <span className="text-black font-black text-3xl sm:text-4xl -rotate-12">🏦</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
            LEVICAN <span className="text-amber-500">EXPRESS</span>
          </h1>
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] mt-4 opacity-50">
            {isLogin ? 'LOGIN' : 'SIGN UP'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10 text-white"
              required
            />
          )}
          
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10 text-white"
            required
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10 text-white"
            required
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 py-2 rounded-xl">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 sm:py-5 rounded-2xl shadow-lg transition-all uppercase tracking-tighter italic text-lg sm:text-xl disabled:opacity-50 active:scale-95"
          >
            {loading ? '...' : (isLogin ? 'LOGIN' : 'SIGN UP')}
          </button>
        </form>

        <div className="mt-8 sm:mt-10 flex flex-col items-center space-y-4 relative z-10">
          <p className="text-center text-slate-500 text-[9px] font-black uppercase tracking-widest">
            {isLogin ? "No account?" : "Already have an account?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-amber-500 ml-2 hover:text-amber-300 transition-colors"
            >
              {isLogin ? 'Create one' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;