
import React, { useState, useEffect } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍀', '🍇', '🍉', '🍌'];
// 50 sets of symbols to ensure a massive buffer for long transitions
const REEL_STRIP = Array(50).fill(SYMBOLS).flat();

const SlotMachine: React.FC<Props> = ({ balance, setBalance, onWin }) => {
  const [reelPositions, setReelPositions] = useState<number[]>([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState<boolean[]>([false, false, false]);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [bet, setBet] = useState(20);

  const spin = () => {
    if (balance < bet || isSpinning.some(s => s)) return;

    setBalance(prev => prev - bet);
    setLastResult(null);
    
    const newResults = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length)
    ];

    // Every spin moves us forward in the strip. We start from a base index % length
    // to keep the visual continuity without jumping back to 0.
    const currentBase = reelPositions.map(pos => pos % SYMBOLS.length);
    
    // Instantly snap to the base positions (invisible reset to beginning of strip)
    // before the long transition starts.
    setReelPositions(currentBase);
    setIsSpinning([true, true, true]);

    // Delay slightly to allow the snap above to register before the CSS transition kicks in
    setTimeout(() => {
      [0, 1, 2].forEach(i => {
        // We travel roughly 30-40 "rotations" down our 50-set strip
        const travelDistance = (35 + i * 3) * SYMBOLS.length;
        const targetPos = travelDistance + newResults[i];
        
        setReelPositions(prev => {
          const next = [...prev];
          next[i] = targetPos;
          return next;
        });

        setTimeout(() => {
          setIsSpinning(prev => {
            const next = [...prev];
            next[i] = false;
            return next;
          });

          if (i === 2) {
            setTimeout(() => checkWin(newResults), 500);
          }
        }, 3000 + i * 500);
      });
    }, 50);
  };

  const checkWin = (results: number[]) => {
    const s1 = SYMBOLS[results[0]];
    const s2 = SYMBOLS[results[1]];
    const s3 = SYMBOLS[results[2]];

    if (s1 === s2 && s2 === s3) {
      const win = s1 === '7️⃣' ? bet * 100 : bet * 25;
      setBalance(prev => prev + win);
      setLastResult(`JACKPOT! +${win}`);
      onWin(win);
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      const win = Math.floor(bet * 2.5);
      setBalance(prev => prev + win);
      setLastResult(`WIN! +${win}`);
      onWin(win);
    } else {
      setLastResult("Try Again");
    }
  };

  return (
    <div className="bg-[#0a0a12] border-2 border-purple-500/30 rounded-[3.5rem] p-8 md:p-12 flex flex-col items-center shadow-[0_0_100px_rgba(168,85,247,0.2)] relative overflow-hidden w-full max-w-2xl">
      <div className="flex space-x-3 md:space-x-6 mb-12 relative p-4 bg-black/80 rounded-[2.5rem] shadow-inner border border-white/5 w-full justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-20 h-40 md:w-32 md:h-56 bg-[#050508] border border-white/10 rounded-2xl relative overflow-hidden shadow-2xl">
            <div 
              className="absolute top-0 left-0 w-full flex flex-col items-center"
              style={{ 
                transform: `translateY(-${reelPositions[i] * 100}%)`,
                transition: isSpinning[i] 
                  ? `transform ${3 + i * 0.5}s cubic-bezier(0.1, 0, 0.1, 1)` 
                  : 'none',
                willChange: 'transform'
              }}
            >
              {REEL_STRIP.map((s, idx) => (
                <div key={idx} className="h-40 md:h-56 flex items-center justify-center text-5xl md:text-7xl shrink-0 select-none">
                  {s}
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-90 pointer-events-none"></div>
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-purple-500/30 -translate-y-1/2 pointer-events-none"></div>
          </div>
        ))}
      </div>

      <div className="h-20 flex items-center mb-10 text-center">
        {lastResult && (
          <p className={`text-3xl md:text-6xl font-black italic uppercase tracking-tighter ${lastResult.includes('WIN') ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-bounce' : 'text-gray-700'}`}>
            {lastResult}
          </p>
        )}
      </div>

      <div className="flex w-full max-w-sm space-x-4">
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase text-purple-400/60 mb-2 block tracking-[0.2em] px-2 text-center">Amount to Bet</label>
          <input 
            type="number"
            value={bet}
            onChange={(e) => setBet(Math.max(1, parseInt(e.target.value) || 0))}
            disabled={isSpinning.some(s => s)}
            className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 px-6 text-xl font-black text-white outline-none focus:border-purple-500/50 text-center"
          />
        </div>
        <button
          disabled={isSpinning.some(s => s) || balance < bet}
          onClick={spin}
          className={`flex-[2] py-5 rounded-2xl font-black text-2xl md:text-3xl italic tracking-tighter transition-all transform active:scale-95 mt-6
            ${isSpinning.some(s => s) ? 'bg-gray-800 text-gray-600' : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-lg hover:-translate-y-1'}
          `}
        >
          {isSpinning.some(s => s) ? '...' : 'SPIN'}
        </button>
      </div>
    </div>
  );
};

export default SlotMachine;
