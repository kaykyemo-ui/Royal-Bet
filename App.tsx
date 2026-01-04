
import React, { useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { MinesGame } from './components/MinesGame';
import { RouletteGame } from './components/RouletteGame';
import { BlackjackGame } from './components/BlackjackGame';
import { PenaltyGame } from './components/PenaltyGame';
import { ShellGame } from './components/ShellGame';
import { TowerGame } from './components/TowerGame';
import { HorseRaceGame } from './components/HorseRaceGame';
import { DiceWarGame } from './components/DiceWarGame';
import { TargetGame } from './components/TargetGame';
import { CrashGame } from './components/CrashGame';
import { AuthState, UserProfile, AuthMode } from './types';
import { Gem, Zap, ShieldCheck, Target, Bomb, Spade, Trophy, Eye, HelpCircle, Castle, MoveRight, Dices, Crosshair, Plane, User, X, CreditCard, Wallet, Trash2, AlertTriangle, Smartphone, Loader2, CheckCircle, AlertCircle, RotateCcw, Upload, FileText } from 'lucide-react';

const USERS_STORAGE_KEY = 'onix_bet_users_v1';

const DEPOSIT_OPTIONS = [
  { amount: 5, label: 'R$ 5,00', link: 'https://mpago.la/28FoD3Q', bonus: '' },
  { amount: 15, label: 'R$ 15,00', link: 'https://mpago.la/2mMe3nX', bonus: '' },
  { amount: 30, label: 'R$ 30,00', link: 'https://mpago.la/31cupgc', bonus: 'POPULAR' },
  { amount: 50, label: 'R$ 50,00', link: 'https://mpago.la/1KwS7GX', bonus: '' },
  { amount: 100, label: 'R$ 100,00', link: 'https://mpago.la/2ZEkMbP', bonus: 'VIP' },
  { amount: 200, label: 'R$ 200,00', link: 'https://mpago.la/1ymVmBv', bonus: '' },
  { amount: 500, label: 'R$ 500,00', link: 'https://mpago.la/129XVSm', bonus: 'PREMIUM' },
];

type DepositStatus = 'IDLE' | 'PROCESSING_1' | 'CHECKING' | 'UPLOAD_PROOF' | 'PROCESSING_2' | 'FAILED_RETRY';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  const [activeGame, setActiveGame] = useState<'NONE' | 'MINES' | 'ROULETTE' | 'BLACKJACK' | 'PENALTY' | 'SHELL' | 'TOWER' | 'HORSE' | 'DICE' | 'TARGET' | 'CRASH'>('NONE');
  const [showProfile, setShowProfile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [depositStatus, setDepositStatus] = useState<DepositStatus>('IDLE');
  const [pendingDeposit, setPendingDeposit] = useState<{ amount: number, link: string } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleAuthenticate = (mode: AuthMode, formData: Partial<UserProfile>): { success: boolean; message?: string } => {
    try {
      const storedUsersJSON = localStorage.getItem(USERS_STORAGE_KEY);
      const storedUsers: UserProfile[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];

      if (mode === AuthMode.REGISTER) {
        const existingCPF = storedUsers.find(u => u.cpf === formData.cpf);
        if (existingCPF) return { success: false, message: 'Este CPF já possui uma conta cadastrada.' };

        const existingEmail = storedUsers.find(u => u.email === formData.email);
        if (existingEmail) return { success: false, message: 'Este e-mail já está em uso.' };

        const newUser: UserProfile = {
          ...formData as UserProfile,
          balance: 0,
          totalSpent: 0
        };

        const updatedUsers = [...storedUsers, newUser];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

        setAuthState({ isAuthenticated: true, user: newUser });
        return { success: true };

      } else if (mode === AuthMode.LOGIN) {
        const user = storedUsers.find(u => u.cpf === formData.cpf);
        if (!user) return { success: false, message: 'CPF não encontrado. Faça o cadastro.' };
        if (user.password !== formData.password) return { success: false, message: 'Senha incorreta.' };

        setAuthState({ isAuthenticated: true, user: user });
        return { success: true };

      } else if (mode === AuthMode.RECOVERY) {
        const userIndex = storedUsers.findIndex(u => u.email === formData.email);
        if (userIndex === -1) return { success: false, message: 'E-mail não encontrado na base de dados.' };

        const updatedUser = { ...storedUsers[userIndex], password: formData.password };
        storedUsers[userIndex] = updatedUser as UserProfile;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));

        return { success: true, message: 'Senha atualizada com sucesso!' };
      }
      return { success: false };
    } catch (error) {
      console.error("Auth Error", error);
      return { success: false, message: 'Erro interno ao processar dados.' };
    }
  };

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, user: null });
    setActiveGame('NONE');
    setShowProfile(false);
    setIsDeleting(false);
    setDepositStatus('IDLE');
    setPendingDeposit(null);
    setProofFile(null);
  };

  const handleDeleteAccount = () => {
    if (!authState.user) return;
    try {
      const storedUsersJSON = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersJSON) {
        let storedUsers: UserProfile[] = JSON.parse(storedUsersJSON);
        storedUsers = storedUsers.filter(u => u.cpf !== authState.user?.cpf);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));
      }
      handleLogout();
    } catch (e) {
      console.error("Error deleting account", e);
      alert("Erro ao excluir conta. Tente novamente.");
    }
  };

  const updateBalance = (newBalance: number, amountSpent: number = 0) => {
    if (authState.user) {
      const updatedUser = {
        ...authState.user,
        balance: newBalance,
        totalSpent: authState.user.totalSpent + amountSpent
      };
      setAuthState({ ...authState, user: updatedUser });
      try {
        const storedUsersJSON = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsersJSON) {
          const storedUsers: UserProfile[] = JSON.parse(storedUsersJSON);
          const userIndex = storedUsers.findIndex(u => u.cpf === updatedUser.cpf);
          if (userIndex !== -1) {
            storedUsers[userIndex] = updatedUser;
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));
          }
        }
      } catch (e) {
        console.error("Failed to persist balance", e);
      }
    }
  };

  const handleDepositStart = (amount: number, link: string) => {
    window.open(link, '_blank');
    setPendingDeposit({ amount, link });
    setDepositStatus('PROCESSING_1');

    setTimeout(() => {
      setDepositStatus('CHECKING');
    }, 6000);
  };

  const handleConfirmPayment = () => {
    setDepositStatus('UPLOAD_PROOF');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProofFile(event.target.files[0]);
    }
  };

  const handleProofSubmit = () => {
    if (!proofFile) return;

    setDepositStatus('PROCESSING_2');
    
    setTimeout(() => {
      if (pendingDeposit) {
        updateBalance(authState.user!.balance + pendingDeposit.amount, 0);
        setDepositStatus('IDLE');
        setPendingDeposit(null);
        setProofFile(null);
        alert(`Sucesso! Comprovante verificado. Depósito de R$ ${pendingDeposit.amount.toFixed(2)} confirmado.`);
      }
    }, 12000);
  };

  const handleReportIssue = () => {
    setDepositStatus('FAILED_RETRY');
  };

  const handleRetry = () => {
    if (pendingDeposit) {
      window.open(pendingDeposit.link, '_blank');
      setDepositStatus('PROCESSING_1');
      setTimeout(() => {
        setDepositStatus('CHECKING');
      }, 6000);
    }
  };

  const renderDepositContent = () => {
    switch (depositStatus) {
      case 'IDLE':
        return (
          <div className="grid grid-cols-2 gap-3">
             {DEPOSIT_OPTIONS.map((option) => (
                <button
                   key={option.amount}
                   onClick={() => handleDepositStart(option.amount, option.link)}
                   className="group relative bg-onix-800 hover:bg-accent-secondary/20 border border-onix-700 hover:border-accent-primary p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300"
                >
                   {option.bonus && (
                      <span className="absolute -top-2 bg-accent-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                         {option.bonus}
                      </span>
                   )}
                   <span className="text-white font-display font-bold text-lg group-hover:text-accent-primary transition-colors">
                     {option.label}
                   </span>
                   <div className="flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-accent-primary/70 mt-1 uppercase tracking-wide">
                      <Smartphone size={10} /> Pagamento Rápido
                   </div>
                </button>
             ))}
          </div>
        );

      case 'PROCESSING_1':
        return (
          <div className="bg-onix-800/50 p-8 rounded-xl border border-onix-700 flex flex-col items-center justify-center text-center animate-fade-in min-h-[200px]">
            <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
            <h4 className="text-white font-bold text-lg mb-2">Processando Pagamento...</h4>
            <p className="text-gray-400 text-sm">Aguarde enquanto verificamos sua transação.</p>
          </div>
        );

      case 'CHECKING':
        return (
          <div className="bg-onix-800/50 p-6 rounded-xl border border-yellow-600/50 flex flex-col items-center justify-center text-center animate-fade-in">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
            <h4 className="text-white font-bold text-lg mb-2">Atenção</h4>
            <p className="text-gray-300 text-sm mb-6 max-w-xs">
              Estamos com dificuldade para identificar seu pagamento automaticamente devido à alta demanda.
            </p>
            <div className="flex flex-col gap-3 w-full">
               <button 
                 onClick={handleConfirmPayment}
                 className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
               >
                 <CheckCircle size={18} /> JÁ PAGUEI
               </button>
               <button 
                 onClick={handleReportIssue}
                 className="w-full bg-red-500/10 border border-red-500 hover:bg-red-500 hover:text-white text-red-500 font-bold py-3 rounded-lg transition-colors text-sm"
               >
                 Tive dificuldade / Não paguei
               </button>
            </div>
          </div>
        );

      case 'UPLOAD_PROOF':
        return (
          <div className="bg-onix-800/50 p-6 rounded-xl border border-onix-700 flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Upload size={24} className="text-blue-500" />
             </div>
             <h4 className="text-white font-bold text-lg mb-2">Envie o Comprovante</h4>
             <p className="text-gray-300 text-sm mb-6">
               Um de nosso agentes terá que avaliar manualmente o seu pagamento, por gentileza anexe o comprovante de pagamento abaixo.
             </p>
             <input type="file" id="proof-upload" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
             {!proofFile ? (
               <label htmlFor="proof-upload" className="w-full bg-onix-800 hover:bg-onix-700 border border-onix-700 border-dashed text-gray-300 font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer mb-2">
                 <Upload size={20} />
                 <span className="text-xs uppercase">Clique para selecionar</span>
               </label>
             ) : (
               <div className="w-full bg-green-900/20 border border-green-500/30 p-3 rounded-lg flex items-center gap-3 mb-4">
                  <FileText className="text-green-500" size={20} />
                  <span className="text-sm text-white truncate flex-1 text-left">{proofFile.name}</span>
                  <button onClick={() => setProofFile(null)} className="text-red-400 hover:text-red-300"><X size={16} /></button>
               </div>
             )}
             <button onClick={handleProofSubmit} disabled={!proofFile} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide">
                ENVIAR COMPROVANTE
             </button>
          </div>
        );

      case 'PROCESSING_2':
        return (
          <div className="bg-onix-800/50 p-8 rounded-xl border border-green-500/30 flex flex-col items-center justify-center text-center animate-fade-in min-h-[200px]">
             <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
             <h4 className="text-white font-bold text-lg mb-2">Validando Pagamento</h4>
             <p className="text-gray-400 text-sm">Isso pode levar alguns segundos...</p>
          </div>
        );

      case 'FAILED_RETRY':
        return (
          <div className="bg-onix-800/50 p-6 rounded-xl border border-onix-700 flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <X size={24} className="text-red-500" />
             </div>
             <h4 className="text-white font-bold text-lg mb-2">Ops! Pedimos desculpas.</h4>
             <p className="text-gray-300 text-sm mb-6">
               Não se preocupe, o sistema de pagamento está instável. Tente realizar o pagamento novamente pelo link abaixo.
             </p>
             <button onClick={handleRetry} className="w-full bg-accent-primary hover:bg-accent-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wider shadow-accent">
                <RotateCcw size={18} /> Tentar Novamente R$ {pendingDeposit?.amount.toFixed(2)}
             </button>
             <button onClick={() => { setDepositStatus('IDLE'); setPendingDeposit(null); setProofFile(null); }} className="mt-4 text-xs text-gray-500 hover:text-white underline">
               Cancelar e escolher outro valor
             </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-onix-950 text-white font-sans selection:bg-accent-primary selection:text-white overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-secondary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      <header className="relative z-20 w-full px-6 py-4 flex justify-between items-center border-b border-white/5 backdrop-blur-sm bg-onix-950/80">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveGame('NONE')}>
          <div className="relative">
            <Gem className="text-accent-primary w-8 h-8 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" />
            <div className="absolute inset-0 bg-accent-primary blur-lg opacity-30 group-hover:opacity-60 transition-opacity"></div>
          </div>
          <span className="text-2xl font-display font-black tracking-tighter text-white">
            ONIX<span className="text-accent-primary">BET</span>
          </span>
        </div>
        
        {authState.isAuthenticated && authState.user && (
           <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-gray-500">Saldo</span>
                <span className="text-accent-primary font-display font-bold">R$ {authState.user.balance.toFixed(2)}</span>
              </div>
              <button onClick={() => { setShowProfile(true); setIsDeleting(false); setDepositStatus('IDLE'); setProofFile(null); }} className="p-2 rounded-full bg-onix-800 border border-onix-700 text-gray-300 hover:text-white hover:border-accent-primary transition-all shadow-accent">
                <User size={20} />
              </button>
              <button onClick={handleLogout} className="px-4 py-2 rounded border border-onix-700 hover:border-red-500 hover:text-red-500 text-sm transition-colors">
                Sair
              </button>
           </div>
        )}
      </header>

      {showProfile && authState.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-onix-900 border border-onix-700 rounded-2xl w-full max-md relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                      <User className="text-accent-primary" /> Minha Conta
                    </h3>
                    <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-white">
                      <X size={24} />
                    </button>
                 </div>

                 <div className="space-y-4 mb-8">
                    <div className="bg-onix-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold">Nome Completo</p>
                      <p className="text-white font-bold">{authState.user.fullName}</p>
                    </div>
                    <div className="bg-onix-800 p-4 rounded-lg flex justify-between">
                       <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">CPF</p>
                          <p className="text-white">{authState.user.cpf}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-bold">Telefone</p>
                          <p className="text-white">{authState.user.phone}</p>
                       </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-onix-800 to-onix-900 p-6 rounded-xl border border-onix-700 relative overflow-hidden">
                       <div className="relative z-10">
                          <p className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-2">
                             <Wallet size={14} /> Saldo Disponível
                          </p>
                          <p className="text-3xl font-display font-bold text-accent-primary">R$ {authState.user.balance.toFixed(2)}</p>
                       </div>
                       <div className="absolute right-[-20px] top-[-20px] opacity-5">
                          <Gem size={100} />
                       </div>
                    </div>
                 </div>

                 <div className="mb-2">
                    <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                       <CreditCard size={16} className="text-accent-primary" /> Adicionar Saldo (PIX)
                    </h4>
                    {renderDepositContent()}
                 </div>
                 
                 {depositStatus === 'IDLE' && (
                    <p className="text-center text-xs text-gray-500 mb-6 flex items-center justify-center gap-1">
                      <ShieldCheck size={12} /> Pagamentos via OnixPay
                    </p>
                 )}

                 <div className="border-t border-onix-800 pt-6 mt-4 pb-4">
                    {!isDeleting ? (
                      <button onClick={() => setIsDeleting(true)} className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-bold hover:text-red-400 transition-colors py-2">
                        <Trash2 size={16} /> EXCLUIR CONTA
                      </button>
                    ) : (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 animate-fade-in">
                        <div className="flex items-start gap-3 mb-4">
                           <AlertTriangle className="text-red-500 shrink-0" size={24} />
                           <div>
                             <h4 className="text-white font-bold text-sm">Tem certeza?</h4>
                             <p className="text-red-200 text-xs mt-1 leading-relaxed">
                               O encerramento da conta resultará na <strong>perda permanente do saldo.</strong>
                             </p>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => setIsDeleting(false)} className="flex-1 py-2 rounded bg-onix-800 text-white text-xs font-bold hover:bg-onix-700">CANCELAR</button>
                           <button onClick={handleDeleteAccount} className="flex-1 py-2 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-lg">CONFIRMAR</button>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {!authState.isAuthenticated ? (
          <div className="w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="hidden lg:block flex-1 space-y-8 max-w-xl">
              <h1 className="text-6xl font-display font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-500">
                O Prestígio da <br/>
                <span className="text-accent-primary drop-shadow-[0_0_15px_rgba(217,70,239,0.4)]">Aposta Online</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Bem-vindo à Onixbet. O destino final para jogadores que buscam elite, slots exclusivos e pagamentos instantâneos.
              </p>
              <div className="flex gap-6 mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-onix-800 flex items-center justify-center border border-onix-700">
                    <Zap className="text-accent-primary" size={24} />
                  </div>
                  <div><h3 className="font-bold">Saque Onix</h3><p className="text-xs text-gray-500">Receba em segundos</p></div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-onix-800 flex items-center justify-center border border-onix-700">
                    <ShieldCheck className="text-accent-secondary" size={24} />
                  </div>
                  <div><h3 className="font-bold">Segurança Máxima</h3><p className="text-xs text-gray-500">Criptografia de ponta</p></div>
                </div>
              </div>
            </div>
            <div className="w-full flex-1">
               <AuthForm onAuthenticate={handleAuthenticate} />
            </div>
          </div>
        ) : (
          <>
            {activeGame === 'NONE' ? (
              <div className="w-full max-w-6xl animate-fade-in">
                 <div className="text-center mb-12">
                    <h2 className="text-4xl font-display font-bold mb-4">
                      Olá, <span className="text-accent-primary">{authState.user?.fullName?.split(' ')[0] || 'Jogador'}</span>
                    </h2>
                    <p className="text-gray-400">Seu império de apostas começa aqui.</p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    <GameCard title="Campo Minado" icon={<Bomb size={32} />} color="from-purple-900/50" onClick={() => setActiveGame('MINES')} />
                    <GameCard title="Roleta" icon={<Target size={32} />} color="from-fuchsia-900/50" onClick={() => setActiveGame('ROULETTE')} />
                    <GameCard title="Blackjack" icon={<Spade size={32} />} color="from-violet-900/50" onClick={() => setActiveGame('BLACKJACK')} />
                    <GameCard title="Pênalti" icon={<Trophy size={32} />} color="from-indigo-900/50" onClick={() => setActiveGame('PENALTY')} />
                    <GameCard title="Copinhos" icon={<HelpCircle size={32} />} color="from-zinc-900/50" onClick={() => setActiveGame('SHELL')} />
                    <GameCard title="Masmorra" icon={<Castle size={32} />} color="from-pink-900/50" onClick={() => setActiveGame('TOWER')} />
                    <GameCard title="Corrida" icon={<MoveRight size={32} />} color="from-slate-900/50" onClick={() => setActiveGame('HORSE')} />
                    <GameCard title="Dados" icon={<Dices size={32} />} color="from-purple-800/50" onClick={() => setActiveGame('DICE')} />
                    <GameCard title="Alvo" icon={<Crosshair size={32} />} color="from-fuchsia-800/50" onClick={() => setActiveGame('TARGET')} />
                    <GameCard title="Onix Fly" icon={<Plane size={32} className="rotate-[-45deg]" />} color="from-accent-primary/20" onClick={() => setActiveGame('CRASH')} />
                 </div>
              </div>
            ) : activeGame === 'MINES' ? <MinesGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'ROULETTE' ? <RouletteGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'BLACKJACK' ? <BlackjackGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'PENALTY' ? <PenaltyGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'SHELL' ? <ShellGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'TOWER' ? <TowerGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'HORSE' ? <HorseRaceGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'DICE' ? <DiceWarGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                activeGame === 'TARGET' ? <TargetGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} /> :
                <CrashGame user={authState.user!} onUpdateBalance={updateBalance} onExit={() => setActiveGame('NONE')} />}
          </>
        )}
      </main>
      <footer className="relative z-20 py-8 text-center text-gray-600 text-sm border-t border-white/5 bg-onix-950">
        <p>© 2024 Onixbet. Jogue com responsabilidade. +18</p>
      </footer>
    </div>
  );
};

const GameCard = ({ title, icon, color, onClick }: any) => (
    <div onClick={onClick} className="group relative overflow-hidden rounded-2xl border border-onix-800 bg-onix-900/50 hover:border-accent-primary/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} to-transparent opacity-50`}></div>
        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg text-accent-primary">
            {icon}
          </div>
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-all text-xs font-bold uppercase tracking-wide">Jogar</button>
        </div>
    </div>
);

export default App;
