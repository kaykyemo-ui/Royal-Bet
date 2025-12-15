import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Trophy, Target, Shield, Circle, Play, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface PenaltyGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

// 5 Zones for aiming
type Zone = 'TOP_LEFT' | 'BOTTOM_LEFT' | 'CENTER' | 'TOP_RIGHT' | 'BOTTOM_RIGHT';

interface Position {
  top: string;
  left: string;
}

const ZONES: Record<Zone, Position> = {
  TOP_LEFT: { top: '10%', left: '10%' },
  BOTTOM_LEFT: { top: '80%', left: '10%' },
  CENTER: { top: '50%', left: '50%' },
  TOP_RIGHT: { top: '10%', left: '90%' },
  BOTTOM_RIGHT: { top: '80%', left: '90%' },
};

const MULTIPLIERS = [1.5, 2.0, 3.0]; // Fixed multipliers or user selectable

export const PenaltyGame: React.FC<PenaltyGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.0);
  
  const [gameState, setGameState] = useState<'BETTING' | 'AIMING' | 'KICKING' | 'RESULT'>('BETTING');
  
  const [ballPosition, setBallPosition] = useState<Position>({ top: '90%', left: '50%' });
  const [keeperPosition, setKeeperPosition] = useState<Position>({ top: '50%', left: '50%' });
  const [ballScale, setBallScale] = useState(1);
  
  const [statusMessage, setStatusMessage] = useState('Faça sua aposta');
  const [lastWin, setLastWin] = useState(0);
  const [showRules, setShowRules] = useState(false);

  // Reset positions helper
  const resetPositions = () => {
    setBallPosition({ top: '105%', left: '50%' }); 
    setKeeperPosition({ top: '50%', left: '50%' });
    setBallScale(1);
  };

  useEffect(() => {
    resetPositions();
  }, []);

  const handlePrepare = () => {
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
      setGameState('AIMING');
      setStatusMessage('ESCOLHA UM CANTO PARA CHUTAR!');
    }, 300);
  };

  const handleKick = (targetZone: Zone) => {
    if (gameState !== 'AIMING') return;

    const bet = parseFloat(betAmount);
    
    // Deduct balance immediately upon kick
    onUpdateBalance(user.balance - bet, bet);
    
    setGameState('KICKING');
    setStatusMessage('Chutou...');
    setLastWin(0);

    // --- RIGGING LOGIC (10% Win Rate) ---
    const isGoal = Math.random() < 0.10; 
    
    // Determine Target Coordinates
    const targetPos = ZONES[targetZone];

    // Determine Keeper Destination
    let keeperDest: Zone;

    if (isGoal) {
      // WIN: Keeper must dive somewhere ELSE
      const otherZones = (Object.keys(ZONES) as Zone[]).filter(z => z !== targetZone);
      keeperDest = otherZones[Math.floor(Math.random() * otherZones.length)];
    } else {
      // LOSS: Keeper dives to the SAME spot
      keeperDest = targetZone;
    }
    
    const keeperPos = ZONES[keeperDest];

    // ANIMATION SEQUENCE
    setTimeout(() => {
      setBallPosition(targetPos);
      setBallScale(0.6); 
      setKeeperPosition(keeperPos);

      setTimeout(() => {
        setGameState('RESULT');
        if (isGoal) {
          const win = bet * selectedMultiplier;
          setLastWin(win);
          onUpdateBalance(user.balance + win, 0); 
          setStatusMessage(`GOLAAAAÇO! R$ ${win.toFixed(2)}`);
        } else {
          setStatusMessage('DEFENDEU O GOLEIRO!');
        }
        
        // Reset after a delay and go back to BETTING
        setTimeout(() => {
          resetPositions();
          setGameState('BETTING');
          setStatusMessage('Faça sua aposta');
        }, 2500);

      }, 700);
    }, 100);
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
          PÊNALTI <span className="text-neon-yellow">PRO</span>
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
                <li>Defina o valor da aposta.</li>
                <li>Clique em <strong>Preparar</strong> e escolha um canto do gol.</li>
                <li>Se o goleiro não defender, você ganha.</li>
                <li>O multiplicador aumenta o prêmio.</li>
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
                disabled={gameState !== 'BETTING'}
                className="w-full bg-royal-800 text-white border-2 border-royal-700 rounded-lg py-3 pl-10 pr-4 focus:border-neon-yellow focus:outline-none transition-colors font-bold disabled:opacity-50"
              />
            </div>
          </div>

          <div>
             <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Dificuldade (Mult.)</label>
             <div className="grid grid-cols-3 gap-2">
                {MULTIPLIERS.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    disabled={gameState !== 'BETTING'}
                    className={`
                      py-2 px-1 rounded border-2 font-bold text-sm transition-all
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
          
          {gameState === 'BETTING' ? (
            <Button onClick={handlePrepare} disabled={user.balance <= 0}>
              <Play className="inline mr-2" size={18} /> PREPARAR CHUTE
            </Button>
          ) : (
            <div className="p-4 bg-royal-800/80 border border-neon-yellow/30 rounded-lg text-center animate-pulse">
               <p className="text-neon-yellow font-bold uppercase text-sm">
                 {gameState === 'AIMING' ? 'Clique no Gol!' : 'Chutando...'}
               </p>
            </div>
          )}

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
          <Button variant="secondary" onClick={onExit} className="flex items-center justify-center gap-2 text-sm" disabled={gameState !== 'BETTING' && gameState !== 'RESULT'}>
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 bg-royal-950 rounded-3xl border-8 border-royal-900 relative min-h-[500px] order-1 md:order-2 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Pitch/Grass Texture */}
        <div className="absolute inset-0 bg-emerald-900">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.2)_50%,transparent_50%)] bg-[size:100%_40px]"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-40 mix-blend-overlay"></div>
             {/* Penalty Box Lines */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[20%] border-t-4 border-l-4 border-r-4 border-white/50"></div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[10%] border-t-4 border-l-4 border-r-4 border-white/50"></div>
             <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
        </div>

        {/* Status Overlay */}
        <div className="absolute top-10 left-0 right-0 z-50 flex justify-center pointer-events-none">
           <div className={`
             px-8 py-3 rounded-full backdrop-blur-md border shadow-2xl font-display font-black text-xl uppercase tracking-wider transition-all duration-300
             ${statusMessage.includes('GOL') ? 'bg-neon-yellow/90 text-royal-900 border-neon-yellow scale-110' : ''}
             ${statusMessage.includes('DEFENDEU') ? 'bg-red-600/90 text-white border-red-500 scale-110' : ''}
             ${!statusMessage.includes('GOL') && !statusMessage.includes('DEFENDEU') ? 'bg-black/50 text-white border-white/10' : ''}
           `}>
              {statusMessage}
           </div>
        </div>

        {/* Goal Container */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[45%] z-10 perspective-1000">
            {/* The Goal Frame */}
            <div className={`w-full h-full border-t-[8px] border-l-[8px] border-r-[8px] border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.3)] relative transition-all duration-500 ${gameState === 'BETTING' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                {/* Net Texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 bg-black/30"></div>
                
                {/* Target Zones (Buttons) - Only clickable when AIMING */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 z-30">
                   {/* Top Left */}
                   <button onClick={() => handleKick('TOP_LEFT')} disabled={gameState !== 'AIMING'} className="group hover:bg-neon-yellow/10 transition-colors border-r border-b border-white/5 outline-none relative cursor-pointer disabled:cursor-default">
                      <Target className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-yellow transition-opacity duration-300 ${gameState === 'AIMING' ? 'opacity-30 group-hover:opacity-100 animate-pulse' : 'opacity-0'}`} />
                   </button>
                   {/* Center Top */}
                   <button onClick={() => handleKick('CENTER')} disabled={gameState !== 'AIMING'} className="group hover:bg-neon-yellow/10 transition-colors border-r border-b border-white/5 outline-none row-span-2 relative cursor-pointer disabled:cursor-default">
                       <Target className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-yellow transition-opacity duration-300 ${gameState === 'AIMING' ? 'opacity-30 group-hover:opacity-100 animate-pulse' : 'opacity-0'}`} />
                       <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/50 font-bold uppercase tracking-widest transition-opacity ${gameState === 'AIMING' ? 'opacity-100' : 'opacity-0'}`}>Centro</div>
                   </button>
                   {/* Top Right */}
                   <button onClick={() => handleKick('TOP_RIGHT')} disabled={gameState !== 'AIMING'} className="group hover:bg-neon-yellow/10 transition-colors border-b border-white/5 outline-none relative cursor-pointer disabled:cursor-default">
                       <Target className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-yellow transition-opacity duration-300 ${gameState === 'AIMING' ? 'opacity-30 group-hover:opacity-100 animate-pulse' : 'opacity-0'}`} />
                   </button>
                   
                   {/* Bottom Left */}
                   <button onClick={() => handleKick('BOTTOM_LEFT')} disabled={gameState !== 'AIMING'} className="group hover:bg-neon-yellow/10 transition-colors border-r border-white/5 outline-none relative cursor-pointer disabled:cursor-default">
                       <Target className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-yellow transition-opacity duration-300 ${gameState === 'AIMING' ? 'opacity-30 group-hover:opacity-100 animate-pulse' : 'opacity-0'}`} />
                   </button>
                   {/* Bottom Right */}
                   <button onClick={() => handleKick('BOTTOM_RIGHT')} disabled={gameState !== 'AIMING'} className="group hover:bg-neon-yellow/10 transition-colors outline-none relative cursor-pointer disabled:cursor-default">
                       <Target className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-yellow transition-opacity duration-300 ${gameState === 'AIMING' ? 'opacity-30 group-hover:opacity-100 animate-pulse' : 'opacity-0'}`} />
                   </button>
                </div>

                {/* Goalkeeper */}
                <div 
                  className="absolute w-16 h-24 md:w-20 md:h-32 bg-red-600 rounded-full border-2 border-white shadow-lg z-20 transition-all duration-700 ease-out flex items-center justify-center"
                  style={{
                    top: keeperPosition.top,
                    left: keeperPosition.left,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                    <Shield className="text-white w-10 h-10" />
                    {/* Head */}
                    <div className="absolute -top-8 w-10 h-10 bg-red-500 rounded-full border-2 border-white"></div>
                </div>

                 {/* The Ball */}
                <div 
                  className="absolute z-40 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-[0_0_15px_white] flex items-center justify-center transition-all duration-700 ease-in-out"
                  style={{
                    top: ballPosition.top, // 100% is bottom line
                    left: ballPosition.left,
                    transform: `translate(-50%, -50%) scale(${ballScale})`
                  }}
                >
                   <Circle className="text-gray-300 w-full h-full animate-spin-slow" />
                </div>
            </div>
        </div>

        {/* Penalty Spot Visual */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-4 h-4 bg-white/80 rounded-full blur-[2px]"></div>

      </div>

    </div>
  );
};