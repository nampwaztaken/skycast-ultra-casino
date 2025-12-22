
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { SystemConfig } from '../types';

interface Props {
  onClose: () => void;
}

const AdminTerminal: React.FC<Props> = ({ onClose }) => {
  const [stats, setStats] = useState({ userCount: 0, totalLiquidity: 0 });
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [targetVersion, setTargetVersion] = useState<number>(0);
  const [log, setLog] = useState<string[]>(["SYSTEM READY...", "AUTH_LEVEL: ROOT"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen to System Config
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SystemConfig;
        setConfig(data);
        setTargetVersion(data.minRequiredVersion);
      }
    });

    // Fetch Global Stats
    const fetchStats = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'casinousers'));
        let liquidity = 0;
        querySnapshot.forEach(doc => {
          liquidity += (doc.data().balance || 0);
        });
        setStats({
          userCount: querySnapshot.size,
          totalLiquidity: liquidity
        });
        addLog(`SCAN COMPLETE: FOUND ${querySnapshot.size} ACTIVE TERMINALS.`);
      } catch (err) {
        addLog("ERROR: STAT_FETCH_FAILURE");
      }
    };

    fetchStats();
    return () => unsubConfig();
  }, []);

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const handleUpdateVersion = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'system', 'config'), { minRequiredVersion: targetVersion }, { merge: true });
      addLog(`PROTOCOL UPDATE: V${targetVersion} IS NOW MANDATORY.`);
    } catch (err) {
      addLog("UPDATE FAILED: PERSISTENCE ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalReset = async () => {
    if (!window.confirm("CRITICAL: THIS WILL RESET ALL USER BALANCES TO 10,000. PROCEED?")) return;
    setLoading(true);
    addLog("INITIATING GLOBAL PORTFOLIO REBALANCE...");
    try {
      const querySnapshot = await getDocs(collection(db, 'casinousers'));
      const batch = writeBatch(db);
      querySnapshot.forEach((userDoc) => {
        batch.update(doc(db, 'casinousers', userDoc.id), { balance: 10000 });
      });
      await batch.commit();
      addLog(`SUCCESS: ${querySnapshot.size} ACCOUNTS NORMALIZED.`);
    } catch (err) {
      addLog("ERROR: BATCH_COMMIT_FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-6 md:p-12 overflow-hidden flex flex-col">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-4">
            <span className="animate-pulse">●</span> SYSTEM_CORE_MGMT
          </h1>
          <p className="text-[10px] opacity-50">LOCATION: CLOUD_FS_V9 // STATUS: SECURE</p>
        </div>
        <button onClick={onClose} className="hover:text-white transition-colors">[EXIT_TERMINAL]</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="border border-green-500/30 p-6 rounded-lg bg-green-500/5">
          <p className="text-[10px] uppercase mb-1 opacity-50">Active Users</p>
          <p className="text-3xl font-black">{stats.userCount.toLocaleString()}</p>
        </div>
        <div className="border border-green-500/30 p-6 rounded-lg bg-green-500/5">
          <p className="text-[10px] uppercase mb-1 opacity-50">System Liquidity</p>
          <p className="text-3xl font-black">Ł{stats.totalLiquidity.toLocaleString()}</p>
        </div>
        <div className="border border-green-500/30 p-6 rounded-lg bg-green-500/5">
          <p className="text-[10px] uppercase mb-1 opacity-50">Protocol Version</p>
          <p className="text-3xl font-black">v{config?.minRequiredVersion || '???'}</p>
        </div>
      </div>

      <div className="flex-1 border border-green-500/30 rounded-lg p-6 bg-green-950/10 mb-8 overflow-y-auto flex flex-col-reverse">
        {log.map((line, i) => (
          <p key={i} className="text-xs mb-1 font-medium">{line}</p>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] uppercase opacity-50 block">Push Security Patch</label>
          <div className="flex gap-4">
            <input 
              type="number" 
              value={targetVersion}
              onChange={e => setTargetVersion(parseInt(e.target.value))}
              className="bg-black border border-green-500/30 rounded px-4 py-2 text-green-500 flex-1"
            />
            <button 
              onClick={handleUpdateVersion}
              disabled={loading}
              className="bg-green-500 text-black font-black px-6 py-2 rounded hover:bg-green-400 transition-colors uppercase text-xs"
            >
              DEPLOY_PATCH
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase opacity-50 block">Global Asset Normalization</label>
          <button 
            onClick={handleGlobalReset}
            disabled={loading}
            className="w-full border-2 border-red-500 text-red-500 font-black px-6 py-2 rounded hover:bg-red-500 hover:text-black transition-all uppercase text-xs"
          >
            EXECUTE_RESET_10K
          </button>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-green-500/10 flex justify-between text-[8px] opacity-30">
        <p>ENCRYPTION: AES-256-GCM</p>
        <p>SESSION_EXPIRE: 3600S</p>
        <p>CLOUD_SYNC: ACTIVE</p>
      </div>
    </div>
  );
};

export default AdminTerminal;
