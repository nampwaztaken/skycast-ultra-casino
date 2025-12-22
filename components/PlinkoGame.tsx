
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;

// Punitive multipliers: Center zones are massive losses across all risk levels.
const MULTIPLIERS_16: Record<string, number[]> = {
  'High': [1000, 250, 50, 5, 1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 1, 5, 50, 250, 1000],
  'Medium': [110, 33, 8, 2, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.2, 0.3, 0.5, 2, 8, 33, 110],
  'Low': [10, 5, 2, 1.1, 0.8, 0.5, 0.3, 0.2, 0.2, 0.2, 0.3, 0.5, 0.8, 1.1, 2, 5, 10],
};

const getMultipliers = (rows: number, risk: typeof RISK_LEVELS[number]): number[] => {
  const base = MULTIPLIERS_16[risk];
  const count = rows + 1;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor((i / (count - 1)) * (base.length - 1));
    result.push(base[idx]);
  }
  return result;
};

const getBucketColor = (multiplier: number) => {
  if (multiplier >= 100) return 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)]';
  if (multiplier >= 10) return 'bg-orange-500 text-white';
  if (multiplier >= 2) return 'bg-amber-500 text-black';
  if (multiplier >= 1) return 'bg-emerald-500 text-black';
  if (multiplier >= 0.5) return 'bg-slate-700 text-slate-300';
  return 'bg-slate-800 text-slate-500 opacity-60';
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
  const [rows, setRows] = useState(16);
  const [risk, setRisk] = useState<typeof RISK_LEVELS[number]>('Medium');
  const ballCounter = useRef(0);
  const requestRef = useRef<number>(null);

  const multipliers = getMultipliers(rows, risk);

  const dropBall = () => {
    if (balance < bet || bet < 0.1) return;
    setBalance(prev => prev - bet);
    
    // Near-zero variance forces ball into the center-loss vortex
    const newBall: Ball = {
      id: ballCounter.current++,
      x: 50 + (Math.random() - 0.5) * 0.001,
      y: 0,
      vx: (Math.random() - 0.5) * 0.005,
      vy: 0.04
    };
    setBalls(prev => [...prev, newBall]);
  };

  const updatePhysics = () => {
    setBalls(currentBalls => {
      const nextBalls = currentBalls.map(ball => {
        let { x, y, vx, vy } = ball;
        const gravity = 0.0075; 
        const friction = 0.985;
        const bounce = 0.58;

        vy += gravity;
        x += vx;
        y += vy;
        vx *= friction;

        const verticalPadding = 12;
        const totalHeight = 85 - verticalPadding;
        const verticalGap = totalHeight / (rows + 1);
        
        for (let r = 0; r < rows; r++) {
          const rowY = verticalPadding + (r + 1) * verticalGap;
          const pegCount = r + 3;
          const pegSpacing = 4.2; 
          const rowWidth = (pegCount - 1) * pegSpacing;
          const startX = 50 - rowWidth / 2;

          if (Math.abs(y - rowY) < 1.0) {
            for (let p = 0; p < pegCount; p++) {
              const pegX = startX + p * pegSpacing;
              const dist = Math.sqrt((x - pegX) ** 2 + (y - rowY) ** 2);
              
              if (dist < 1.3) { 
                const angle = Math.atan2(y - rowY, x - pegX);
                const mag = Math.sqrt(vx * vx + vy * vy);
                const force = Math.max(mag * bounce, 0.2);
                
                vx = Math.cos(angle) * force + (Math.random() - 0.5) * 0.015;
                vy = Math.max(0.08, Math.sin(angle) * force + 0.05);
                x += Math.cos(angle) * 0.2;
                y += Math.sin(angle) * 0.2;
              }
            }
          }
        }

        if (x < 2) { x = 2; vx = Math.abs(vx) * 0.4; }
        if (x > 98) { x = 98; vx = -Math.abs(vx) * 0.4; }

        return { ...ball, x, y, vx, vy };
      });

      return nextBalls.filter(ball => {
        if (ball.y > 90) {
          const pegSpacing = 4.2;
          const lastPegCount = rows + 2;
          const lastRowWidth = (lastPegCount - 1) * pegSpacing;
          const startX = 50 - lastRowWidth / 2;
          const endX = 50 + lastRowWidth / 2;

          const clampedX = Math.max(startX, Math.min(endX, ball.x));
          const relativeX = (clampedX - startX) / lastRowWidth;
          const index = Math.min(multipliers.length - 1, Math.max(0, Math.floor(relativeX * multipliers.length)));
          
          const multiplier = multipliers[index];
          const win = Math.floor(bet * multiplier * 100) / 100;
          
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
  }, [rows, risk, bet]);

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-[#0b0e1b] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
      <div className="w-full lg:w-[320px] bg-black/40 p-8 flex flex-col gap-8 border-r border-white/5 shrink-0">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase text-[#7179a5] tracking-[0.2em]">Asset Allocation</label>
          <div className="flex items-center bg-[#141931] rounded-2xl border border-[#33395c] p-1.5 h-14">
            <span className="px-4 text-amber-500 font-black">Ł</span>
            <input 
              type="number"
              value={bet === 0 ? '' : bet}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setBet(isNaN(val) ? 0 : val);
              }}
              className="flex-1 bg-transparent border-none outline-none font-black text-white text-lg min-w-0"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase text-[#7179a5] tracking-[0.2em]">Risk Parameter</label>
          <div className="grid grid-cols-3 gap-1 bg-[#141931] p-1 rounded-2xl border border-[#33395c]">
            {RISK_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => setRisk(level)}
                className={`py-2 text-[10px] font-black rounded-xl transition-all ${risk === level ? 'bg-amber-500 text-black' : 'text-[#7179a5] hover:text-white'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-[#7179a5] tracking-[0.2em]">Complexity (Rows)</label>
            <span className="text-white font-black text-xs">{rows}</span>
          </div>
          <input 
            type="range" min="8" max="16" step="1" value={rows}
            onChange={e => setRows(parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <button 
          onClick={dropBall}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-6 rounded-2xl text-2xl uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all"
        >
          DEPLOY ASSET
        </button>
        
        <div className="mt-auto p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
          <p className="text-[8px] text-red-500 font-black uppercase tracking-widest text-center leading-relaxed">
            Market Volatility: CRITICAL<br/>
            Central Bias: ENABLED
          </p>
        </div>
      </div>

      <div className="flex-1 relative bg-[#050508] min-h-[700px] p-12 flex flex-col items-center justify-center">
        <div className="absolute inset-0 p-16 flex flex-col justify-between pointer-events-none opacity-20">
          {Array.from({ length: rows }).map((_, r) => {
            const count = r + 3;
            const pegSpacing = 4.2;
            const rowWidth = (count - 1) * pegSpacing;
            const startX = 50 - rowWidth / 2;
            const topPos = 12 + (r + 1) * ((85 - 12) / (rows + 1));
            return (
              <div key={r} className="absolute w-full h-2 left-0" style={{ top: `${topPos}%` }}>
                {Array.from({ length: count }).map((_, p) => (
                  <div 
                    key={p} 
                    className="absolute w-[4px] h-[4px] bg-slate-400 rounded-full"
                    style={{ left: `${startX + p * pegSpacing}%`, transform: 'translateX(-50%)' }}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {balls.map(ball => (
          <div 
            key={ball.id}
            className="absolute w-3.5 h-3.5 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)] z-20"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        <div className="absolute bottom-12 left-0 w-full px-16 flex justify-center z-10">
          <div className="flex gap-[2px] w-full max-w-[95%] justify-center">
            {multipliers.map((m, i) => (
              <div 
                key={i} 
                className={`flex-1 flex items-center justify-center h-12 rounded-lg ${getBucketColor(m)} font-black text-[9px] shadow-lg border-t border-white/10 transition-colors duration-500`}
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
