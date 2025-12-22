import React, { useState } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

type Card = { suit: string, rank: string, value: number };
const SUITS = ['♠️', '♥️', '♣️', '♦️'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const createDeck = () => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      deck.push({ suit, rank: RANKS[i], value: i + 2 });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const PokerGame: React.FC<Props> = ({ balance, setBalance, onWin }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [holds, setHolds] = useState<boolean[]>([false, false, false, false, false]);
  const [gameState, setGameState] = useState<'IDLE' | 'DEALT' | 'RESULT'>('IDLE');
  const [result, setResult] = useState('');
  const [bet, setBet] = useState<number>(25);

  const deal = () => {
    if (balance < bet || bet <= 0) return;
    setBalance(prev => prev - bet);
    const newDeck = createDeck();
    const newHand = [newDeck.pop()!, newDeck.pop()!, newDeck.pop()!, newDeck.pop()!, newDeck.pop()!];
    setHand(newHand);
    setDeck(newDeck);
    setHolds([false, false, false, false, false]);
    setGameState('DEALT');
    setResult('');
  };

  const draw = () => {
    const newDeck = [...deck];
    const newHand = hand.map((card, i) => holds[i] ? card : newDeck.pop()!);
    setHand(newHand);
    setGameState('RESULT');
    evaluateHand(newHand);
  };

  const toggleHold = (i: number) => {
    if (gameState !== 'DEALT') return;
    const newHolds = [...holds];
    newHolds[i] = !newHolds[i];
    setHolds(newHolds);
  };

  const evaluateHand = (h: Card[]) => {
    const values = h.map(c => c.value).sort((a,b) => a-b);
    const suits = h.map(c => c.suit);
    const valueCounts: Record<number, number> = {};
    values.forEach(v => valueCounts[v] = (valueCounts[v] || 0) + 1);
    const counts = Object.values(valueCounts).sort((a,b) => b-a);

    const isFlush = new Set(suits).size === 1;
    const isStraight = values.every((v, i) => i === 0 || v === values[i-1] + 1);
    
    let winMult = 0;
    let name = 'No Hand';

    if (isFlush && isStraight && values[0] === 10) { winMult = 250; name = 'ROYAL FLUSH'; }
    else if (isFlush && isStraight) { winMult = 50; name = 'STRAIGHT FLUSH'; }
    else if (counts[0] === 4) { winMult = 25; name = 'FOUR OF A KIND'; }
    else if (counts[0] === 3 && counts[1] === 2) { winMult = 9; name = 'FULL HOUSE'; }
    else if (isFlush) { winMult = 6; name = 'FLUSH'; }
    else if (isStraight) { winMult = 4; name = 'STRAIGHT'; }
    else if (counts[0] === 3) { winMult = 3; name = 'THREE OF A KIND'; }
    else if (counts[0] === 2 && counts[1] === 2) { winMult = 2; name = 'TWO PAIR'; }
    else if (counts[0] === 2) {
      const pairValEntry = Object.entries(valueCounts).find(([k,v]) => v === 2);
      if (pairValEntry) {
        const pairVal = parseInt(pairValEntry[0]);
        if (pairVal >= 11) { winMult = 1; name = 'JACKS OR BETTER'; }
      }
    }

    if (winMult > 0) {
      const win = bet * winMult;
      setBalance(prev => prev + win);
      setResult(`${name}!`);
      onWin(win);
    } else {
      setResult('Loss');
    }
  };

  return (
    <div className="bg-[#0a0a0f] border border-red-500/10 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 w-full max-w-3xl shadow-2xl flex flex-col items-center">
      <div className="flex justify-between items-center mb-8 w-full">
        <h3 className="text-sm sm:text-xl font-black text-red-500 italic uppercase">Digital Poker</h3>
        <div className="flex flex-col items-end">
          <input 
            type="number" 
            value={bet === 0 ? '' : bet} 
            onChange={e => {
              const val = parseInt(e.target.value);
              setBet(isNaN(val) ? 0 : val);
            }}
            disabled={gameState === 'DEALT'}
            className="w-20 sm:w-24 bg-black/40 border border-red-500/20 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-base sm:text-lg text-red-400 font-black outline-none"
          />
        </div>
      </div>

      <div className="flex space-x-1 sm:space-x-3 mb-8 justify-center w-full">
        {(hand.length > 0 ? hand : Array(5).fill(null)).map((c, i) => (
          <div 
            key={i} 
            onClick={() => c && toggleHold(i)}
            className={`
              flex-1 aspect-[2/3] max-w-[100px] rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-lg sm:text-3xl font-bold cursor-pointer transition-all
              ${holds[i] ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105' : (c ? 'bg-white text-black' : 'bg-gray-900/50 border border-white/5')}
            `}
          >
            {c ? (
              <>
                <span className="text-[6px] sm:text-[8px] uppercase mb-0.5 sm:mb-1 font-black opacity-40">{holds[i] ? 'HELD' : ''}</span>
                <span className="leading-none">{c.rank}</span>
                <span className="text-xl sm:text-3xl mt-1">{c.suit}</span>
              </>
            ) : (
              <span className="text-white/10 text-2xl">🎴</span>
            )}
          </div>
        ))}
      </div>

      <div className="text-center h-8 sm:h-10 mb-6 sm:mb-8">
        <p className="text-xl sm:text-3xl font-black italic tracking-tighter text-yellow-400 uppercase drop-shadow-lg">{result}</p>
      </div>

      <div className="flex justify-center w-full max-w-sm">
        {gameState === 'IDLE' || gameState === 'RESULT' ? (
          <button 
            onClick={deal}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-xl transition-all uppercase italic tracking-tighter text-xl sm:text-2xl"
          >
            Deal Hand
          </button>
        ) : (
          <button 
            onClick={draw}
            className="w-full bg-white text-black font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-all uppercase italic tracking-tighter text-xl sm:text-2xl"
          >
            Draw Cards
          </button>
        )}
      </div>
    </div>
  );
};

export default PokerGame;