
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { ArrowLeft, Gem, TrendingUp, AlertTriangle, HelpCircle, X, MessageCircle, Play, Wallet } from 'lucide-react';
import { UserProfile } from '../types';

interface CrashGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

export const CrashGame: React.FC<CrashGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const [betAmount, setBetAmount] = useState<string>('10');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [gameState, setGameState] = useState<'IDLE' | 'FLYING' | 'CRASHED' | 'CASHED_OUT'>('IDLE');
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [lastWin, setLastWin] = useState<number>(0);
  const [showRules, setShowRules] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);

  const generateCrashPoint = () => {
    // --- LÓGICA DE CASSINO ONIXBET: 10% DE CHANCE DE VITÓRIA ---
    const isLuckyRound = Math.random() < 0.10;

    if (!isLuckyRound) {
      // 90% das vezes: Instant Crash ou crash baixíssimo (1.00x a 1.08x)
      // O usuário mal tem tempo de reagir antes de explodir.
      return 1.00 + (Math.random() * 0.08);
    } else {
      // 10% das vezes: O voo é real. Gera um multiplicador entre 1.5x e 10x.
      const rand = Math.random();
      const result = 1.5 + (rand * 8.5);
      return Math.floor(result * 100) / 100;
    }
  };

  const startGame = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0 || bet > user.balance) return;

    onUpdateBalance(user.balance - bet, bet);
    setGameState('FLYING');
    setMultiplier(1.00);
    setLastWin(0);
    
    const point = generateCrashPoint();
    setCrashPoint(point);
    
    startTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updateMultiplier);
  };

  const updateMultiplier = (time: number) => {
    const elapsed = (time - startTimeRef.current) / 1000;
    // Crescimento exponencial: m = e^(0.15 * t)
    const currentMult = Math.pow(Math.E, 0.15 * elapsed);
    
    if (currentMult >= crashPoint) {
      setGameState('CRASHED');
      setMultiplier(crashPoint); // Garante que exiba o ponto exato da explosão
      setHistory(prev => [crashPoint, ...prev].slice(0, 8));
      cancelAnimationFrame(requestRef.current!);
    } else {
      setMultiplier(currentMult);
      requestRef.current = requestAnimationFrame(updateMultiplier);
    }
  };

  const handleCashOut = () => {
    if (gameState !== 'FLYING') return;
    
    const win = parseFloat(betAmount) * multiplier;
    setLastWin(win);
    onUpdateBalance(user.balance + win, 0);
    setGameState('CASHED_OUT');
    setHistory(prev => [multiplier, ...prev].slice(0, 8));
    cancelAnimationFrame(requestRef.current!);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col lg:flex-row gap-6 p-4">
      {/* Coluna de Controles */}
      <div className="w-full lg:w-80 bg-onix-900/80 backdrop-blur-xl border border-onix-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="bg-onix-800 px-3 py-1 rounded-full border border-onix-700 flex items-center gap-2">
            <Wallet size={14} className="text-accent-primary" />
            <span className="text-accent-primary font-bold text-sm">R$ {user.balance.toFixed(2)}</span>
          </div>
          <button onClick={() => setShowRules(true)} className="text-gray-500 hover:text-white transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-display font-black text-white italic tracking-tighter">
            ONIX<span className="text-accent-primary">FLY</span>
          </h2>
          
          <div>
            <label className="block text-gray-500 text-[10px] font-bold uppercase mb-2">Valor da Entrada</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-primary font-bold">R$</span>
              <input 
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={gameState === 'FLYING'}
                className="w-full bg-onix-950 border-2 border-onix-800 rounded-xl py-3 pl-10 pr-4 text-white font-bold focus:border-accent-primary focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['10', '20', '50', '100'].map(val => (
              <button 
                key={val}
                onClick={() => setBetAmount(val)}
                disabled={gameState === 'FLYING'}
                className="py-2 bg-onix-800 hover:bg-onix-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-30"
              >
                R$ {val}
              </button>
            ))}
          </div>

          {gameState !== 'FLYING' ? (
            <Button onClick={startGame} disabled={user.balance < parseFloat(betAmount)} className="h-16 text-lg">
              <Play className="inline mr-2 fill-current" size={20} /> DECOLAR
            </Button>
          ) : (
            <button 
              onClick={handleCashOut}
              className="w-full h-16 bg-green-500 hover:bg-green-400 text-onix-950 font-black text-xl rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all animate-pulse"
            >
              SACAR R$ {(parseFloat(betAmount) * multiplier).toFixed(2)}
            </button>
          )}

          {lastWin > 0 && (
            <a 
              href="https://wa.me/5534984331211?text=Subi%20na%20Onixbet!%20Quero%20sacar%20meus%20lucros!"
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-3 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary rounded-xl font-bold text-sm hover:bg-accent-primary/20 transition-all"
            >
              <MessageCircle size={18} /> SOLICITAR SAQUE
            </a>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-onix-800">
          <button onClick={onExit} className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white font-bold text-sm py-2">
            <ArrowLeft size={16} /> VOLTAR AO LOBBY
          </button>
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="flex-1 bg-onix-900 border-8 border-onix-800 rounded-3xl relative min-h-[400px] overflow-hidden flex flex-col">
        {/* Histórico Superior */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 overflow-x-hidden">
          {history.map((h, i) => (
            <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-black border ${h >= 2 ? 'text-accent-primary border-accent-primary/30 bg-accent-primary/5' : 'text-gray-500 border-onix-700 bg-onix-800'}`}>
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Gráfico/Animação */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d946ef 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>

          <div className="text-center z-10 select-none">
            <h3 className={`text-7xl md:text-9xl font-display font-black italic transition-all ${gameState === 'CRASHED' ? 'text-red-500 scale-90' : 'text-white'}`}>
              {multiplier.toFixed(2)}<span className="text-accent-primary">x</span>
            </h3>
            {gameState === 'CRASHED' && (
              <div className="mt-4 flex flex-col items-center animate-bounce">
                <AlertTriangle className="text-red-500 mb-2" size={48} />
                <span className="bg-red-500 text-white font-black px-6 py-2 rounded-full uppercase tracking-widest text-xl">A Gema Explodiu!</span>
              </div>
            )}
            {gameState === 'CASHED_OUT' && (
              <div className="mt-4 flex flex-col items-center animate-fade-in">
                <TrendingUp className="text-green-500 mb-2" size={48} />
                <span className="bg-green-500 text-onix-950 font-black px-6 py-2 rounded-full uppercase tracking-widest text-xl">Lucro Garantido!</span>
              </div>
            )}
          </div>

          {/* Flying Object */}
          {gameState === 'FLYING' && (
            <div 
              className="absolute bottom-10 left-10 transition-all duration-100 ease-linear pointer-events-none"
              style={{ 
                transform: `translate(${Math.min(multiplier * 35, 400)}px, -${Math.min(multiplier * 25, 300)}px)` 
              }}
            >
              <div className="relative">
                <Gem className="text-accent-primary w-12 h-12 drop-shadow-[0_0_15px_#d946ef]" />
                <div className="absolute -bottom-1 -left-1 w-14 h-1 bg-accent-primary blur-md opacity-50 -rotate-45"></div>
              </div>
            </div>
          )}
        </div>

        {/* Eixo X/Y */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-onix-800"></div>
        <div className="absolute top-0 left-0 w-1 h-full bg-onix-800"></div>
      </div>

      {/* Modal de Regras */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowRules(false)}>
          <div className="bg-onix-900 border border-onix-700 p-8 rounded-2xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <HelpCircle className="text-accent-primary" /> Como Jogar
            </h2>
            <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
              <p>1. Escolha o valor da sua aposta e clique em <strong className="text-white">DECOLAR</strong>.</p>
              <p>2. A Gema Onix começará a subir e o multiplicador aumentará.</p>
              <p>3. Clique em <strong className="text-green-500">SACAR</strong> a qualquer momento para multiplicar seu dinheiro pelo valor atual.</p>
              <p>4. <strong className="text-red-500">CUIDADO:</strong> Se a gema explodir antes de você sacar, sua aposta será perdida!</p>
              <p>5. O tempo é o seu maior inimigo e seu melhor aliado. Boa sorte!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
