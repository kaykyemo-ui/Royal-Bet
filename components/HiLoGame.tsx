import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, ArrowUp, ArrowDown, Club, Diamond, Heart, Spade, History, RefreshCw, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface HiLoGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

const MULTIPLIERS = [1.5, 2.0, 3.0, 5.0, 10.0];

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const getCardValue = (rank: Rank): number => {
  const idx = RANKS.indexOf(rank);
  return idx + 2; 
};

const getRandomCard = (): Card => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  return { suit, rank, value: getCardValue(rank) };
};

const getForcedCard = (refValue: number, condition: 'HIGHER' | 'LOWER' | 'EQUAL'): Card => {
  let validRanks: Rank[] = [];
  
  if (condition === 'HIGHER') {
    validRanks = RANKS.filter(r => getCardValue(r) > refValue);
  } else if (condition === 'LOWER') {
    validRanks = RANKS.filter(r => getCardValue(r) < refValue);
  } else if (condition === 'EQUAL') {
    validRanks = RANKS.filter(r => getCardValue(r) === refValue);
  }

  if (validRanks.length === 0) return getRandomCard(); 

  const rank = validRanks[Math.floor(Math.random() * validRanks.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { suit, rank, value: getCardValue(rank) };
};

export const HiLoGame: React.FC<HiLoGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const isProcessing = useRef(false); 
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.0);

  const [currentCard, setCurrentCard] = useState<Card>(getRandomCard());
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [history, setHistory] = useState<Card[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('O que vem depois?');
  const [lastWin, setLastWin] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const skipCard = () => {
    if (isPlaying) return;
    setCurrentCard(getRandomCard());
    setNextCard(null);
    setStatusMessage('Nova carta sorteada.');
  };

  const handleBet = (guess: 'HIGHER' | 'LOWER') => {
    if (isPlaying || isProcessing.current) return;

    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      setStatusMessage('Aposta inválida');
      return;
    }
    if (bet > user.balance) {
      setStatusMessage('Saldo insuficiente');
      return;
    }

    isProcessing.current = true;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    setTimeout(() => {
        setIsPlaying(true);
        setNextCard(null); 
        setStatusMessage('Revelando...');
        
        onUpdateBalance(user.balance - bet, bet);
        setLastWin(0);

        setTimeout(() => {
            // --- GAME LOGIC: 10% Chance to Win ---
            const rand = Math.random();
            let scenario: 'WIN' | 'LOSS' | 'TIE' = 'LOSS';
            
            if (rand < 0.10) scenario = 'WIN';
            else if (rand < 0.20) scenario = 'TIE';
            else scenario = 'LOSS';

            // Validate Feasibility
            if (scenario === 'WIN') {
                if ((guess === 'HIGHER' && currentCard.value === 14) || 
                    (guess === 'LOWER' && currentCard.value === 2)) {
                    scenario = 'LOSS';
                }
            }

            if (scenario === 'LOSS') {
                if ((guess === 'HIGHER' && currentCard.value === 2) ||
                    (guess === 'LOWER' && currentCard.value === 14)) {
                    scenario = 'TIE';
                }
            }

            let resultCard: Card;

            if (scenario === 'WIN') {
                resultCard = getForcedCard(currentCard.value, guess);
            } else if (scenario === 'TIE') {
                resultCard = getForcedCard(currentCard.value, 'EQUAL');
            } else {
                const opposite = guess === 'HIGHER' ? 'LOWER' : 'HIGHER';
                resultCard = getForcedCard(currentCard.value, opposite);
            }
            
            if (!resultCard) resultCard = getRandomCard();

            setNextCard(resultCard);
            
            const isHigher = resultCard.value > currentCard.value;
            const isLower = resultCard.value < currentCard.value;
            const isTie = resultCard.value === currentCard.value;

            if (isTie) {
                onUpdateBalance(user.balance + bet, 0); 
                setStatusMessage(`EMPATE! Ninguém ganha.`);
            } else {
                let won = false;
                if (guess === 'HIGHER' && isHigher) won = true;
                if (guess === 'LOWER' && isLower) won = true;

                if (won) {
                    const winVal = bet * selectedMultiplier;
                    setLastWin(winVal);
                    onUpdateBalance(user.balance + winVal, 0);
                    setStatusMessage(`VITÓRIA! Ganhou R$ ${winVal.toFixed(2)}`);
                } else {
                    setStatusMessage(`Errou! Deu ${resultCard.rank}.`);
                }
            }

            setTimeout(() => {
                setHistory(prev => [currentCard, ...prev].slice(0, 5));
                setCurrentCard(resultCard);
                setNextCard(null);
                setIsPlaying(false);
                isProcessing.current = false;
            }, 2000);

        }, 600); 

    }, 400); 
  };

  const renderCard = (card: Card, isBig = false) => {
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const Icon = {
      hearts: Heart,
      diamonds: Diamond,
      clubs: Club,
      spades: Spade
    }[card.suit];

    return (
      <div 
        className={`
          bg-gray-100 rounded-lg shadow-xl relative select-none flex flex-col justify-between p-2
          ${isBig ? 'w-32 h-48 md:w-48 md:h-72' : 'w-12 h-16 md:w-16 md:h-24'}
          animate-flip-in
        `}
      >
        <div className={`font-display font-bold ${isBig ? 'text-4xl' : 'text-sm'} ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.rank}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <Icon size={isBig ? 64 : 24} className={isRed ? 'text-red-600' : 'text-slate-900'} fill={isRed ? 'currentColor' : 'none'} />
        </div>
        <div className={`font-display font-bold self-end rotate-180 ${isBig ? 'text-4xl' : 'text-sm'} ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.rank}
        </div>
      </div>
    );
  };

  return (
    <div ref={gameRef} className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 scroll-mt-4">
      
      <div className="w-full md:w-80 bg-royal-900/80 backdrop-blur-xl border border-royal-700 rounded-2xl p-6 h-fit order-2 md:order-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
           <div className="text-neon-yellow font-bold text-sm bg-royal-800 px-3 py-1 rounded-full border border-royal-700 shadow-neon">
             SALDO: R$ {user.balance.toFixed(2)}
          </div>
          <button onClick={() => setShowRules(true)} className="text-gray-400 hover:text-white">
            <HelpCircle size={20} />
          </button>
        </div>

        <h2 className="text-xl font-display font-bold text-white mb-6">
          DUELO <span className="text-neon-yellow">HI-LO</span>
        </h2>

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
                <li>O objetivo é adivinhar se a próxima carta será <strong>Maior</strong> ou <strong>Menor</strong> que a atual.</li>
                <li>O <strong>Ás (A)</strong> é a carta mais alta (vale 14).</li>
                <li>O <strong>2</strong> é a carta mais baixa.</li>
                <li>Se as cartas forem iguais (Empate), sua aposta é devolvida.</li>
                <li>O multiplicador escolhido determina o prêmio em caso de vitória.</li>
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
                disabled={isPlaying}
                className="w-full bg-royal-800 text-white border-2 border-royal-700 rounded-lg py-3 pl-10 pr-4 focus:border-neon-yellow focus:outline-none transition-colors font-bold disabled:opacity-50"
              />
            </div>
          </div>

          <div>
             <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Multiplicador Desejado</label>
             <div className="grid grid-cols-5 gap-1">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    disabled={isPlaying}
                    className={`
                      py-2 px-1 rounded border-2 font-bold text-xs transition-all uppercase
                      ${selectedMultiplier === m 
                        ? 'bg-neon-yellow border-neon-yellow text-royal-900 shadow-neon' 
                        : 'bg-royal-800 border-royal-700 text-gray-400 hover:border-gray-500'
                      }
                      disabled:opacity-50
                    `}
                  >
                    {m}x
                  </button>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <div className="text-center text-xs text-gray-400 uppercase font-bold mb-1">Você acha que a próxima será...</div>
             
             <button
               onClick={() => handleBet('HIGHER')}
               disabled={isPlaying || currentCard.value === 14 || user.balance <= 0} 
               className={`
                 relative w-full py-4 rounded-lg border-2 border-green-500/50 bg-green-900/20 hover:bg-green-900/40 transition-all flex justify-center items-center px-4 group
                 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105
               `}
             >
                <div className="flex items-center gap-3">
                   <div className="bg-green-500 rounded-full p-2 text-royal-900 shadow-lg">
                     <ArrowUp size={24} strokeWidth={4} />
                   </div>
                   <span className="font-display font-black text-2xl text-white uppercase tracking-wider">MAIOR</span>
                </div>
             </button>

             <button
               onClick={() => handleBet('LOWER')}
               disabled={isPlaying || currentCard.value === 2 || user.balance <= 0} 
               className={`
                 relative w-full py-4 rounded-lg border-2 border-red-500/50 bg-red-900/20 hover:bg-red-900/40 transition-all flex justify-center items-center px-4 group
                 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105
               `}
             >
                <div className="flex items-center gap-3">
                   <div className="bg-red-500 rounded-full p-2 text-white shadow-lg">
                     <ArrowDown size={24} strokeWidth={4} />
                   </div>
                   <span className="font-display font-black text-2xl text-white uppercase tracking-wider">MENOR</span>
                </div>
             </button>
          </div>

          <Button 
            variant="outline" 
            onClick={skipCard} 
            disabled={isPlaying} 
            className="mt-4 text-xs py-2 h-auto"
          >
             <RefreshCw size={14} className="mr-2" /> Pular Carta Atual
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
          <Button variant="secondary" onClick={onExit} disabled={isPlaying} className="flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-royal-950 rounded-3xl border-8 border-royal-900 relative min-h-[500px] order-1 md:order-2 overflow-hidden flex flex-col items-center justify-center shadow-2xl p-8">
        
        <div className="absolute inset-0 bg-[#0f172a]">
             <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-blue-900/20 to-transparent"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>

        <div className="relative z-10 mb-8 h-12 w-full flex items-center justify-center">
             <div className={`
                 px-6 py-2 rounded-full backdrop-blur-md border shadow-xl font-display font-bold uppercase tracking-wider text-center transition-all duration-300
                 ${lastWin > 0 ? 'bg-neon-yellow/90 text-royal-900 border-neon-yellow scale-110' : 'bg-black/40 text-white border-white/10'}
             `}>
                 {statusMessage}
             </div>
         </div>

        <div className="relative z-10 flex items-center justify-center gap-4 md:gap-12 min-h-[300px]">
            
            <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atual</span>
                {renderCard(currentCard, true)}
            </div>

            <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Próxima</span>
                
                {nextCard ? (
                    renderCard(nextCard, true)
                ) : (
                    <div className="w-32 h-48 md:w-48 md:h-72 bg-royal-800 border-4 border-royal-700 rounded-lg shadow-xl flex items-center justify-center relative animate-pulse">
                        <div className="absolute inset-2 border-2 border-dashed border-royal-600 rounded"></div>
                        <div className="w-16 h-16 rounded-full bg-royal-900 flex items-center justify-center border border-royal-700">
                             <span className="text-2xl font-display font-black text-royal-700">?</span>
                        </div>
                    </div>
                )}
            </div>

        </div>
        
        {history.length > 0 && (
            <div className="relative z-10 mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold">
                    <History size={12} /> Histórico
                </div>
                <div className="flex gap-2 opacity-60">
                    {history.map((c, i) => (
                        <div key={i} className="scale-75 origin-top">
                            {renderCard(c, false)}
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};