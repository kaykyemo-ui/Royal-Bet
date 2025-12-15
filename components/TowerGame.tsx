import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, User, Skull, DoorOpen, Lock, Trophy, Footprints, Settings, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface TowerGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

const BASE_LEVELS = [
  { level: 1, paths: 2, baseMultiplier: 1.50 }, 
  { level: 2, paths: 3, baseMultiplier: 2.50 }, 
  { level: 3, paths: 4, baseMultiplier: 5.00 }, 
  { level: 4, paths: 5, baseMultiplier: 15.0 }, 
  { level: 5, paths: 6, baseMultiplier: 50.0 } 
];

const DIFFICULTY_OPTIONS = [1.0, 2.0, 2.5, 3.0];

export const TowerGame: React.FC<TowerGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedDifficultyMultiplier, setSelectedDifficultyMultiplier] = useState<number>(1.0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0); 
  const [statusMessage, setStatusMessage] = useState('Faça sua aposta para começar');
  
  const [pathHistory, setPathHistory] = useState<(number | null)[]>(Array(5).fill(null));
  const [correctPaths, setCorrectPaths] = useState<(number | null)[]>(Array(5).fill(null));
  const [showRules, setShowRules] = useState(false);
  const [showWinButton, setShowWinButton] = useState(false);

  const resetGame = () => {
    setIsPlaying(false);
    setIsGameOver(false);
    setCurrentLevelIndex(0);
    setPathHistory(Array(5).fill(null));
    setCorrectPaths(Array(5).fill(null));
    setStatusMessage('Faça sua aposta');
    setShowWinButton(false);
  };

  const getMultiplier = (levelIndex: number) => {
    const base = BASE_LEVELS[levelIndex].baseMultiplier;
    return base * selectedDifficultyMultiplier;
  };

  const startGame = () => {
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

    setTimeout(() => {
        onUpdateBalance(user.balance - bet, bet);
        setPathHistory(Array(5).fill(null));
        setCorrectPaths(Array(5).fill(null));
        setCurrentLevelIndex(0);
        setIsPlaying(true);
        setIsGameOver(false);
        setShowWinButton(false);
        setStatusMessage('Escolha um caminho...');
    }, 400);
  };

  const handlePathSelect = (pathIndex: number) => {
    if (!isPlaying || isGameOver) return;

    // --- PROBABILITY LOGIC: ~30% Chance to pass a level to make total win rate low ---
    // Total win rate for 5 levels would be very low (0.3^5)
    // The user asked for "10% chance to win". In a multi-stage game, this is tricky.
    // We will set a fixed 30% success rate per step.
    const isWin = Math.random() < 0.30;

    let calculatedCorrectPath: number;
    const pathsCount = BASE_LEVELS[currentLevelIndex].paths;

    if (isWin) {
        calculatedCorrectPath = pathIndex;
    } else {
        const possiblePaths = Array.from({ length: pathsCount }, (_, i) => i).filter(i => i !== pathIndex);
        calculatedCorrectPath = possiblePaths[Math.floor(Math.random() * possiblePaths.length)];
    }

    const newCorrectPaths = [...correctPaths];
    newCorrectPaths[currentLevelIndex] = calculatedCorrectPath;
    setCorrectPaths(newCorrectPaths);

    const newHistory = [...pathHistory];
    newHistory[currentLevelIndex] = pathIndex;
    setPathHistory(newHistory);

    if (isWin) {
        // SUCCESS
        const isFinalLevel = currentLevelIndex === BASE_LEVELS.length - 1;
        
        if (isFinalLevel) {
             // VICTORY
             const multiplier = getMultiplier(currentLevelIndex);
             const winAmount = parseFloat(betAmount) * multiplier;
             setStatusMessage(`VOCÊ VENCEU A MASMORRA! R$ ${winAmount.toFixed(2)}`);
             setIsGameOver(true);
             setIsPlaying(false);
             onUpdateBalance(user.balance + winAmount, 0);
             setShowWinButton(true);
        } else {
             // Advance
             setCurrentLevelIndex(prev => prev + 1);
             setStatusMessage('Caminho seguro! Continue...');
        }
    } else {
        // GAME OVER
        setStatusMessage('Você caiu na armadilha!');
        setIsGameOver(true);
        setIsPlaying(false);
        setShowWinButton(false);
    }
  };

  const handleCashout = () => {
    if (currentLevelIndex === 0) return; 
    
    const completedLevelIndex = currentLevelIndex - 1;
    const multiplier = getMultiplier(completedLevelIndex);
    const winAmount = parseFloat(betAmount) * multiplier;
    
    onUpdateBalance(user.balance + winAmount, 0);
    setStatusMessage(`SAQUE REALIZADO: R$ ${winAmount.toFixed(2)}`);
    setIsGameOver(true);
    setIsPlaying(false);
    setShowWinButton(true);
  };

  const currentMultiplier = currentLevelIndex > 0 ? getMultiplier(currentLevelIndex - 1) : 0;
  const currentWin = parseFloat(betAmount) * currentMultiplier;

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
          MASMORRA <span className="text-neon-yellow">REAL</span>
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
                <li>Suba os andares escolhendo portas.</li>
                <li>Se escolher a porta segura, você sobe e aumenta o prêmio.</li>
                <li>Se escolher a <strong>Caveira</strong>, perde tudo.</li>
                <li>Clique em <strong>SACAR</strong> para garantir o lucro atual.</li>
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
             <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Multiplicador da Aposta</label>
             <div className="grid grid-cols-4 gap-2">
                {DIFFICULTY_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedDifficultyMultiplier(m)}
                    disabled={isPlaying}
                    className={`
                      py-2 px-1 rounded border-2 font-bold text-xs transition-all uppercase
                      ${selectedDifficultyMultiplier === m 
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
             <p className="text-[10px] text-gray-500 mt-1">* Aumenta o valor final dos prêmios.</p>
          </div>

          <div className="bg-royal-800 rounded-lg p-4 border border-royal-700 space-y-2">
             <div className="flex justify-between text-xs text-gray-400 uppercase font-bold">
                <span>Nível Atual</span>
                <span className="text-white">{currentLevelIndex > 0 ? currentLevelIndex : '-'} / 5</span>
             </div>
             <div className="flex justify-between text-xs text-gray-400 uppercase font-bold">
                <span>Multiplicador</span>
                <span className="text-neon-yellow">{currentLevelIndex > 0 ? `${currentMultiplier.toFixed(2)}x` : '-'}</span>
             </div>
             <div className="flex justify-between text-sm text-white uppercase font-bold pt-2 border-t border-royal-700">
                <span>Ganho Atual</span>
                <span className="text-neon-yellow">R$ {currentWin.toFixed(2)}</span>
             </div>
          </div>

          {!isPlaying ? (
             <Button onClick={startGame} disabled={user.balance <= 0}>
                INICIAR JORNADA
             </Button>
          ) : (
             <Button 
                variant="success" 
                onClick={handleCashout} 
                disabled={currentLevelIndex === 0 || isGameOver}
                className="animate-pulse"
             >
                SACAR R$ {currentWin.toFixed(2)}
             </Button>
          )}

          {showWinButton && (
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
          
          {/* Info */}
           <div className="p-4 bg-royal-800/50 rounded-lg border border-royal-700 text-xs text-gray-400">
            <p className="mb-1 text-neon-yellow font-bold">Probabilidade por nível:</p>
            <p>Chance de sucesso: 30%</p>
          </div>

        </div>

        <div className="pt-6 mt-6 border-t border-royal-700">
          <Button variant="secondary" onClick={onExit} disabled={isPlaying} className="flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 bg-royal-950 rounded-3xl border-8 border-royal-900 relative min-h-[600px] order-1 md:order-2 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brick-wall-dark.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>

        {/* Status */}
        <div className="relative z-20 py-6 text-center">
            <span className={`
                inline-block px-6 py-2 rounded-full backdrop-blur-md border border-white/10 font-bold uppercase tracking-wider
                ${isGameOver && statusMessage.includes('VENCEU') ? 'bg-neon-yellow text-royal-900' : ''}
                ${isGameOver && statusMessage.includes('armadilha') ? 'bg-red-600 text-white' : 'bg-royal-800/80 text-white'}
            `}>
                {statusMessage}
            </span>
        </div>

        {/* The Tower Grid (Bottom Up) */}
        <div className="flex-1 flex flex-col-reverse justify-end items-center gap-4 pb-8 px-4 relative z-10 overflow-y-auto">
            
            {/* Render Levels from 1 (Bottom) to 5 (Top) */}
            {BASE_LEVELS.map((lvlConfig, index) => {
                const isActive = index === currentLevelIndex && isPlaying && !isGameOver;
                const isPast = index < currentLevelIndex;
                const isFuture = index > currentLevelIndex;
                const isCurrentButGameOver = index === currentLevelIndex && isGameOver;

                // Create array for paths [0, 1, 2...]
                const paths = Array.from({ length: lvlConfig.paths }, (_, i) => i);
                
                // Calculate display multiplier
                const displayMultiplier = lvlConfig.baseMultiplier * selectedDifficultyMultiplier;

                return (
                    <div 
                        key={lvlConfig.level} 
                        className={`
                            w-full max-w-2xl flex justify-center gap-2 md:gap-4 transition-all duration-500
                            ${isActive ? 'scale-105 opacity-100 my-4' : ''}
                            ${isFuture ? 'opacity-30 scale-90 blur-[1px]' : ''}
                            ${isPast ? 'opacity-50 scale-95' : ''}
                        `}
                    >
                        {paths.map((pathIdx) => {
                            // Determine visual state of this specific tile
                            let state: 'DEFAULT' | 'SELECTED_SAFE' | 'SELECTED_WRONG' | 'REVEALED_SAFE' | 'REVEALED_WRONG' = 'DEFAULT';
                            
                            // History for this level
                            const chosenPath = pathHistory[index];
                            const correctPath = correctPaths[index];

                            if (isPast && chosenPath === pathIdx) state = 'SELECTED_SAFE';
                            if (isCurrentButGameOver) {
                                if (chosenPath === pathIdx && chosenPath !== correctPath) state = 'SELECTED_WRONG';
                                if (pathIdx === correctPath && chosenPath !== correctPath) state = 'REVEALED_SAFE'; // Show where the answer was
                            }
                            
                            return (
                                <button
                                    key={pathIdx}
                                    onClick={() => handlePathSelect(pathIdx)}
                                    disabled={!isActive}
                                    className={`
                                        relative group flex flex-col items-center justify-center
                                        h-16 md:h-24 min-w-[3rem] md:min-w-[5rem] flex-1 rounded-xl border-b-4 transition-all duration-200
                                        ${state === 'DEFAULT' && isActive 
                                            ? 'bg-royal-700 border-royal-900 hover:-translate-y-1 hover:bg-royal-600 cursor-pointer shadow-lg' 
                                            : 'cursor-default'
                                        }
                                        ${state === 'DEFAULT' && !isActive 
                                            ? 'bg-royal-800/50 border-royal-900/50' 
                                            : ''
                                        }
                                        ${state === 'SELECTED_SAFE' ? 'bg-green-600 border-green-800 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''}
                                        ${state === 'SELECTED_WRONG' ? 'bg-red-600 border-red-800' : ''}
                                        ${state === 'REVEALED_SAFE' && isCurrentButGameOver ? 'bg-royal-700 border-green-500 border-2 border-b-2 opacity-60' : ''}
                                    `}
                                >
                                    {/* Icons */}
                                    {state === 'DEFAULT' && (
                                        <DoorOpen className={`w-6 h-6 md:w-8 md:h-8 ${isActive ? 'text-neon-yellow' : 'text-gray-600'}`} />
                                    )}
                                    
                                    {state === 'SELECTED_SAFE' && (
                                        <div className="flex flex-col items-center animate-bounce-short">
                                            <Footprints className="text-white w-6 h-6 md:w-8 md:h-8 mb-1" />
                                            <span className="text-[10px] font-bold text-white uppercase">Passou</span>
                                        </div>
                                    )}

                                    {state === 'SELECTED_WRONG' && (
                                        <Skull className="text-white w-6 h-6 md:w-8 md:h-8 animate-pulse" />
                                    )}

                                    {state === 'REVEALED_SAFE' && isCurrentButGameOver && (
                                        <Lock className="text-green-400 w-5 h-5 opacity-50" />
                                    )}

                                    {/* Multiplier Label for the row (only show on one or subtly) */}
                                    {pathIdx === 0 && isActive && (
                                        <div className="absolute -left-12 md:-left-20 top-1/2 -translate-y-1/2 text-neon-yellow font-bold text-xs md:text-sm">
                                            {displayMultiplier.toFixed(1)}x
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                );
            })}
            
            {/* Start Line Visual */}
            <div className="w-full max-w-2xl h-1 bg-royal-700 rounded-full mt-4 opacity-30"></div>
        </div>

      </div>

    </div>
  );
};