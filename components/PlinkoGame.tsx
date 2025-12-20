
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;

const MULTIPLIERS_16: Record<string, number[]> = {
  'High': [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  'Medium': [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  'Low': [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
};

const getMultipliers = (rows: number, risk: typeof RISK_LEVELS[number]): number[] => {
  const base = MULTIPLIERS_16[risk];
  const count = rows + 1;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor((i / count) * base.length);
    result.push(base[idx]);
  }
  return result;
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
    if (balance < bet) return;
    setBalance(prev => prev - bet);
    
    const newBall: Ball = {
      id: ballCounter.current++,
      x: 50 + (Math.random() - 0.5) * 0.05,
      y: 0,
      vx: (Math.random() - 0.5) * 0.02,
      vy: 0.05
    };
    setBalls(prev => [...prev, newBall]);
  };

  const updatePhysics = () => {
    setBalls(currentBalls => {
      const nextBalls = currentBalls.map(ball => {
        let { x, y, vx, vy } = ball;
        const gravity = 0.005; 
        const friction = 0.999;
        const bounce = 0.85; 

        vy += gravity;
        x += vx;
        y += vy;
        vx *= friction;

        const verticalPadding = 8;
        const totalHeight = 100 - verticalPadding * 2.5;
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
              
              if (dist < 1.4) { 
                const angle = Math.atan2(y - rowY, x - pegX);
                const mag = Math.sqrt(vx * vx + vy * vy);
                const force = Math.max(mag * bounce, 0.4);
                
                vx = Math.cos(angle) * force + (Math.random() - 0.5) * 0.08;
                vy = Math.max(0.1, Math.sin(angle) * force + 0.1);
                x += Math.cos(angle) * 0.4;
                y += Math.sin(angle) * 0.4;
              }
            }
          }
        }

        // UNBREAKABLE WALLS
        if (x < 2) { x = 2; vx = Math.abs(vx) * 0.5 + 0.05; }
        if (x > 98) { x = 98; vx = -Math.abs(vx) * 0.5 - 0.05; }

        return { ...ball, x, y, vx, vy };
      });

      return nextBalls.filter(ball => {
        if (ball.y > 90) {
          const pegSpacing = 4.2;
          const lastPegCount = rows + 2;
          const lastRowWidth = (lastPegCount - 1) * pegSpacing;
          const startX = 50 - lastRowWidth / 2;
          const endX = 50 + lastRowWidth / 2;

          // Clamping X to ensure it lands in a bucket
          const clampedX = Math.max(startX, Math.min(endX, ball.x));
          const relativeX = (clampedX - startX) / lastRowWidth;
          const index = Math.min(multipliers.length - 1, Math.max(0, Math.floor(relativeX * multipliers.length)));
          
          const multiplier = multipliers[index];
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
  }, [rows, risk, bet]);

  const handleBetChange = (val: number) => {
    setBet(Math.max(0.1, Math.round(val * 100) / 100));
  };

  const getBucketColor = (mult: number) => {
    if (mult >= 50) return 'bg-[#ff003c]'; 
    if (mult >= 10) return 'bg-[#ff4100]'; 
    if (mult >= 2) return 'bg-[#ff8c00]'; 
    if (mult >= 1.2) return 'bg-[#ffc100]'; 
    if (mult >= 1) return 'bg-[#f0ff00]'; 
    return 'bg-[#2a2f45]'; 
  };

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-[#141931] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
      <div className="w-full lg:w-[320px] bg-[#0b0e1b] p-8 flex flex-col gap-8 border-r border-white/5 shrink-0">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase text-[#7179a5] tracking-[0.2em]">Bet Amount</label>
          <div className="flex items-center bg-[#141931] rounded-2xl border border-[#33395c] p-1.5 h-14">
            <span className="px-4 text-[#7DD934] font-black">$</span>
            <input 
              type="number"
              value={bet}
              onChange={e => handleBetChange(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-transparent border-none outline-none font-black text-white text-lg min-w-0"
            />
            <div className="flex gap-1 pr-1">
              <button onClick={() => handleBetChange(bet / 2)} className="px-3 py-1.5 bg-[#262c50] hover:bg-[#323a6b] rounded-xl text-[10px] font-black text-white transition-all">1/2</button>
              <button onClick={() => handleBetChange(bet * 2)} className="px-3 py-1.5 bg-[#262c50] hover:bg-[#323a6b] rounded-xl text-[10px] font-black text-white transition-all">2x</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase text-[#7179a5] tracking-[0.2em]">Risk</label>
          <div className="grid grid-cols-3 gap-1 bg-[#141931] p-1 rounded-2xl border border-[#33395c]">
            {RISK_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => setRisk(level)}
                className={`py-2 text-[10px] font-black rounded-xl transition-all ${risk === level ? 'bg-[#2a2f45] text-white' : 'text-[#7179a5] hover:text-white'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-[#7179a5] tracking-[0.2em]">Rows</label>
            <span className="text-white font-black text-xs">{rows}</span>
          </div>
          <input 
            type="range" min="8" max="16" step="1" value={rows}
            onChange={e => setRows(parseInt(e.target.value))}
            className="w-full accent-[#7DD934]"
          />
        </div>

        <button 
          onClick={dropBall}
          className="w-full bg-[#7DD934] hover:bg-[#8ee645] text-[#013500] font-black py-6 rounded-2xl text-2xl uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all"
        >
          Drop Ball
        </button>
      </div>

      <div className="flex-1 relative bg-[#0b0e1b] min-h-[750px] p-12 flex flex-col items-center justify-center">
        <div className="absolute inset-0 p-16 flex flex-col justify-between pointer-events-none opacity-20">
          {Array.from({ length: rows }).map((_, r) => {
            const count = r + 3;
            const pegSpacing = 4.2;
            const rowWidth = (count - 1) * pegSpacing;
            const startX = 50 - rowWidth / 2;
            const topPos = 8 + (r + 1) * ((100 - 18) / (rows + 1));
            return (
              <div key={r} className="absolute w-full h-2 left-0" style={{ top: `${topPos}%` }}>
                {Array.from({ length: count }).map((_, p) => (
                  <div 
                    key={p} 
                    className="absolute w-[5px] h-[5px] bg-white rounded-full shadow-[0_0_10px_white]"
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
            className="absolute w-4 h-4 bg-[#ff2525] rounded-full shadow-[0_0_20px_#ff2525] z-20 border border-white/50"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        <div className="absolute bottom-12 left-0 w-full px-16 flex justify-center z-10">
          <div className="flex gap-[2px] w-full max-w-[90%] justify-center">
            {multipliers.map((m, i) => (
              <div 
                key={i} 
                className={`flex-1 flex items-center justify-center h-10 rounded-md ${getBucketColor(m)} text-black font-black text-[9px] shadow-xl border-t border-white/20`}
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
