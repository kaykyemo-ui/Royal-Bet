import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Target, Crosshair, Trophy, MousePointer2, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface TargetGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

const MULTIPLIERS = [1.5, 2.0, 3.0, 5.0];

// Helper to generate random coordinates for HOUSE (House is a sharpshooter)
const getHouseCoordinates = (score: number) => {
  const maxRadius = 45; 
  const step = 4.5; 
  const baseRadius = (10 - score) * step; 
  const randomRadius = baseRadius + (Math.random() * step * 0.8);
  const angle = Math.random() * 2 * Math.PI;
  const x = 50 + (randomRadius * Math.cos(angle));
  const y = 50 + (randomRadius * Math.sin(angle));
  return { x, y };
};

// Calculate Score based on distance from center (50, 50)
const calculateScoreFromHit = (x: number, y: number): number => {
    const dx = x - 50;
    const dy = y - 50;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // Max radius 45% = Score 1. Center = Score 10. Step = 4.5
    if (distance > 45) return 0; // Miss
    const rawScore = 10 - Math.floor(distance / 4.5);
    return Math.max(1, Math.min(10, rawScore));
};

type GameStep = 'IDLE' | 'HOUSE_AIMING' | 'WAITING_PLAYER' | 'PLAYER_SHOOTING' | 'FINISHED';

interface Shot {
  score: number;
  x: number;
  y: number;
  shooter: 'HOUSE' | 'PLAYER';
}

export const TargetGame: React.FC<TargetGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.0);
  
  const [gameStep, setGameStep] = useState<GameStep>('IDLE');
  const [statusMessage, setStatusMessage] = useState('Faça sua aposta');
  
  const [houseShot, setHouseShot] = useState<Shot | null>(null);
  const [playerShot, setPlayerShot] = useState<Shot | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  
  // Decides the outcome round start
  const [shouldPlayerWin, setShouldPlayerWin] = useState(false);

  const startHouseTurn = () => {
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

    // --- PROBABILITY: 10% Chance to Win ---
    const isWin = Math.random() < 0.10;
    setShouldPlayerWin(isWin);

    // House Logic: House is extremely strong to force the "near miss" narrative
    // 50% chance of 10, 30% chance of 9, 20% chance of 8.
    const r = Math.random();
    let houseScoreVal = 10;
    if (r < 0.2) houseScoreVal = 8;
    else if (r < 0.5) houseScoreVal = 9;

    setTimeout(() => {
        onUpdateBalance(user.balance - bet, bet);
        setHouseShot(null);
        setPlayerShot(null);
        setLastWin(0);
        setGameStep('HOUSE_AIMING');
        setStatusMessage('A Casa está mirando...');

        // Delay for House Shot animation
        setTimeout(() => {
            const coords = getHouseCoordinates(houseScoreVal);
            setHouseShot({ score: houseScoreVal, x: coords.x, y: coords.y, shooter: 'HOUSE' });
            setGameStep('WAITING_PLAYER');
            setStatusMessage(`Casa fez ${houseScoreVal}. Sua vez!`);
        }, 1500);

    }, 400);
  };

  const handleTargetClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (gameStep !== 'WAITING_PLAYER') return;
      if (!houseShot) return;

      setGameStep('PLAYER_SHOOTING');
      setStatusMessage('Disparando...');

      // 1. Get where the user actually clicked (0-100%)
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      // 2. Calculate what the score WOULD be without logic modification
      const potentialScore = calculateScoreFromHit(clickX, clickY);

      let finalX = clickX;
      let finalY = clickY;

      // 3. Apply Game Logic
      if (!shouldPlayerWin) {
         // FORCE LOSS
         // If user aimed well enough to tie or win, we MUST deflect the shot.
         if (potentialScore >= houseShot.score) {
             // We need to push the shot OUT to a lower ring.
             const targetMaxScore = Math.max(0, houseShot.score - 1);
             const deflectDistance = ((10 - targetMaxScore) * 4.5) + 1.5; 

             const dx = clickX - 50;
             const dy = clickY - 50;
             let angle = Math.atan2(dy, dx);
             
             if (dx === 0 && dy === 0) angle = Math.random() * 2 * Math.PI;

             finalX = 50 + (Math.cos(angle) * deflectDistance);
             finalY = 50 + (Math.sin(angle) * deflectDistance);

             finalX += (Math.random() - 0.5) * 2;
             finalY += (Math.random() - 0.5) * 2;
         }
      }

      // Clamp
      finalX = Math.max(0, Math.min(100, finalX));
      finalY = Math.max(0, Math.min(100, finalY));

      const finalScore = calculateScoreFromHit(finalX, finalY);

      setTimeout(() => {
          setPlayerShot({ score: finalScore, x: finalX, y: finalY, shooter: 'PLAYER' });
          finishGame(finalScore, houseShot.score);
      }, 200);
  };

  const finishGame = (pScore: number, hScore: number) => {
      setGameStep('FINISHED');
      const bet = parseFloat(betAmount);

      if (pScore > hScore) {
          const win = bet * selectedMultiplier;
          setLastWin(win);
          onUpdateBalance(user.balance + win, 0);
          setStatusMessage(`NA MOSCA! ${pScore} a ${hScore}. Ganhou R$ ${win.toFixed(2)}`);
      } else if (pScore === hScore) {
          setStatusMessage(`EMPATE! ${pScore} a ${hScore}. Ninguém ganha.`);
      } else {
          // Messages emphasizing the "near miss"
          const diff = hScore - pScore;
          if (diff === 1) setStatusMessage(`POR POUCO! ${pScore} a ${hScore}. O vento atrapalhou.`);
          else if (diff === 2) setStatusMessage(`RASPOU! ${pScore} a ${hScore}. A Casa venceu.`);
          else setStatusMessage(`ERROU! ${pScore} a ${hScore}. A Casa venceu.`);
      }
  };

  return (
    <div ref={gameRef} className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 scroll-mt-4">
      
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
          TIRO AO <span className="text-neon-yellow">ALVO</span>
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
                <li>A Casa faz um disparo primeiro.</li>
                <li>Você deve tentar fazer uma pontuação <strong>maior</strong> clicando no alvo.</li>
                <li>O centro vale 10 pontos.</li>
                <li>Se sua pontuação for maior, você ganha o multiplicador.</li>
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

          <div className="py-4">
              {gameStep === 'IDLE' || gameStep === 'FINISHED' ? (
                  <Button onClick={startHouseTurn} disabled={user.balance <= 0}>
                    {gameStep === 'FINISHED' ? 'NOVA RODADA' : 'INICIAR DISPUTA'}
                  </Button>
              ) : (
                  <div className={`p-3 rounded border text-center font-bold text-sm uppercase ${gameStep === 'WAITING_PLAYER' ? 'bg-neon-yellow text-royal-900 border-neon-yellow animate-pulse' : 'bg-royal-800 border-royal-700 text-gray-400'}`}>
                      {gameStep === 'WAITING_PLAYER' ? 'CLIQUE NO ALVO PARA ATIRAR!' : 'AGUARDE...'}
                  </div>
              )}
          </div>

          {/* Scores Panel */}
          <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg border text-center transition-all ${houseShot ? 'bg-royal-800 border-red-500' : 'bg-royal-900/50 border-royal-800'}`}>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Casa</p>
                  <p className={`text-2xl font-display font-black ${houseShot ? 'text-red-500' : 'text-gray-600'}`}>
                      {houseShot ? houseShot.score : '-'}
                  </p>
              </div>
              <div className={`p-3 rounded-lg border text-center transition-all ${playerShot ? 'bg-royal-800 border-neon-yellow' : 'bg-royal-900/50 border-royal-800'}`}>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Você</p>
                  <p className={`text-2xl font-display font-black ${playerShot ? 'text-neon-yellow' : 'text-gray-600'}`}>
                      {playerShot ? playerShot.score : '-'}
                  </p>
              </div>
          </div>

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
          <Button variant="secondary" onClick={onExit} disabled={gameStep !== 'IDLE' && gameStep !== 'FINISHED'} className="flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      {/* Target Area */}
      <div className="flex-1 bg-royal-950 rounded-3xl border-8 border-royal-900 relative min-h-[500px] order-1 md:order-2 overflow-hidden flex flex-col items-center justify-center shadow-2xl p-4 cursor-default select-none">
        
        {/* Wall Background with Depth Gradient */}
        <div className="absolute inset-0 bg-stone-900 perspective-1000">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-30"></div>
            {/* Vignette for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-90 pointer-events-none"></div>
        </div>

        {/* Status Overlay */}
        <div className="absolute top-8 left-0 right-0 z-30 flex justify-center pointer-events-none">
           <div className={`
             px-6 py-2 rounded-full backdrop-blur-md border shadow-xl font-display font-bold uppercase tracking-wider transition-all duration-300
             ${statusMessage.includes('NA MOSCA') ? 'bg-neon-yellow/90 text-royal-900 border-neon-yellow scale-110' : ''}
             ${statusMessage.includes('ERROU') || statusMessage.includes('POUCO') || statusMessage.includes('RASPOU') ? 'bg-red-600/90 text-white border-red-500 scale-110' : ''}
             ${!statusMessage.includes('NA MOSCA') && !statusMessage.includes('ERROU') && !statusMessage.includes('POUCO') ? 'bg-black/60 text-white border-white/10' : ''}
           `}>
              {statusMessage}
           </div>
        </div>

        {/* The Target (SVG) - Clickable Area */}
        {/* EXTREMELY SMALL SIZE TO SIMULATE 300M DISTANCE */}
        <div 
            className={`
                relative w-[40px] h-[40px] md:w-[60px] md:h-[60px] z-20 transition-all duration-300
                ${gameStep === 'WAITING_PLAYER' ? 'cursor-crosshair scale-105 hover:scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]' : ''}
                ${gameStep === 'IDLE' || gameStep === 'FINISHED' ? 'opacity-80 scale-90 grayscale-[0.5]' : ''}
            `}
            onClick={handleTargetClick}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                {/* Target Stand Legs (Visual only) */}
                <line x1="50" y1="50" x2="50" y2="150" stroke="#333" strokeWidth="2" />

                {/* Rings */}
                {/* Outer (White) 1-2 */}
                <circle cx="50" cy="50" r="45" fill="#e5e5e5" stroke="#999" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="40" fill="white" stroke="#ccc" strokeWidth="0.5" />
                
                {/* Middle (Black) 3-4 */}
                <circle cx="50" cy="50" r="35" fill="black" stroke="#333" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="30" fill="#262626" stroke="#444" strokeWidth="0.5" />
                
                {/* Inner (Blue) 5-6 */}
                <circle cx="50" cy="50" r="25" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="20" fill="#60a5fa" stroke="#2563eb" strokeWidth="0.5" />

                {/* Inner (Red) 7-8 */}
                <circle cx="50" cy="50" r="15" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="10" fill="#f87171" stroke="#dc2626" strokeWidth="0.5" />

                {/* Bullseye (Yellow) 9-10 */}
                <circle cx="50" cy="50" r="5" fill="#CCFF00" stroke="#a3cc00" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="2" fill="#d9ff40" />

                {/* Crosshair Overlay (When Aiming) */}
                {gameStep === 'HOUSE_AIMING' && (
                    <g className="animate-spin-slow origin-center opacity-50">
                        <line x1="50" y1="0" x2="50" y2="100" stroke="red" strokeWidth="0.5" strokeDasharray="2" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="red" strokeWidth="0.5" strokeDasharray="2" />
                        <circle cx="50" cy="50" r="48" stroke="red" strokeWidth="1" fill="none" />
                    </g>
                )}
            </svg>
            
            {/* Visual Text Label "300m" to simulate distance */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-mono tracking-widest bg-black/50 px-2 rounded whitespace-nowrap">
                DISTÂNCIA: 300M
            </div>

            {/* Shots rendering */}
            {houseShot && (
                <div 
                    className="absolute w-1 h-1 md:w-1.5 md:h-1.5 bg-red-600 rounded-full border border-white shadow-sm pointer-events-none"
                    style={{ 
                        left: `${houseShot.x}%`, 
                        top: `${houseShot.y}%`, 
                        transform: 'translate(-50%, -50%)' 
                    }}
                >
                    {/* Bullet Hole Graphic */}
                    <div className="absolute inset-0 bg-black opacity-30 rounded-full scale-150 blur-[1px]"></div>
                </div>
            )}

            {playerShot && (
                <div 
                    className="absolute w-1 h-1 md:w-1.5 md:h-1.5 bg-neon-yellow rounded-full border border-black shadow-[0_0_10px_rgba(204,255,0,1)] z-20 pointer-events-none"
                    style={{ 
                        left: `${playerShot.x}%`, 
                        top: `${playerShot.y}%`, 
                        transform: 'translate(-50%, -50%)' 
                    }}
                >
                     <div className="absolute inset-0 bg-white opacity-50 rounded-full animate-ping"></div>
                </div>
            )}
            
            {/* Helper Text Overlay on Target */}
            {gameStep === 'WAITING_PLAYER' && !playerShot && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse opacity-50">
                     <Crosshair className="text-white w-6 h-6" strokeWidth={1} />
                 </div>
            )}

        </div>

      </div>
    </div>
  );
};