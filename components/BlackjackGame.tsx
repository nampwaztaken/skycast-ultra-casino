
import React, { useState, useEffect } from 'react';

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onWin: (amt: number) => void;
}

type Card = { suit: string, rank: string, value: number, id: string };
const SUITS = ['♠️', '♥️', '♣️', '♦️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = () => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = parseInt(rank) || 10;
      if (rank === 'A') value = 11;
      deck.push({ suit, rank, value, id: Math.random().toString(36) });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateHand = (hand: Card[]) => {
  let total = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter(c => c.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};

const AnimatedCard: React.FC<{ card: Card, hidden?: boolean, delay: number }> = ({ card, hidden, delay }) => (
  <div 
    className="relative w-20 h-28 md:w-24 md:h-32 transition-all duration-700 ease-out animate-card-slide"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ${hidden ? '' : 'rotate-y-180'}`}>
      <div className="absolute inset-0 bg-blue-900 rounded-xl border-2 border-blue-400 flex items-center justify-center backface-hidden shadow-xl">
        <span className="text-4xl opacity-20">🎴</span>
      </div>
      <div className="absolute inset-0 bg-white rounded-xl border-2 border-gray-200 rotate-y-180 backface-hidden flex flex-col p-2 text-black shadow-2xl">
        <span className="font-black text-xs">{card.rank}</span>
        <span className="text-3xl self-center my-auto">{card.suit}</span>
        <span className="font-black text-xs self-end rotate-180">{card.rank}</span>
      </div>
    </div>
  </div>
);

const BlackjackGame: React.FC<Props> = ({ balance, setBalance, onWin }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'DEALER_TURN' | 'ENDED'>('IDLE');
  const [message, setMessage] = useState('');
  const [bet, setBet] = useState(100);

  const startNewGame = async () => {
    if (balance < bet || bet < 1) return;
    setBalance(prev => prev - bet);
    const newDeck = createDeck();
    setPlayerHand([]);
    setDealerHand([]);
    setGameState('PLAYING');
    setMessage('');

    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    setPlayerHand([p1]);
    await new Promise(r => setTimeout(r, 400));
    setDealerHand([d1]);
    await new Promise(r => setTimeout(r, 400));
    setPlayerHand([p1, p2]);
    await new Promise(r => setTimeout(r, 400));
    setDealerHand([d1, d2]);
    setDeck(newDeck);
  };

  const hit = () => {
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);
    if (calculateHand(newHand) > 21) {
      setGameState('ENDED');
      setMessage('BUSTED!');
    }
  };

  const stand = () => setGameState('DEALER_TURN');

  useEffect(() => {
    if (gameState === 'DEALER_TURN') {
      const dealerLogic = async () => {
        let h = [...dealerHand];
        let d = [...deck];

        while (calculateHand(h) < 17) {
          // Pure fair draw logic
          const card = d.pop()!;
          h.push(card);
          setDealerHand([...h]);
          await new Promise(r => setTimeout(r, 800));
        }
        
        const ps = calculateHand(playerHand);
        const ds = calculateHand(h);
        setGameState('ENDED');
        if (ds > 21 || ps > ds) {
          const win = ps === 21 && playerHand.length === 2 ? Math.floor(bet * 2.5) : bet * 2;
          setBalance(prev => prev + win);
          setMessage('WINNER!');
          onWin(win);
        } else if (ds > ps) setMessage('DEALER WINS');
        else {
          setBalance(prev => prev + bet);
          setMessage('PUSH');
        }
      };
      dealerLogic();
    }
  }, [gameState]);

  return (
    <div className="bg-[#0a0a10] border-2 border-blue-500/10 rounded-[4rem] p-10 w-full max-w-2xl shadow-2xl flex flex-col items-center relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-48 h-64 bg-blue-900/10 rounded-[3rem] border border-blue-400/5 rotate-[25deg] flex items-center justify-center -z-0">
        <span className="text-white opacity-5 font-black italic tracking-tighter text-3xl mt-12">SHOE</span>
      </div>

      <div className="w-full flex justify-between mb-12 relative z-10">
        <div className="flex -space-x-12">
          {dealerHand.map((c, i) => (
            <AnimatedCard key={c.id} card={c} delay={i * 200} hidden={gameState === 'PLAYING' && i === 1} />
          ))}
        </div>
        <div className="text-right flex flex-col justify-center pr-6">
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] text-blue-400 mb-1">Dealer</p>
          <p className="text-5xl font-black text-blue-100">{gameState === 'PLAYING' ? '?' : calculateHand(dealerHand)}</p>
        </div>
      </div>

      <div className="h-16 flex items-center justify-center my-6 text-center">
        <p className="text-4xl font-black italic tracking-tighter text-blue-400 uppercase animate-pulse">{message}</p>
      </div>

      <div className="w-full flex justify-between mb-12 relative z-10">
        <div className="flex -space-x-12">
          {playerHand.map((c, i) => (
            <AnimatedCard key={c.id} card={c} delay={i * 200} />
          ))}
        </div>
        <div className="text-right flex flex-col justify-center pr-6">
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] text-blue-400 mb-1">Player</p>
          <p className="text-7xl font-black text-white">{calculateHand(playerHand)}</p>
        </div>
      </div>

      <div className="flex flex-col w-full relative z-10 space-y-4">
        {gameState === 'IDLE' || gameState === 'ENDED' ? (
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end">
            <div className="flex flex-col flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-blue-400 mb-2 px-2">Bet Size</label>
              <input 
                type="number" 
                value={bet === 0 ? '' : bet} 
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setBet(isNaN(val) ? 0 : val);
                }}
                className="w-full bg-black/60 border border-blue-500/30 rounded-2xl py-5 px-6 text-xl font-black text-blue-400 outline-none"
                placeholder="0"
              />
            </div>
            <button onClick={startNewGame} className="w-full md:flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all h-[68px] uppercase italic tracking-tighter text-2xl">
              Start Deal
            </button>
          </div>
        ) : (
          <div className="flex space-x-6">
            <button onClick={hit} className="flex-1 bg-white text-black font-black py-6 rounded-2xl hover:bg-gray-100 transition-all uppercase italic tracking-tighter text-3xl shadow-xl active:scale-95">Hit</button>
            <button onClick={stand} className="flex-1 bg-blue-900 border-2 border-blue-400 text-white font-black py-6 rounded-2xl hover:bg-blue-800 transition-all uppercase italic tracking-tighter text-3xl shadow-xl active:scale-95">Stand</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes card-slide {
          0% { transform: translate(300px, -300px) rotate(30deg); opacity: 0; }
          100% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
        }
        .animate-card-slide { animation: card-slide 0.7s cubic-bezier(0.19, 1, 0.22, 1); }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default BlackjackGame;
