import React, { useState, useEffect } from 'react';
import MinesGame from './MinesGame';
import PlinkoGame from './PlinkoGame';
import BlackjackGame from './BlackjackGame';
import PokerGame from './PokerGame';
import { CasinoGame } from '../types';
import { getCasinoFortune } from '../services/gemini';
import { auth } from '../services/firebase';

interface Props {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  onExit: () => void;
}

const CasinoView: React.FC<Props> = ({ balance, setBalance, onExit }) => {
  const [fortune, setFortune] = useState("Synchronizing with wealth protocols...");
  const [activeGame, setActiveGame] = useState<CasinoGame>('LOBBY');
  const user = auth.currentUser;

  const updateFortune = async (winAmount: number = 0) => {
    const msg = await getCasinoFortune(balance, winAmount);
    setFortune(msg);
  };

  useEffect(() => {
    updateFortune();
  }, []);

  const games = [
    { id: 'PLINKO', name: 'PLINKO', desc: 'Exponential physics-based yield generation', icon: '☄️', color: 'from-amber-600 to-amber-900', seed: 'wealth-drop' },
    { id: 'MINES', name: 'MINES', desc: 'Strategic high-risk asset recovery ops', icon: '💣', color: 'from-emerald-600 to-emerald-950', seed: 'wealth-mine' },
    { id: 'BLACKJACK', name: 'BLACKJACK', desc: 'Precision decision card-based arbitration', icon: '♠️', color: 'from-slate-700 to-slate-950', seed: 'wealth-21' },
    { id: 'POKER', name: 'ONLINE POKER', desc: 'Ultimate deck verification and strategy', icon: '🃏', color: 'from-rose-600 to-rose-950', seed: 'wealth-holdem' },
  ] as const;

  const renderGame = () => {
    switch (activeGame) {
      case 'MINES': return <MinesGame balance={balance} setBalance={setBalance} onWin={updateFortune} />;
      case 'PLINKO': return <PlinkoGame balance={balance} setBalance={setBalance} onWin={updateFortune} />;
      case 'BLACKJACK': return <BlackjackGame balance={balance} setBalance={setBalance} onWin={updateFortune} />;
      case 'POKER': return <PokerGame balance={balance} setBalance={setBalance} onWin={updateFortune} />;
      default: return null;
    }
  };

  return (
    <div className="bg-[#050508] min-h-screen text-white font-sans selection:bg-amber-500 pb-20">
      <nav className="border-b border-white/5 p-6 flex justify-between items-center sticky top-0 bg-[#050508]/90 backdrop-blur-xl z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            <span className="text-black font-black -rotate-45">$</span>
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">
            FUN MONEY MAKING <span className="text-amber-500 italic">WEBSITE</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Portfolio Holder</span>
            <span className="text-xs font-bold text-white">{user?.displayName || "Elite User"}</span>
          </div>
          
          <div className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-2xl flex items-center space-x-4 shadow-2xl">
            <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">Money</span>
            <span className="text-white font-black tabular-nums tracking-tight text-xl">Ł{balance.toLocaleString()}</span>
          </div>
          
          <button 
            onClick={onExit}
            className="group flex items-center space-x-2"
          >
            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
              <span className="text-xs">🚪</span>
            </span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-gradient-to-r from-slate-900 via-black to-slate-900 rounded-[3.5rem] p-12 mb-12 border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] blur-sm"><span className="text-[12rem]">🏦</span></div>
          <h2 className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.6em] mb-6">Real-Time Market Insight</h2>
          <p className="text-2xl md:text-5xl font-black leading-tight max-w-4xl relative z-10 tracking-tight italic">
            "{fortune}"
          </p>
        </div>

        {activeGame === 'LOBBY' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {games.map((game) => (
              <div 
                key={game.id}
                onClick={() => setActiveGame(game.id as CasinoGame)}
                className={`group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer border border-white/5 transition-all hover:scale-[1.03] hover:shadow-[0_40px_80px_rgba(0,0,0,0.9)]`}
              >
                <img src={`https://picsum.photos/seed/${game.seed}/800/1200`} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-1000 scale-110 group-hover:scale-100" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end`}>
                  <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-700 origin-left drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{game.icon}</div>
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-3 text-white">{game.name}</h3>
                  <p className="text-slate-400 text-xs font-bold mb-8 leading-relaxed tracking-wide opacity-80">{game.desc}</p>
                  <div className={`h-2 w-0 group-hover:w-full transition-all duration-1000 bg-gradient-to-r ${game.color} rounded-full`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <button 
              onClick={() => setActiveGame('LOBBY')}
              className="mb-12 flex items-center space-x-4 text-slate-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.3em] bg-white/5 px-8 py-4 rounded-[1.5rem] hover:bg-white/10 border border-white/5 group shadow-xl"
            >
              <span className="text-amber-500 group-hover:-translate-x-2 transition-transform">←</span> <span>Return to Main Dashboard</span>
            </button>
            <div className="flex justify-center perspective-1000">
              {renderGame()}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 w-full bg-black/90 backdrop-blur-3xl border-t border-white/5 py-5 overflow-hidden z-40">
        <div className="flex animate-[marquee_50s_linear_infinite] whitespace-nowrap space-x-24 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
          <span className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-4 shadow-[0_0_10px_#f59e0b]"></span>YIELD: PORTFOLIO_777 SECURED 85,000 ON GRAVITY WEALTH</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-4 shadow-[0_0_10px_#f59e0b]"></span>COMPLIANCE: ALL TRANSACTION ARBITRATION RESOLVED IN REAL-TIME</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-4 shadow-[0_0_10px_#f59e0b]"></span>MARKET ALERT: LIQUIDITY INJECTION DETECTED IN ELITE 21 SUITE</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-4 shadow-[0_0_10px_#f59e0b]"></span>SUCCESS: FUN MONEY MAKING WEBSITE IS OPERATING AT PEAK EFFICIENCY</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default CasinoView;