
import React, { useState } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

const MinesGame: React.FC<Props> = ({ balance, setBalance, onWin }) => {
  const [bet, setBet] = useState(25);
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState<('hidden' | 'diamond' | 'bomb')[]>(Array(25).fill('hidden'));
  const [mines, setMines] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER' | 'CASHED_OUT'>('IDLE');
  const [currentMultiplier, setCurrentMultiplier] = useState(1);

  const calculateMultiplier = (diamonds: number) => {
    let mult = 1;
    for (let i = 0; i < diamonds; i++) {
      mult *= (25 - i) / (25 - mineCount - i);
    }
    // Pure mathematical multiplier
    return mult;
  };

  const startGame = () => {
    if (balance < bet || bet < 0.1) return;
    setBalance(prev => prev - bet);
    const newMines: number[] = [];
    while (newMines.length < mineCount) {
      const r = Math.floor(Math.random() * 25);
      if (!newMines.includes(r)) newMines.push(r);
    }
    setMines(newMines);
    setGrid(Array(25).fill('hidden'));
    setGameState('PLAYING');
    setCurrentMultiplier(1);
  };

  const revealCell = (index: number) => {
    if (gameState !== 'PLAYING' || grid[index] !== 'hidden') return;
    
    // No force bomb logic - purely based on pre-set mine positions
    if (mines.includes(index)) {
      const newGrid = [...grid];
      mines.forEach(m => newGrid[m] = 'bomb');
      setGrid(newGrid);
      setGameState('GAMEOVER');
    } else {
      const newGrid = [...grid];
      newGrid[index] = 'diamond';
      setGrid(newGrid);
      const newDiamondsCount = newGrid.filter(c => c === 'diamond').length;
      setCurrentMultiplier(calculateMultiplier(newDiamondsCount));
    }
  };

  const cashOut = () => {
    if (gameState !== 'PLAYING') return;
    const win = Math.floor(bet * currentMultiplier);
    setBalance(prev => prev + win);
    onWin(win);
    setGameState('CASHED_OUT');
    const newGrid = [...grid];
    mines.forEach(m => newGrid[m] = 'bomb');
    setGrid(newGrid);
  };

  return (
    <div className="bg-[#0a0a10] border-2 border-green-500/20 rounded-[4rem] p-8 md:p-12 w-full max-w-4xl flex flex-col md:flex-row gap-8 md:gap-12 shadow-2xl relative overflow-hidden">
      <div className="w-full md:w-64 flex flex-col space-y-6 shrink-0">
        <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/60 mb-2 block">Amount to Bet</label>
          <input 
            type="number" 
            value={bet === 0 ? '' : bet} 
            onChange={e => {
              const val = parseFloat(e.target.value);
              setBet(isNaN(val) ? 0 : val);
            }} 
            disabled={gameState === 'PLAYING'} 
            className="w-full bg-transparent text-xl font-black text-white outline-none"
            placeholder="0"
          />
        </div>

        <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/60 mb-2 block">Mines: {mineCount}</label>
          <input 
            type="range" min="1" max="24" value={mineCount} 
            onChange={e => setMineCount(parseInt(e.target.value))} 
            disabled={gameState === 'PLAYING'} 
            className="w-full accent-green-500" 
          />
        </div>

        <div className="bg-black/60 p-6 rounded-3xl border border-white/5 text-center shadow-inner">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Potential Win</p>
          <p className="text-4xl font-black text-green-400 italic">{(bet * currentMultiplier).toFixed(0)}</p>
          <p className="text-[9px] text-white/20 mt-1 uppercase">{currentMultiplier.toFixed(2)}x</p>
        </div>

        <button 
          onClick={gameState === 'PLAYING' ? cashOut : startGame}
          className={`w-full py-6 rounded-3xl font-black text-2xl uppercase italic tracking-tighter transition-all active:scale-95 shadow-lg
            ${gameState === 'PLAYING' ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/40' : 'bg-white text-black hover:bg-green-400'}
          `}
        >
          {gameState === 'PLAYING' ? 'CASH OUT' : 'START GAME'}
        </button>
      </div>

      <div className="flex-1 bg-black/30 p-4 rounded-[2.5rem] shadow-inner border border-white/5 flex items-start">
        <div className="grid grid-cols-5 gap-2 w-full">
          {grid.map((cell, i) => (
            <button
              key={i}
              onClick={() => revealCell(i)}
              disabled={gameState !== 'PLAYING' && cell === 'hidden'}
              className={`
                aspect-square w-full rounded-xl flex items-center justify-center text-2xl md:text-3xl transition-colors duration-200
                ${cell === 'hidden' ? 'bg-[#1a1a25] hover:bg-[#252535] border border-white/5 shadow-md active:bg-[#303040]' : 'cursor-default'}
                ${cell === 'diamond' ? 'bg-green-500/20 border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}
                ${cell === 'bomb' ? 'bg-red-500/30 border border-red-500/40' : ''}
              `}
            >
              {cell === 'diamond' ? '💎' : cell === 'bomb' ? '💣' : ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
