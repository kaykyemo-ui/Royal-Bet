import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Flag, Trophy, Timer, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface HorseRaceGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

const HORSES = [
  { id: 1, name: 'Trovão', color: 'bg-red-600', textColor: 'text-red-500', borderColor: 'border-red-600' },
  { id: 2, name: 'Relâmpago', color: 'bg-blue-600', textColor: 'text-blue-500', borderColor: 'border-blue-600' },
  { id: 3, name: 'Cometa', color: 'bg-green-600', textColor: 'text-green-500', borderColor: 'border-green-600' },
  { id: 4, name: 'Fúria', color: 'bg-yellow-500', textColor: 'text-yellow-400', borderColor: 'border-yellow-500' },
  { id: 5, name: 'Sombra', color: 'bg-purple-600', textColor: 'text-purple-500', borderColor: 'border-purple-600' },
];

const MULTIPLIERS = [1.5, 2.0, 3.0, 5.0, 10.0];

export const HorseRaceGame: React.FC<HorseRaceGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const raceIntervalRef = useRef<number | null>(null);
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.0);
  
  const [isRacing, setIsRacing] = useState(false);
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0, 0]); // 0 to 100%
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('Escolha seu campeão');
  const [showRules, setShowRules] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const resetRace = () => {
    setPositions([0, 0, 0, 0, 0]);
    setIsRacing(false);
    setWinnerId(null);
    setStatusMessage('Escolha seu campeão');
    setLastWin(0);
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
  };

  const startRace = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      setStatusMessage('Aposta inválida');
      return;
    }
    if (bet > user.balance) {
      setStatusMessage('Saldo insuficiente');
      return;
    }
    if (selectedHorseId === null) {
      setStatusMessage('Selecione um cavalo!');
      return;
    }

    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
        onUpdateBalance(user.balance - bet, bet);
        setPositions([0, 0, 0, 0, 0]);
        setWinnerId(null);
        setIsRacing(true);
        setLastWin(0);
        setStatusMessage('Eles partiram!');

        // --- RIGGING LOGIC ---
        // 10% Chance to Win
        const isWin = Math.random() < 0.10;
        
        let predeterminedWinnerIndex: number;
        if (isWin) {
            predeterminedWinnerIndex = selectedHorseId - 1; // 0-based index
        } else {
            // Pick random winner that is NOT the selected horse
            const otherIndices = [0, 1, 2, 3, 4].filter(i => i !== (selectedHorseId - 1));
            predeterminedWinnerIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        }

        // --- RACE SIMULATION ---
        // We will update positions every 100ms
        // Base speed roughly allows race to finish in ~5-8 seconds
        
        let currentPositions = [0, 0, 0, 0, 0];
        
        raceIntervalRef.current = window.setInterval(() => {
            let finished = false;
            
            const newPositions = currentPositions.map((pos, index) => {
                // If already finished, stay there
                if (pos >= 100) return 100;

                // Base increment (random noise)
                let increment = Math.random() * 1.5 + 0.5; // 0.5% to 2.0% per tick

                // Boost the predetermined winner slightly
                if (index === predeterminedWinnerIndex) {
                    increment += 0.4; 
                }
                
                // Catch-up logic: if winner is lagging behind too much, boost more
                const maxPos = Math.max(...currentPositions);
                if (index === predeterminedWinnerIndex && pos < maxPos - 10) {
                    increment += 1.5;
                }

                // Slow down logic: if a loser is winning near the end, slow them down
                if (index !== predeterminedWinnerIndex && pos > 85 && pos > currentPositions[predeterminedWinnerIndex]) {
                    increment *= 0.1;
                }

                return Math.min(pos + increment, 100);
            });

            currentPositions = newPositions;
            setPositions([...currentPositions]);

            // Check Finish
            const winnerIndex = currentPositions.findIndex(p => p >= 100);
            if (winnerIndex !== -1) {
                finished = true;
                clearInterval(raceIntervalRef.current!);
                handleFinish(winnerIndex + 1, bet); // +1 because ID is 1-based
            }

        }, 50); // Tick every 50ms

    }, 400);
  };

  const handleFinish = (wId: number, bet: number) => {
    setWinnerId(wId);
    setIsRacing(false);
    
    if (wId === selectedHorseId) {
        const win = bet * selectedMultiplier;
        setLastWin(win);
        onUpdateBalance(user.balance + win, 0);
        setStatusMessage(`VITÓRIA! ${HORSES[wId-1].name} venceu! R$ ${win.toFixed(2)}`);
    } else {
        setStatusMessage(`Vitória de ${HORSES[wId-1].name}. Você perdeu.`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    };
  }, []);

  return (
    <div ref={gameRef} className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 scroll-mt-4">
      
      {/* Sidebar Controls */}
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
          TURFE <span className="text-neon-yellow">REAL</span>
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
                <li>Escolha um cavalo vencedor.</li>
                <li>Se ele chegar em primeiro, você ganha.</li>
                <li>Os outros cavalos são controlados pela casa.</li>
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
                disabled={isRacing}
                className="w-full bg-royal-800 text-white border-2 border-royal-700 rounded-lg py-3 pl-10 pr-4 focus:border-neon-yellow focus:outline-none transition-colors font-bold disabled:opacity-50"
              />
            </div>
          </div>

          <div>
             <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Multiplicador</label>
             <div className="grid grid-cols-5 gap-1">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    disabled={isRacing}
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

          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Escolha seu Cavalo</label>
            <div className="space-y-2">
                {HORSES.map(horse => (
                    <button
                        key={horse.id}
                        onClick={() => setSelectedHorseId(horse.id)}
                        disabled={isRacing}
                        className={`
                            w-full flex items-center justify-between p-3 rounded-lg border transition-all
                            ${selectedHorseId === horse.id 
                                ? `${horse.borderColor} bg-royal-800 shadow-lg scale-105` 
                                : 'border-royal-800 bg-royal-900/50 hover:bg-royal-800 opacity-80 hover:opacity-100'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${horse.color} shadow-[0_0_8px_currentColor]`}></div>
                            <span className="font-bold text-sm text-white">{horse.name}</span>
                        </div>
                        {selectedHorseId === horse.id && <Flag size={16} className={horse.textColor} />}
                    </button>
                ))}
            </div>
          </div>

          <Button onClick={startRace} disabled={isRacing || user.balance <= 0 || !selectedHorseId}>
             {isRacing ? 'EM CORRIDA...' : 'INICIAR CORRIDA'}
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
          <Button variant="secondary" onClick={onExit} disabled={isRacing} className="flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      {/* Racetrack */}
      <div className="flex-1 bg-royal-950 rounded-3xl border-8 border-royal-900 relative min-h-[500px] order-1 md:order-2 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Dirt Track Texture */}
        <div className="absolute inset-0 bg-[#3f2e18]">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dirt-texture.png')] opacity-50"></div>
             {/* Finish Line */}
             <div className="absolute right-[5%] top-0 bottom-0 w-8 bg-[repeating-linear-gradient(45deg,white,white_10px,black_10px,black_20px)] border-l-2 border-white/20"></div>
        </div>

        {/* Status Overlay */}
        <div className="absolute top-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
           <div className={`
             px-6 py-2 rounded-full backdrop-blur-md border shadow-xl font-display font-bold uppercase tracking-wider
             ${winnerId ? (winnerId === selectedHorseId ? 'bg-neon-yellow text-royal-900 border-neon-yellow animate-bounce' : 'bg-royal-800 text-white border-royal-600') : 'bg-black/40 text-white border-white/10'}
           `}>
              {statusMessage}
           </div>
        </div>

        {/* Lanes */}
        <div className="flex-1 flex flex-col justify-center py-8 relative z-10">
            {HORSES.map((horse, index) => {
                const progress = positions[index];
                const isWinner = winnerId === horse.id;
                
                return (
                    <div key={horse.id} className="relative flex-1 border-b border-white/5 flex items-center px-4">
                        {/* Lane Number */}
                        <div className="absolute left-2 text-[10px] font-bold text-white/20">{index + 1}</div>
                        
                        {/* The Horse & Jockey */}
                        <div 
                            className="absolute transition-all duration-75 ease-linear flex flex-col items-center"
                            style={{ 
                                left: `calc(${progress * 0.85}% + 20px)`, // Scale 0-100 to fit nicely before finish line logic
                                zIndex: Math.floor(progress) // Simple z-index layering
                            }}
                        >
                            <span className="text-3xl md:text-4xl filter drop-shadow-lg transform -scale-x-100" role="img" aria-label="horse">
                                🐎
                            </span>
                            
                            {/* Identifier Label */}
                            <div className={`
                                text-[10px] font-bold px-1.5 rounded bg-black/50 backdrop-blur-sm border border-white/10
                                ${horse.textColor}
                                ${isWinner ? 'animate-pulse scale-110 border-neon-yellow' : ''}
                            `}>
                                {horse.name}
                            </div>
                        </div>

                        {/* Dust Particles behind horse when moving */}
                        {isRacing && progress > 5 && progress < 95 && (
                            <div 
                                className="absolute h-4 w-12 opacity-30"
                                style={{ 
                                    left: `calc(${progress * 0.85}% - 20px)`,
                                    background: 'radial-gradient(circle, #d4b483 0%, transparent 70%)',
                                    filter: 'blur(4px)'
                                }}
                            ></div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

    </div>
  );
};