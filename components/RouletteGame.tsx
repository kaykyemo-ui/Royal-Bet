
import React, { useState, useRef } from 'react';
import { Button } from './Button';
// Add missing import for Input component
import { Input } from './Input';
import { ArrowLeft, HelpCircle, X, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface RouletteGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, amountSpent: number) => void;
  onExit: () => void;
}

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const MULTIPLIERS = [0.5, 1.0, 2.0, 2.5, 3.0];

export const RouletteGame: React.FC<RouletteGameProps> = ({ user, onUpdateBalance, onExit }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [selectedMultiplier, setSelectedMultiplier] = useState(2.0);
  const [selectedType, setSelectedType] = useState<'COLOR' | 'NUMBER' | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Faça sua aposta');
  const [lastWin, setLastWin] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const getNumberColor = (num: number) => num === 0 ? 'green' : RED_NUMBERS.includes(num) ? 'red' : 'black';

  const spinWheel = () => {
    const bet = parseFloat(betAmount);
    if (bet > user.balance || isSpinning || !selectedType) return;
    onUpdateBalance(user.balance - bet, bet);
    setIsSpinning(true);
    setLastWin(0);
    const isWin = Math.random() < 0.10;
    let target: number;
    if (isWin) {
      if (selectedType === 'COLOR') {
        const col = selectedValue === 'RED' ? 'red' : 'black';
        const filtered = WHEEL_NUMBERS.filter(n => getNumberColor(n) === col);
        target = filtered[Math.floor(Math.random() * filtered.length)];
      } else target = selectedValue as number;
    } else {
      if (selectedType === 'COLOR') {
        const other = selectedValue === 'RED' ? 'black' : 'red';
        const filtered = WHEEL_NUMBERS.filter(n => getNumberColor(n) === other || getNumberColor(n) === 'green');
        target = filtered[Math.floor(Math.random() * filtered.length)];
      } else target = WHEEL_NUMBERS.filter(n => n !== selectedValue)[Math.floor(Math.random() * 36)];
    }
    const idx = WHEEL_NUMBERS.indexOf(target);
    const slice = 360 / 37;
    const targetAngle = (idx * slice) + (slice / 2);
    const newRot = rotation + (360 * 10) + (targetAngle - (rotation % 360) + 360) % 360;
    setRotation(newRot);
    setTimeout(() => {
      setIsSpinning(false);
      const landedCol = getNumberColor(target);
      const won = (selectedType === 'COLOR' && ((selectedValue === 'RED' && landedCol === 'red') || (selectedValue === 'BLACK' && landedCol === 'black'))) || (selectedType === 'NUMBER' && target === selectedValue);
      if (won) {
        const win = bet * selectedMultiplier;
        setLastWin(win);
        onUpdateBalance(user.balance + win, 0);
        setStatusMessage(`VOCÊ GANHOU! R$ ${win.toFixed(2)}`);
      } else setStatusMessage(`Deu ${target}. Você perdeu.`);
    }, 6000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col gap-8 items-center">
      <div className="w-full flex justify-between items-center bg-onix-900/50 p-4 rounded-xl border border-onix-800 backdrop-blur-sm">
        <h2 className="text-2xl font-display font-bold text-white">ROLETA <span className="text-accent-primary">ONIX</span></h2>
        <div className="flex items-center gap-4">
           <div className="text-accent-primary font-bold text-sm bg-onix-800 px-3 py-1 rounded-full border border-onix-700 shadow-accent">R$ {user.balance.toFixed(2)}</div>
           <button onClick={() => setShowRules(true)} className="text-gray-400 hover:text-white"><HelpCircle size={20} /></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <div className="flex-1 flex flex-col items-center justify-center bg-onix-900/30 rounded-2xl border border-onix-800 p-8 min-h-[400px] overflow-hidden relative">
           <div className="absolute top-8 z-30 drop-shadow-accent"><div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[24px] border-t-accent-primary border-r-[12px] border-r-transparent"></div></div>
           <div className="relative w-[320px] h-[320px] m-4">
             <div className="w-full h-full rounded-full border-8 border-onix-800 shadow-2xl transition-transform duration-[6000ms] cubic-bezier(0.2, 0, 0, 1)" style={{ transform: `rotate(-${rotation}deg)`, background: `conic-gradient(${WHEEL_NUMBERS.map((n, i) => { const s = (360/37)*i; const e = (360/37)*(i+1); const c = getNumberColor(n); return `${c === 'red' ? '#dc2626' : c === 'black' ? '#09090b' : '#166534'} ${s}deg ${e}deg` }).join(', ')})` }}>
               <div className="absolute inset-0 rounded-full border border-white/5"></div>
               <div className="absolute inset-[35%] rounded-full bg-onix-950 border-4 border-onix-800 shadow-inner z-20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-accent-primary shadow-accent"></div></div>
               {WHEEL_NUMBERS.map((num, i) => (
                 <div key={i} className="absolute top-0 left-0 w-full h-full" style={{ transform: `rotate(${(i * 360/37) + (180/37)}deg)` }}><span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-white">{num}</span></div>
               ))}
             </div>
           </div>
           <p className={`mt-4 font-display font-bold ${lastWin > 0 ? 'text-accent-primary animate-bounce' : 'text-white'}`}>{statusMessage}</p>
        </div>

        <div className="w-full lg:w-[450px] bg-onix-900/80 backdrop-blur-xl border border-onix-800 rounded-2xl p-6 flex flex-col">
          <Input label="Aposta" type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={isSpinning} />
          <div className="grid grid-cols-5 gap-1 mb-6">
            {MULTIPLIERS.map(m => (
              <button key={m} onClick={() => setSelectedMultiplier(m)} className={`py-2 rounded font-bold text-xs ${selectedMultiplier === m ? 'bg-accent-primary text-white shadow-accent' : 'bg-onix-800 text-gray-500'}`}>{m}x</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => {setSelectedType('COLOR'); setSelectedValue('RED')}} className={`py-4 rounded-lg font-bold border-2 ${selectedType === 'COLOR' && selectedValue === 'RED' ? 'border-accent-primary bg-red-600/20' : 'border-onix-700 bg-red-900/10'}`}>VERMELHO</button>
            <button onClick={() => {setSelectedType('COLOR'); setSelectedValue('BLACK')}} className={`py-4 rounded-lg font-bold border-2 ${selectedType === 'COLOR' && selectedValue === 'BLACK' ? 'border-accent-primary bg-onix-800' : 'border-onix-700 bg-onix-950'}`}>PRETO</button>
          </div>
          <Button onClick={spinWheel} disabled={isSpinning}>{isSpinning ? 'GIRANDO...' : 'GIRAR ROLETA'}</Button>
          {lastWin > 0 && (
            <a href="https://wa.me/5534984331211?text=Quero%20meu%20saque%20na%20Onixbet!" target="_blank" className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 animate-bounce">
              <MessageCircle size={20} /> SOLICITAR SAQUE
            </a>
          )}
          <Button variant="secondary" onClick={onExit} className="mt-4"><ArrowLeft size={16} className="inline mr-2" /> VOLTAR</Button>
        </div>
      </div>
    </div>
  );
};
