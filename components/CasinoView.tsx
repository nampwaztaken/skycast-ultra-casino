
import React, { useState, useEffect } from 'react';
import MinesGame from './MinesGame';
import PlinkoGame from './PlinkoGame';
import BlackjackGame from './BlackjackGame';
import PokerGame from './PokerGame';
import { CasinoGame } from '../types';
import { getCasinoFortune } from '../services/gemini';

interface Props {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  onExit: () => void;
}

const CasinoView: React.FC<Props> = ({ balance, setBalance, onExit }) => {
  const [fortune, setFortune] = useState("Welcome to the High Roller lounge.");
  const [activeGame, setActiveGame] = useState<CasinoGame>('LOBBY');

  const updateFortune = async (winAmount: number = 0) => {
    const msg = await getCasinoFortune(balance, winAmount);
    setFortune(msg);
  };

  useEffect(() => {
    updateFortune();
  }, []);

  const games = [
    { id: 'PLINKO', name: 'COSMIC PLINKO', desc: 'High variance gravity drops', icon: '☄️', color: 'from-pink-600 to-rose-900', seed: 'plinko' },
    { id: 'MINES', name: 'NEON MINES', desc: 'Find diamonds, avoid the blast', icon: '💣', color: 'from-green-600 to-emerald-900', seed: 'mines' },
    { id: 'BLACKJACK', name: 'BLACKJACK 21', desc: 'Beat the dealer to the edge', icon: '♠️', color: 'from-blue-700 to-indigo-900', seed: 'cards' },
    { id: 'POKER', name: 'VIDEO POKER', desc: 'Draw for the Royal Flush', icon: '🃏', color: 'from-red-600 to-orange-800', seed: 'poker' },
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
    <div className="bg-[#050508] min-h-screen text-white font-sans selection:bg-purple-500 pb-20">
      <nav className="border-b border-white/5 p-4 flex justify-between items-center sticky top-0 bg-[#050508]/90 backdrop-blur-xl z-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
          <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500">
            NEON NOIR
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-black/50 border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center space-x-3 shadow-2xl">
            <span className="text-yellow-500 drop-shadow-lg">🪙</span>
            <span className="text-yellow-400 font-black tabular-nums tracking-tight">{balance.toLocaleString()}</span>
          </div>
          <button onClick={onExit} className="text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
            Hide
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 mb-10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm"><span className="text-9xl">🎲</span></div>
          <h2 className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Live Table Insight</h2>
          <p className="text-2xl md:text-4xl font-black leading-tight max-w-3xl relative z-10 tracking-tight italic">
            "{fortune}"
          </p>
        </div>

        {activeGame === 'LOBBY' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div 
                key={game.id}
                onClick={() => setActiveGame(game.id as CasinoGame)}
                className={`group relative h-72 rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
              >
                <img src={`https://picsum.photos/seed/${game.seed}/800/600`} className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent p-8 flex flex-col justify-end`}>
                  <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500 origin-left">{game.icon}</div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase">{game.name}</h3>
                  <p className="text-gray-400 text-xs font-bold mt-1">{game.desc}</p>
                  <div className={`h-1 w-0 group-hover:w-full transition-all duration-700 mt-4 bg-gradient-to-r ${game.color}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setActiveGame('LOBBY')}
              className="mb-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-all font-black uppercase text-xs tracking-widest bg-white/5 px-4 py-2 rounded-full hover:bg-white/10"
            >
              <span>← Exit to Lobby</span>
            </button>
            <div className="flex justify-center">
              {renderGame()}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 w-full bg-black/80 backdrop-blur-md border-t border-white/5 py-3 overflow-hidden z-40">
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap space-x-12 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
          <span>BIG WIN: PLAYER_007 WON 5,400 🪙 ON MINES</span>
          <span>WHALE ALERT: 25,000 🪙 PLACED ON BLACKJACK</span>
          <span>JACKPOT: COSMIC PLINKO PAID OUT 12,000 🪙</span>
          <span>NEON NICK: "THE HOUSE NEVER SLEEPS, NEITHER SHOULD YOU"</span>
          <span>SYSTEM: RANDOM SEED VERIFIED FAIR</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default CasinoView;
