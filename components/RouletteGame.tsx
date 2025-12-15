import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { ArrowLeft, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface RouletteGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

// European Roulette Order (Clockwise)
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Standard European Roulette Red Numbers
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
};

const MULTIPLIERS = [0.5, 1.0, 2.0, 2.5, 3.0];

export const RouletteGame: React.FC<RouletteGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.0);
  
  const [selectedType, setSelectedType] = useState<'COLOR' | 'NUMBER' | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | number | null>(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinDuration, setSpinDuration] = useState(4000);
  const [statusMessage, setStatusMessage] = useState('Faça sua aposta');
  const [lastWin, setLastWin] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const handleBetTypeSelect = (type: 'COLOR' | 'NUMBER', value: string | number) => {
    if (isSpinning) return;
    setSelectedType(type);
    setSelectedValue(value);
    
    let label = '';
    if (type === 'COLOR') label = value === 'RED' ? 'Vermelho' : 'Preto';
    else label = `Número ${value}`;
    
    setStatusMessage(`Aposta: ${label}`);
  };

  const spinWheel = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      setStatusMessage('Valor de aposta inválido');
      return;
    }
    if (bet > user.balance) {
      setStatusMessage('Saldo insuficiente');
      return;
    }
    if (selectedType === null || selectedValue === null) {
      setStatusMessage('Selecione onde quer apostar!');
      return;
    }

    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      onUpdateBalance(user.balance - bet, bet);
      setIsSpinning(true);
      setLastWin(0);
      setStatusMessage('Girando...');

      // Random spin duration between 6s and 8s
      const duration = 6000 + Math.floor(Math.random() * 2000);
      setSpinDuration(duration);

      // --- GAME LOGIC: 10% Chance to Win ---
      const isWin = Math.random() < 0.10; 
      
      let targetNumber: number;

      if (isWin) {
        // Find a number that results in a win
        if (selectedType === 'COLOR') {
          const targetColor = selectedValue === 'RED' ? 'red' : 'black';
          const possibleNumbers = WHEEL_NUMBERS.filter(n => getNumberColor(n) === targetColor);
          targetNumber = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
        } else {
          targetNumber = selectedValue as number;
        }
      } else {
        // Find a number that results in a loss
        if (selectedType === 'COLOR') {
          const targetColor = selectedValue === 'RED' ? 'black' : 'red'; 
          // Include Green (0) as a loss option for colors
          const possibleNumbers = WHEEL_NUMBERS.filter(n => {
             const c = getNumberColor(n);
             return c === targetColor || c === 'green';
          });
          targetNumber = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
        } else {
          const possibleNumbers = WHEEL_NUMBERS.filter(n => n !== selectedValue);
          targetNumber = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
        }
      }

      // --- CALCULATE ROTATION ---
      // 1. Determine index of target number
      const targetIndex = WHEEL_NUMBERS.indexOf(targetNumber);
      
      // 2. Slice geometry
      const sliceDeg = 360 / 37;
      
      // 3. The wheel starts with 0 at the top.
      // To bring `targetIndex` to the top, we must rotate the container COUNTER-CLOCKWISE (negative degrees)
      // by the angle corresponding to that index's position.
      // Center of the slice is (index * sliceDeg) + (sliceDeg / 2)
      const targetAngleOnWheel = (targetIndex * sliceDeg) + (sliceDeg / 2);
      
      // 4. Current rotation state (mod 360) tells us where we are roughly
      // We want to add full spins + the difference to reach the target
      const fullSpins = 360 * 10; // At least 10 full spins
      
      // Calculate how much we need to rotate FROM CURRENT POSITION to align `targetAngleOnWheel` to TOP (0deg)
      // Since CSS rotate(-Xdeg) rotates CCW, increasing 'rotation' variable moves wheel CCW.
      // We want `rotation % 360` to equal `targetAngleOnWheel`.
      
      const currentRotationMod = rotation % 360;
      let angleNeeded = targetAngleOnWheel - currentRotationMod;
      
      // Ensure we always spin forward (positive addition)
      if (angleNeeded <= 0) {
        angleNeeded += 360;
      }
      
      const finalRotationToAdd = fullSpins + angleNeeded;
      const newRotation = rotation + finalRotationToAdd;
      
      setRotation(newRotation);

      setTimeout(() => {
        setIsSpinning(false);
        handleResult(targetNumber, bet);
      }, duration);

    }, 600);
  };

  const handleResult = (landedNumber: number, bet: number) => {
    const landedColor = getNumberColor(landedNumber);
    let isWin = false;

    if (selectedType === 'COLOR') {
      const userChoseRed = selectedValue === 'RED';
      if ((userChoseRed && landedColor === 'red') || (!userChoseRed && landedColor === 'black')) {
        isWin = true;
      }
    } else if (selectedType === 'NUMBER') {
      if (landedNumber === (selectedValue as number)) {
        isWin = true;
      }
    }

    if (isWin) {
      const win = bet * selectedMultiplier;
      setLastWin(win);
      onUpdateBalance(user.balance + win, 0);
      setStatusMessage(`VOCÊ GANHOU! R$ ${win.toFixed(2)} (${selectedMultiplier}x)`);
    } else {
      let colorName = 'Verde';
      if (landedColor === 'red') colorName = 'Vermelho';
      if (landedColor === 'black') colorName = 'Preto';
      setStatusMessage(`Deu ${landedNumber} (${colorName}). Você perdeu.`);
    }
  };

  return (
    <div ref={gameRef} className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col gap-8 items-center scroll-mt-4">
      
      {/* Header Info */}
      <div className="w-full flex justify-between items-center bg-royal-900/50 p-4 rounded-xl border border-royal-700 backdrop-blur-sm">
        <h2 className="text-2xl font-display font-bold text-white">
          ROLETA <span className="text-neon-yellow">MILIONÁRIA</span>
        </h2>
        <div className="flex items-center gap-4">
           <div className="text-neon-yellow font-bold text-sm bg-royal-800 px-3 py-1 rounded-full border border-royal-700 shadow-neon">
             SALDO: R$ {user.balance.toFixed(2)}
           </div>
           <button onClick={() => setShowRules(true)} className="text-gray-400 hover:text-white">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

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
              <li>Aposte em <strong>Vermelho</strong>, <strong>Preto</strong> ou em um <strong>Número</strong>.</li>
              <li>A roleta gira e para em um número aleatório.</li>
              <li>Se acertar a Cor, você ganha o valor multiplicado pelo selecionado.</li>
              <li>Se acertar o Número exato, você ganha.</li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 w-full">
        
        {/* Left Column: The Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center bg-royal-800/30 rounded-2xl border border-royal-700 p-8 min-h-[400px] overflow-hidden relative">
           
           {/* Result Indicator (Triangle at Top) */}
           <div className="absolute top-8 z-30 drop-shadow-neon">
             <div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[24px] border-t-neon-yellow border-r-[12px] border-r-transparent"></div>
           </div>

           {/* The Wheel Container */}
           <div className="relative w-[320px] h-[320px] m-4">
             <div 
               className="w-full h-full rounded-full border-8 border-royal-800 shadow-2xl transition-transform cubic-bezier(0.25, 0.1, 0.25, 1)"
               style={{ 
                 transform: `rotate(-${rotation}deg)`,
                 transitionDuration: `${spinDuration}ms`,
                 // Using conic gradient for the background slices
                 background: `conic-gradient(
                   ${WHEEL_NUMBERS.map((n, i) => {
                      const slice = 360/37;
                      const start = i * slice;
                      const end = (i + 1) * slice;
                      const c = getNumberColor(n);
                      let colorCode = '#008000'; // Green for 0
                      if (c === 'red') colorCode = '#dc2626'; // Red-600
                      if (c === 'black') colorCode = '#0f172a'; // Slate-900 (Black)
                      return `${colorCode} ${start}deg ${end}deg`;
                   }).join(', ')}
                 )`
               }}
             >
               {/* Inner Overlay for better aesthetics */}
               <div className="absolute inset-0 rounded-full border-[1px] border-white/10"></div>
               
               {/* Center Hub */}
               <div className="absolute inset-[35%] rounded-full bg-royal-950 border-4 border-royal-600 shadow-inner z-20 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-royal-700 to-royal-900 border border-royal-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-neon-yellow shadow-neon"></div>
                  </div>
               </div>

               {/* Numbers - Positioned using Rotation from Center */}
               {WHEEL_NUMBERS.map((num, i) => {
                  const sliceAngle = 360 / 37;
                  // We rotate the container to the center of the slice
                  const rotateAngle = i * sliceAngle + (sliceAngle / 2);
                  
                  return (
                    <div
                      key={num}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      style={{ 
                        transform: `rotate(${rotateAngle}deg)` 
                      }}
                    >
                      {/* The number itself, positioned at the top of the rotated container */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center pt-2">
                        <span 
                          className={`
                            block text-[13px] font-black tracking-tighter text-white drop-shadow-md
                          `}
                        >
                          {num}
                        </span>
                      </div>
                    </div>
                  )
               })}
             </div>
           </div>

           {/* Game Status */}
           <div className="mt-8 text-center h-12">
             <p className={`font-display font-bold text-lg ${lastWin > 0 ? 'text-neon-yellow animate-bounce' : 'text-white'}`}>
               {statusMessage}
             </p>
           </div>
        </div>

        {/* Right Column: Betting Board */}
        <div className="w-full lg:w-[450px] bg-royal-900/80 backdrop-blur-xl border border-royal-700 rounded-2xl p-6 flex flex-col">
          
          <div className="mb-4">
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Valor da Aposta</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-neon-yellow font-bold">R$</span>
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isSpinning}
                className="w-full bg-royal-800 text-white border-2 border-royal-700 rounded-lg py-3 pl-10 pr-4 focus:border-neon-yellow focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="mb-6">
             <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Multiplicador</label>
             <div className="grid grid-cols-5 gap-1">
                {MULTIPLIERS.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    disabled={isSpinning}
                    className={`
                      py-2 px-1 rounded border-2 font-bold text-xs transition-all
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

          {/* Color Bets */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleBetTypeSelect('COLOR', 'RED')}
              disabled={isSpinning}
              className={`
                py-4 rounded-lg font-bold border-2 transition-all flex flex-col items-center
                ${selectedType === 'COLOR' && selectedValue === 'RED' 
                  ? 'bg-red-600 border-neon-yellow shadow-neon scale-105' 
                  : 'bg-red-900/50 border-red-800 hover:bg-red-800'
                }
              `}
            >
              <span className="text-white">VERMELHO</span>
            </button>
            <button
              onClick={() => handleBetTypeSelect('COLOR', 'BLACK')}
              disabled={isSpinning}
              className={`
                py-4 rounded-lg font-bold border-2 transition-all flex flex-col items-center
                ${selectedType === 'COLOR' && selectedValue === 'BLACK' 
                  ? 'bg-slate-800 border-neon-yellow shadow-neon scale-105' 
                  : 'bg-slate-900/80 border-slate-700 hover:bg-slate-800'
                }
              `}
            >
              <span className="text-white">PRETO</span>
            </button>
          </div>

          {/* Number Grid */}
          <div className="mb-2">
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Ou escolha um número</label>
          </div>
          <div className="grid grid-cols-6 gap-1.5 mb-6">
            <button
               onClick={() => handleBetTypeSelect('NUMBER', 0)}
               disabled={isSpinning}
               className={`
                  aspect-square rounded font-bold text-sm border transition-all
                  ${selectedType === 'NUMBER' && selectedValue === 0
                    ? 'bg-green-600 text-white border-neon-yellow z-10 scale-110 shadow-neon' 
                    : 'bg-green-800/80 border-green-700 hover:bg-green-700 text-white'
                  }
               `}
            >
              0
            </button>
            {Array.from({length: 36}, (_, i) => i + 1).map(num => {
              const color = getNumberColor(num);
              return (
                <button
                  key={num}
                  onClick={() => handleBetTypeSelect('NUMBER', num)}
                  disabled={isSpinning}
                  className={`
                    aspect-square rounded font-bold text-sm border transition-all
                    ${selectedType === 'NUMBER' && selectedValue === num
                      ? 'border-neon-yellow z-10 scale-110 shadow-neon' 
                      : 'border-royal-800 hover:opacity-80'
                    }
                    ${color === 'red' 
                      ? (selectedType === 'NUMBER' && selectedValue === num ? 'bg-red-600' : 'bg-red-900/40 text-red-200')
                      : (selectedType === 'NUMBER' && selectedValue === num ? 'bg-slate-700' : 'bg-slate-800/60 text-slate-300')
                    }
                  `}
                >
                  {num}
                </button>
              )
            })}
          </div>

          <Button 
            onClick={spinWheel} 
            disabled={isSpinning || user.balance <= 0}
            className="mb-4"
          >
            {isSpinning ? 'GIRANDO...' : 'GIRAR ROLETA'}
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
          
          <div className="border-t border-royal-700 pt-4">
             <Button variant="secondary" onClick={onExit} disabled={isSpinning} className="flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> VOLTAR AO LOBBY
             </Button>
          </div>

        </div>
      </div>
    </div>
  );
};