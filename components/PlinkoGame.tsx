import React, { useState, useEffect, useRef } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;

const MULTIPLIERS: Record<string, number[]> = {
  'High': [100, 25, 10, 5, 2, 0.5, 0.2, 0.5, 2, 5, 10, 25, 100],
  'Medium': [20, 10, 5, 2, 1.2, 1, 0.5, 1, 1.2, 2, 5, 10, 20],
  'Low': [5, 3, 2, 1.5, 1.2, 1.1, 1, 1.1, 1.2, 1.5, 2, 3, 5],
};

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const PlinkoGame: React.FC<Props> = ({ balance, setBalance, onWin }) => {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState<typeof RISK_LEVELS[number]>('Medium');
  const ballCounter = useRef(0);
  const requestRef = useRef<number>(null);
  
  const ROWS = 12;
  const currentMultipliers = MULTIPLIERS[risk];

  const dropBall = () => {
    if (balance < bet) return;
    setBalance(prev => prev - bet);
    
    const newBall: Ball = {
      id: ballCounter.current++,
      x: 50 + (Math.random() - 0.5) * 1.5, // Center start
      y: 2,
      vx: (Math.random() - 0.5) * 0.1,
      vy: 0.5
    };
    setBalls(prev => [...prev, newBall]);
  };

  const updatePhysics = () => {
    setBalls(currentBalls => {
      const nextBalls = currentBalls.map(ball => {
        let { x, y, vx, vy } = ball;
        const gravity = 0.015;
        const bounce = 0.5;
        const friction = 0.99;

        vy += gravity;
        x += vx;
        y += vy;
        vx *= friction;

        // Collision logic with pegs
        for (let r = 0; r < ROWS; r++) {
          const rowY = 10 + r * 6.5;
          const pegCount = r + 3;
          const spacing = 6;
          const rowWidth = (pegCount - 1) * spacing;
          const startX = 50 - rowWidth / 2;

          if (Math.abs(y - rowY) < 1.2) {
            for (let p = 0; p < pegCount; p++) {
              const pegX = startX + p * spacing;
              const dist = Math.sqrt((x - pegX) ** 2 + (y - rowY) ** 2);
              
              if (dist < 1.5) {
                const angle = Math.atan2(y - rowY, x - pegX);
                const mag = Math.sqrt(vx * vx + vy * vy);
                vx = Math.cos(angle) * mag * bounce + (Math.random() - 0.5) * 0.2;
                vy = Math.abs(Math.sin(angle) * mag * bounce) + 0.1;
                x += vx * 2;
                y += vy * 2;
              }
            }
          }
        }

        // Walls
        if (x < 5) { x = 5; vx = Math.abs(vx) * 0.5; }
        if (x > 95) { x = 95; vx = -Math.abs(vx) * 0.5; }

        return { ...ball, x, y, vx, vy };
      });

      return nextBalls.filter(ball => {
        if (ball.y > 90) {
          const spacing = 6;
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
    if (m >= 10) return 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]';
    if (m >= 2) return 'bg-amber-500 text-black';
    if (m >= 1) return 'bg-emerald-500 text-black';
    return 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="flex flex-col w-full max-w-4xl bg-[#0b0e1b] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl mx-auto">
      {/* Top Control Bar for Mobile */}
      <div className="w-full bg-black/40 p-4 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-8 items-center border-b border-white/5">
        <div className="flex flex-row w-full sm:w-auto gap-4 flex-1">
          <div className="flex flex-col flex-1">
            <label className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Portfolio Stake</label>
            <input 
              type="number" 
              value={bet} 
              onChange={e => setBet(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-[#141931] border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-amber-500/50 w-full"
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Risk Profile</label>
            <select 
              value={risk} 
              onChange={e => setRisk(e.target.value as any)}
              className="bg-[#141931] border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none w-full appearance-none"
            >
              {RISK_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button 
          onClick={dropBall}
          className="w-full sm:w-48 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 sm:py-5 rounded-2xl text-xl uppercase italic tracking-tighter shadow-lg active:scale-95 transition-all"
        >
          DROP BALL
        </button>
      </div>

      {/* Physics Board Container */}
      <div className="relative w-full aspect-[4/5] sm:aspect-square bg-gradient-to-b from-black/40 to-transparent p-4 sm:p-10 overflow-hidden">
        {/* Pegs Layer */}
        <div className="absolute inset-0 pointer-events-none p-4 sm:p-10">
          {Array.from({ length: ROWS }).map((_, r) => {
            const pegCount = r + 3;
            const spacing = 6;
            const rowWidth = (pegCount - 1) * spacing;
            const startX = 50 - rowWidth / 2;
            const rowY = 10 + r * 6.5;

            return (
              <div key={r} className="absolute w-full" style={{ top: `${rowY}%` }}>
                {Array.from({ length: pegCount }).map((_, p) => (
                  <div 
                    key={p} 
                    className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-600 rounded-full"
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
            className="absolute w-2.5 h-2.5 sm:w-4 sm:h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)] z-20"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        {/* Buckets Layer */}
        <div className="absolute bottom-4 sm:bottom-10 left-0 w-full px-4 sm:px-10 flex justify-center">
          <div className="flex gap-1 w-full max-w-2xl justify-center">
            {currentMultipliers.map((m, i) => (
              <div 
                key={i} 
                className={`flex-1 flex items-center justify-center py-2 sm:py-3 rounded-lg font-black text-[7px] sm:text-xs transition-colors ${getBucketColor(m)}`}
              >
                {m}x
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlinkoGame;