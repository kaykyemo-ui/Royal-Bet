import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { ArrowLeft, Eye, HelpCircle, RefreshCw, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface ShellGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

export const ShellGame: React.FC<ShellGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [positions, setPositions] = useState<number[]>([0, 1, 2]);
  const [winningCupId, setWinningCupId] = useState<number>(1);
  
  const [gameState, setGameState] = useState<'BETTING' | 'REVEAL_START' | 'SHUFFLING' | 'PICKING' | 'REVEAL_END'>('BETTING');
  const [statusMessage, setStatusMessage] = useState('Encontre a bola amarela');
  const [lastWin, setLastWin] = useState(0);
  const [showRules, setShowRules] = useState(false);

  // Helper for shuffle animation delay
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startGame = async () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      setStatusMessage('Valor inválido');
      return;
    }
    if (bet > user.balance) {
      setStatusMessage('Saldo insuficiente');
      return;
    }

    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Delay the start slightly to allow the scroll to complete visually
    setTimeout(async () => {
        onUpdateBalance(user.balance - bet, bet);
        setLastWin(0);
        
        setPositions([0, 1, 2]); 
        setWinningCupId(1); 
        setGameState('REVEAL_START');
        setStatusMessage('Observe a bola...');

        await wait(1500); // Show ball for 1.5s

        setGameState('SHUFFLING');
        setStatusMessage('Misturando...');
        
        const swaps = 15; 
        const speed = 200; // ms per swap (Fast speed)
        
        let currentPos = [0, 1, 2];

        for (let i = 0; i < swaps; i++) {
          await wait(speed);
          
          const idxA = Math.floor(Math.random() * 3);
          let idxB = Math.floor(Math.random() * 3);
          while (idxB === idxA) {
            idxB = Math.floor(Math.random() * 3);
          }

          const temp = currentPos[idxA];
          currentPos[idxA] = currentPos[idxB];
          currentPos[idxB] = temp;

          setPositions([...currentPos]);
        }

        await wait(300);
        setGameState('PICKING');
        setStatusMessage('Onde está a bola?');
    }, 400); 
  };

  const handleCupClick = (pickedCupId: number) => {
    if (gameState !== 'PICKING') return;

    setGameState('REVEAL_END');

    const bet = parseFloat(betAmount);
    
    if (pickedCupId === winningCupId) {
      // WIN
      const multiplier = 2.5;
      const win = bet * multiplier;
      setLastWin(win);
      onUpdateBalance(user.balance + win, 0);
      setStatusMessage(`PARABÉNS! Você achou! R$ ${win.toFixed(2)}`);
    } else {
      setStatusMessage('Errou! Tente novamente.');
    }

    setTimeout(() => {
        setGameState('BETTING');
        setStatusMessage('Faça sua aposta');
    }, 3000);
  };

  return (
    <div ref={gameRef} className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 scroll-mt-4">
      
      {/* Sidebar */}
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
          COPINHOS <span className="text-neon-yellow">LUCKY</span>
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
                <li>A bola começa no copo do meio.</li>
                <li>Os copos são embaralhados rapidamente.</li>
                <li>Você deve clicar no copo que contém a bola.</li>
                <li>Se acertar, ganha 2.5x o valor apostado.</li>
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

          <Button 
            onClick={startGame} 
            disabled={gameState !== 'BETTING' || user.balance <= 0}
          >
            {gameState === 'BETTING' ? 'JOGAR' : 'JOGANDO...'}
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
          <Button variant="secondary" onClick={onExit} disabled={gameState !== 'BETTING' && gameState !== 'REVEAL_END'} className="flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> LOBBY
          </Button>
        </div>
      </div>

      {/* Game Table */}
      <div className="flex-1 bg-royal-800 rounded-3xl border-8 border-royal-900 relative min-h-[500px] order-1 md:order-2 overflow-hidden flex flex-col items-center shadow-2xl">
        
        {/* Table Felt */}
        <div className="absolute inset-0 bg-indigo-950">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Status */}
        <div className="relative z-10 mt-12 mb-12 h-16 flex items-center justify-center w-full">
            <div className={`
                px-8 py-3 rounded-full backdrop-blur-md border shadow-2xl font-display font-black text-xl uppercase tracking-wider transition-all duration-300
                ${lastWin > 0 ? 'bg-neon-yellow/90 text-royal-900 border-neon-yellow scale-110' : 'bg-black/40 text-white border-white/10'}
            `}>
                {statusMessage}
            </div>
        </div>

        {/* Cups Container */}
        <div className="relative w-full max-w-[600px] h-[300px] z-10 perspective-1000">
          
          {[0, 1, 2].map((cupId) => {
            const currentSlotIndex = positions.indexOf(cupId);
            const leftPos = currentSlotIndex === 0 ? '15%' : currentSlotIndex === 1 ? '50%' : '85%';
            
            const isLifted = 
               gameState === 'REVEAL_START' || 
               (gameState === 'REVEAL_END' && cupId === winningCupId) ||
               (gameState === 'REVEAL_END' && statusMessage.includes('Errou') && cupId === winningCupId); 

            const hasBall = cupId === winningCupId;

            return (
              <div 
                key={cupId}
                className="absolute top-1/2 -translate-y-1/2 w-24 md:w-32 transition-all ease-in-out cursor-pointer"
                style={{
                   left: leftPos,
                   transform: 'translate(-50%, -50%)',
                   transitionDuration: gameState === 'SHUFFLING' ? '200ms' : '500ms',
                   zIndex: 20 
                }}
                onClick={() => handleCupClick(cupId)}
              >
                  {hasBall && (
                    <div 
                        className={`absolute left-1/2 bottom-0 w-8 h-8 md:w-10 md:h-10 bg-neon-yellow rounded-full shadow-[0_0_15px_rgba(204,255,0,0.8)] transition-opacity duration-300`}
                        style={{
                            transform: 'translateX(-50%)',
                            zIndex: -1, 
                            opacity: isLifted ? 1 : 0 
                        }}
                    ></div>
                  )}

                  <div 
                     className={`relative w-full transition-transform duration-500 ${isLifted ? '-translate-y-24' : 'translate-y-0'} ${gameState === 'PICKING' ? 'hover:-translate-y-2 hover:brightness-110' : ''}`}
                  >
                      <div 
                        className="w-full h-28 md:h-36 bg-gradient-to-b from-blue-600 to-royal-900 shadow-2xl relative"
                        style={{
                            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                        }}
                      >
                         <div className="absolute top-[15%] w-full h-4 bg-neon-yellow/80"></div>
                         <div className="absolute left-[30%] top-0 w-8 h-full bg-white/10 skew-x-12 blur-md"></div>
                      </div>
                      
                      {gameState === 'PICKING' && (
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-neon-yellow animate-bounce">
                             <HelpCircle size={24} />
                          </div>
                      )}
                  </div>
              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
};