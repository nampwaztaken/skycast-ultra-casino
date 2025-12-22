import React, { useState, useEffect, useRef } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;

// Significantly harder multipliers: Center zones are now deep losses (0.1x, 0.2x)
// High: 1000x at edges, but 0.1x and 0.2x in the center.
const MULTIPLIERS: Record<string, number[]> = {
  'High': [1000, 120, 35, 12, 5, 1, 0.2, 0.1, 0.1, 0.2, 1, 5, 12, 35, 120, 1000],
  'Medium': [45, 18, 7, 3, 1.5, 1, 0.6, 0.4, 0.4, 0.6, 1, 1.5, 3, 7, 18, 45],
  'Low': [5, 3, 2, 1.4, 1.2, 1.1, 1, 0.8, 0.8, 1, 1.1, 1.2, 1.4, 2, 3, 5],
};

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const PlinkoGame: React.FC<Props> = ({ balance, setBalance, onWin }) => {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bet, setBet] = useState<number>(10);
  const [risk, setRisk] = useState<typeof RISK_LEVELS[number]>('Medium');
  const ballCounter = useRef(0);
  const requestRef = useRef<number>(null);
  
  // Increased rows from 12 to 16 for more complexity and harder predictability
  const ROWS = 16;
  const currentMultipliers = MULTIPLIERS[risk];

  const dropBall = () => {
    if (balance < bet || bet <= 0) return;
    setBalance(prev => prev - bet);
    
    const newBall: Ball = {
      id: ballCounter.current++,
      x: 50 + (Math.random() - 0.5) * 1.0, // Tighter center start
      y: 1,
      vx: (Math.random() - 0.5) * 0.15,
      vy: 0.4,
      color: risk === 'High' ? '#f43f5e' : risk === 'Medium' ? '#f59e0b' : '#10b981'
    };
    setBalls(prev => [...prev, newBall]);
  };

  const updatePhysics = () => {
    setBalls(currentBalls => {
      const nextBalls = currentBalls.map(ball => {
        let { x, y, vx, vy } = ball;
        const gravity = 0.012; // Adjusted gravity for better feel with more rows
        const bounce = 0.45; // Slightly lower bounce to make edge-hitting harder
        const friction = 0.992;

        vy += gravity;
        x += vx;
        y += vy;
        vx *= friction;

        // Collision logic with pegs
        for (let r = 0; r < ROWS; r++) {
          const rowY = 8 + r * 5.2; // Adjusted spacing for more rows
          const pegCount = r + 3;
          const spacing = 5.2; // Tighter spacing
          const rowWidth = (pegCount - 1) * spacing;
          const startX = 50 - rowWidth / 2;

          if (Math.abs(y - rowY) < 1.0) {
            for (let p = 0; p < pegCount; p++) {
              const pegX = startX + p * spacing;
              const dist = Math.sqrt((x - pegX) ** 2 + (y - rowY) ** 2);
              
              if (dist < 1.2) {
                const angle = Math.atan2(y - rowY, x - pegX);
                const mag = Math.sqrt(vx * vx + vy * vy);
                // Increased randomness in bounce to make the "lucky" paths rarer
                vx = Math.cos(angle) * mag * bounce + (Math.random() - 0.5) * 0.25;
                vy = Math.abs(Math.sin(angle) * mag * bounce) + 0.1;
                x += vx * 1.5;
                y += vy * 1.5;
              }
            }
          }
        }

        // Hard Boundaries
        if (x < 3) { x = 3; vx = Math.abs(vx) * 0.6; }
        if (x > 97) { x = 97; vx = -Math.abs(vx) * 0.6; }

        return { ...ball, x, y, vx, vy };
      });

      return nextBalls.filter(ball => {
        if (ball.y > 92) {
          const spacing = 5.2;
          const lastPegCount = ROWS + 2;
          const rowWidth = (lastPegCount - 1) * spacing;
          const startX = 50 - rowWidth / 2;
          
          const relativeX = (ball.x - startX) / rowWidth;
          const index = Math.min(currentMultipliers.length - 1, Math.max(0, Math.floor(relativeX * currentMultipliers.length)));
          
          const multiplier = currentMultipliers[index];
          const win = Math.floor(bet * multiplier);
          
          if (win > 0) {
            setBalance(prev => prev + win);
            onWin(win);
          }
          return false;
        }
        return true;
      });
    });
    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [risk, bet]);

  const getBucketColor = (m: number) => {
    if (m >= 100) return 'bg-rose-600 text-white shadow-[0_0_15px_#e11d48] animate-pulse';
    if (m >= 10) return 'bg-rose-500 text-white';
    if (m >= 2) return 'bg-amber-500 text-black';
    if (m >= 1) return 'bg-emerald-500 text-black';
    if (m < 0.5) return 'bg-slate-900 text-slate-600 opacity-60';
    return 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="flex flex-col w-full max-w-5xl bg-[#0b0e1b] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl mx-auto">
      {/* Control Panel */}
      <div className="w-full bg-black/40 p-4 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-8 items-center border-b border-white/5">
        <div className="flex flex-row w-full sm:w-auto gap-4 flex-1">
          <div className="flex flex-col flex-1">
            <label className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Portfolio Stake</label>
            <div className="relative">
              <input 
                type="number" 
                value={bet === 0 ? '' : bet} 
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setBet(isNaN(val) ? 0 : val);
                }}
                className="bg-[#141931] border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-amber-500/50 w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 font-black text-[10px]">Ł</span>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Risk Profile</label>
            <div className="relative">
              <select 
                value={risk} 
                onChange={e => setRisk(e.target.value as any)}
                className="bg-[#141931] border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none w-full appearance-none cursor-pointer"
              >
                {RISK_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]">▼</div>
            </div>
          </div>
        </div>
        <button 
          onClick={dropBall}
          className={`w-full sm:w-56 text-black font-black py-4 sm:py-5 rounded-2xl text-xl uppercase italic tracking-tighter shadow-lg active:scale-95 transition-all
            ${risk === 'High' ? 'bg-rose-500 hover:bg-rose-400' : risk === 'Medium' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}
          `}
        >
          DEPLOY ASSET
        </button>
      </div>

      {/* Game Board */}
      <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-6 overflow-hidden">
        {/* Statistics Overlay */}
        <div className="absolute top-4 left-6 z-30 pointer-events-none">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Volatility Model: {risk.toUpperCase()}</p>
        </div>

        {/* Pegs Layer */}
        <div className="absolute inset-0 pointer-events-none p-4 sm:p-6">
          {Array.from({ length: ROWS }).map((_, r) => {
            const pegCount = r + 3;
            const spacing = 5.2;
            const rowWidth = (pegCount - 1) * spacing;
            const startX = 50 - rowWidth / 2;
            const rowY = 8 + r * 5.2;

            return (
              <div key={r} className="absolute w-full" style={{ top: `${rowY}%` }}>
                {Array.from({ length: pegCount }).map((_, p) => (
                  <div 
                    key={p} 
                    className="absolute w-1 h-1 bg-slate-700/50 rounded-full"
                    style={{ left: `${startX + p * spacing}%`, transform: 'translateX(-50%)' }}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Balls Layer */}
        {balls.map(ball => (
          <div 
            key={ball.id}
            className="absolute w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full z-20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            style={{ 
              left: `${ball.x}%`, 
              top: `${ball.y}%`, 
              transform: 'translate(-50%, -50%)',
              backgroundColor: ball.color
            }}
          />
        ))}

        {/* Buckets Layer */}
        <div className="absolute bottom-4 left-0 w-full px-4 sm:px-6 flex justify-center">
          <div className="flex gap-1 w-full max-w-4xl justify-center">
            {currentMultipliers.map((m, i) => (
              <div 
                key={i} 
                className={`flex-1 flex flex-col items-center justify-center py-2 sm:py-3 rounded-lg font-black transition-all duration-300 border border-white/5 ${getBucketColor(m)}`}
              >
                <span className="text-[7px] sm:text-[9px] scale-90">{m}x</span>
                {m >= 100 && <span className="text-[6px] absolute -top-4 animate-bounce">🔥</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="bg-black/80 px-8 py-3 text-center border-t border-white/5">
        <p className="text-[8px] font-bold text-slate-700 uppercase tracking-[0.4em]">High-probability landing zones are configured for maximum house edge. Proceed with caution.</p>
      </div>
    </div>
  );
};

export default PlinkoGame;