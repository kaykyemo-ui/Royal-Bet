import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Swords, Play, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface DiceWarGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

const MULTIPLIERS = [1.5, 2.0, 3.0, 5.0];

const DiceIcon = ({ value, className = '' }: { value: number, className?: string }) => {
  switch (value) {
    case 1: return <Dice1 className={className} />;
    case 2: return <Dice2 className={className} />;
    case 3: return <Dice3 className={className} />;
    case 4: return <Dice4 className={className} />;
    case 5: return <Dice5 className={className} />;
    case 6: return <Dice6 className={className} />;
    default: return <Dice1 className={className} />;
  }
};

type GameStep = 'IDLE' | 'HOUSE_ROLLING' | 'WAITING_PLAYER' | 'PLAYER_ROLLING' | 'FINISHED';

export const DiceWarGame: React.FC<DiceWarGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.0);
  
  const [gameStep, setGameStep] = useState<GameStep>('IDLE');
  
  const [userDie, setUserDie] = useState<number>(1);
  const [houseDie, setHouseDie] = useState<number>(1);
  
  // These hold the pre-calculated results
  const [targetUserDie, setTargetUserDie] = useState<number>(1);
  const [targetHouseDie, setTargetHouseDie] = useState<number>(1);

  const [statusMessage, setStatusMessage] = useState('Faça sua aposta');
  const [winAmount, setWinAmount] = useState(0);
  const [showRules, setShowRules] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startHouseRoll = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      setStatusMessage('Aposta inválida');
      return;
    }
    if (bet > user.balance) {
      setStatusMessage('Saldo insuficiente');
      return;
    }

    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Pre-calculate outcomes based on Rigging Logic (10% win rate)
    const isWin = Math.random() < 0.10;
    let finalUser: number;
    let finalHouse: number;

    if (isWin) {
        // User MUST be greater than House
        // Minimum User die must be 2 (to beat 1)
        finalUser = Math.floor(Math.random() * 5) + 2; // 2 to 6
        // House must be strictly less than User
        finalHouse = Math.floor(Math.random() * (finalUser - 1)) + 1;
    } else {
        // User MUST be <= House (Tie or Loss)
        finalHouse = Math.floor(Math.random() * 6) + 1; // 1 to 6
        // User must be <= House
        finalUser = Math.floor(Math.random() * finalHouse) + 1;
    }

    setTargetUserDie(finalUser);
    setTargetHouseDie(finalHouse);

    setTimeout(() => {
        onUpdateBalance(user.balance - bet, bet);
        setWinAmount(0);
        setGameStep('HOUSE_ROLLING');
        setStatusMessage('A Casa está jogando...');

        // Animate House Die
        let ticks = 0;
        intervalRef.current = window.setInterval(() => {
            setHouseDie(Math.floor(Math.random() * 6) + 1);
            ticks++;

            if (ticks > 15) { // ~1.5 seconds
                clearInterval(intervalRef.current!);
                finishHouseRoll(finalHouse);
            }
        }, 80);

    }, 400);
  };

  const finishHouseRoll = (finalVal: number) => {
      setHouseDie(finalVal);
      setGameStep('WAITING_PLAYER');
      setStatusMessage('Sua vez! Jogue o dado.');
  };

  const startPlayerRoll = () => {
      setGameStep('PLAYER_ROLLING');
      setStatusMessage('Rolando seu dado...');

      // Animate Player Die
      let ticks = 0;
      intervalRef.current = window.setInterval(() => {
          setUserDie(Math.floor(Math.random() * 6) + 1);
          ticks++;

          if (ticks > 15) { // ~1.5 seconds
              clearInterval(intervalRef.current!);
              finishPlayerRoll();
          }
      }, 80);
  };

  const finishPlayerRoll = () => {
      const finalVal = targetUserDie;
      const houseVal = targetHouseDie;
      
      setUserDie(finalVal);
      setGameStep('FINISHED');

      if (finalVal > houseVal) {
          const win = parseFloat(betAmount) * selectedMultiplier;
          setWinAmount(win);
          onUpdateBalance(user.balance + win, 0);
          setStatusMessage(`VITÓRIA! Você venceu a casa.`);
      } else if (finalVal === houseVal) {
          setStatusMessage(`EMPATE! Ninguém ganha.`);
      } else {
          setStatusMessage(`DERROTA! A casa venceu.`);
      }
  };

  return (
    <div ref={gameRef} className="w-full max-w-5xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 scroll-mt-4">
       
       {/* Sidebar */}
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
          GUERRA DE <span className="text-neon-yellow">DADOS</span>
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
                <li>A Casa joga um dado primeiro.</li>
                <li>Você joga o dado depois.</li>
                <li>Se seu número for <strong>MAIOR</strong>, você ganha.</li>
                <li>Empate ou número menor: A Casa vence (ou ninguém ganha).</li>
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
                disabled={gameStep !== 'IDLE' && gameStep !== 'FINISHED'}
                className="w-full bg-royal-800 text-white border-2 border-royal-700 rounded-lg py-3 pl-10 pr-4 focus:border-neon-yellow focus:outline-none transition-colors font-bold disabled:opacity-50"
              />
            </div>
          </div>

          <div>
             <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Multiplicador</label>
             <div className="grid grid-cols-4 gap-2">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    disabled={gameStep !== 'IDLE' && gameStep !== 'FINISHED'}
                    className={`
                      py-2 px-1 rounded border-2 font-bold text-xs transition-all uppercase
                      ${selectedMultiplier === m 
                        ? 'bg-neon-yellow border-neon-yellow text-royal-900 shadow-neon' 
                        : 'bg-royal-800 border-royal-700 text-gray-400 hover:border-gray-500'
                      }
                      disabled:opacity-50
                    `}
                  >
                    {m.toFixed(1)}x
                  </button>
                ))}
             </div>
          </div>

          {gameStep === 'IDLE' || gameStep === 'FINISHED' ? (
              <Button onClick={startHouseRoll} disabled={user.balance <= 0}>
                {gameStep === 'FINISHED' ? 'NOVA RODADA' : 'INICIAR JOGO'}
              </Button>
          ) : (
              <Button disabled className="opacity-50 cursor-not-allowed">
                  JOGO EM ANDAMENTO...
              </Button>
          )}

          {winAmount > 0 && (
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
          <Button variant="secondary" onClick={onExit} disabled={gameStep !== 'IDLE' && gameStep !== 'FINISHED'} className="flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 bg-royal-950 rounded-3xl border-8 border-royal-900 relative min-h-[500px] order-1 md:order-2 overflow-hidden flex flex-col items-center justify-center shadow-2xl p-8">
        
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-royal-950 to-black"></div>

         {/* Status */}
         <div className="relative z-10 mb-12 h-16 w-full flex items-center justify-center">
             <div className={`
                 px-6 py-3 rounded-full backdrop-blur-md border shadow-xl font-display font-bold uppercase tracking-wider text-center transition-all duration-300
                 ${statusMessage.includes('VITÓRIA') ? 'bg-neon-yellow/90 text-royal-900 border-neon-yellow scale-110' : ''}
                 ${statusMessage.includes('DERROTA') || statusMessage.includes('EMPATE') ? 'bg-red-600/90 text-white border-red-500 scale-110' : 'bg-royal-800 text-white border-royal-600'}
             `}>
                 {statusMessage}
                 {winAmount > 0 && <span className="block text-sm mt-1">Ganho: R$ {winAmount.toFixed(2)}</span>}
             </div>
         </div>

         {/* Arena */}
         <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24 relative z-10">
             
             {/* User Side */}
             <div className="flex flex-col items-center gap-4">
                 <div className={`
                     w-32 h-32 md:w-40 md:h-40 bg-royal-800 rounded-2xl border-4 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 relative
                     ${userDie > houseDie && gameStep === 'FINISHED' ? 'border-neon-yellow shadow-[0_0_30px_rgba(204,255,0,0.3)] scale-110' : 'border-royal-600'}
                 `}>
                     <DiceIcon value={userDie} className={`w-20 h-20 md:w-24 md:h-24 ${userDie > houseDie && gameStep === 'FINISHED' ? 'text-neon-yellow' : 'text-gray-300'}`} />
                     
                     {/* Placeholder overlay when waiting */}
                     {gameStep === 'HOUSE_ROLLING' && (
                         <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                             <span className="text-3xl animate-pulse opacity-50">?</span>
                         </div>
                     )}
                 </div>
                 
                 <div className="flex flex-col items-center gap-2 min-h-[60px]">
                    <span className="font-display font-bold text-neon-yellow tracking-widest uppercase bg-royal-900 px-4 py-1 rounded-full border border-royal-700">
                        Você
                    </span>
                    
                    {/* BUTTON UNDER PLAYER DICE */}
                    {gameStep === 'WAITING_PLAYER' && (
                        <button 
                            onClick={startPlayerRoll}
                            className="mt-2 flex items-center gap-2 bg-neon-yellow text-royal-900 px-6 py-2 rounded-lg font-bold uppercase hover:scale-105 transition-transform animate-bounce shadow-neon"
                        >
                            <Play size={16} fill="currentColor" /> JOGAR
                        </button>
                    )}
                 </div>
             </div>

             {/* VS Icon */}
             <div className="text-royal-700">
                 <Swords size={48} className={gameStep === 'HOUSE_ROLLING' || gameStep === 'PLAYER_ROLLING' ? 'animate-pulse' : ''} />
             </div>

             {/* House Side */}
             <div className="flex flex-col items-center gap-4">
                 <div className={`
                     w-32 h-32 md:w-40 md:h-40 bg-royal-800 rounded-2xl border-4 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300
                     ${houseDie >= userDie && gameStep === 'FINISHED' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] scale-110' : 'border-royal-600'}
                 `}>
                     <DiceIcon value={houseDie} className={`w-20 h-20 md:w-24 md:h-24 ${houseDie >= userDie && gameStep === 'FINISHED' ? 'text-red-500' : 'text-gray-300'}`} />
                 </div>
                 <div className="min-h-[60px]">
                    <span className="font-display font-bold text-red-500 tracking-widest uppercase bg-royal-900 px-4 py-1 rounded-full border border-royal-700">
                        A Casa
                    </span>
                 </div>
             </div>

         </div>

      </div>

    </div>
  );
};