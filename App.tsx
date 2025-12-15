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
import { HiLoGame } from './components/HiLoGame';
import { AuthState, UserProfile, AuthMode } from './types';
import { Crown, Zap, Dna, Gift, ShieldCheck, Target, Bomb, Spade, Trophy, Eye, HelpCircle, Castle, MoveRight, Dices, Crosshair, ArrowUpDown, User, X, CreditCard, Wallet, Trash2, AlertTriangle, Smartphone, ExternalLink, Loader2, CheckCircle, AlertCircle, RotateCcw, Upload, FileText } from 'lucide-react';

const USERS_STORAGE_KEY = 'royal_bet_users_v1';

const DEPOSIT_OPTIONS = [
  { amount: 1, label: 'R$ 1,00', link: 'https://mpago.la/1hsZftD', bonus: '' },
  { amount: 5, label: 'R$ 5,00', link: 'https://mpago.la/1kto7DR', bonus: '' },
  { amount: 10, label: 'R$ 10,00', link: 'https://mpago.la/2G4MCFx', bonus: 'POPULAR' },
  { amount: 20, label: 'R$ 20,00', link: 'https://mpago.la/2XwGe44', bonus: '' },
  { amount: 50, label: 'R$ 50,00', link: 'https://mpago.la/2qv6ffv', bonus: '' },
  { amount: 100, label: 'R$ 100,00', link: 'https://mpago.la/2HuPwev', bonus: 'VIP' },
];

type DepositStatus = 'IDLE' | 'PROCESSING_1' | 'CHECKING' | 'UPLOAD_PROOF' | 'PROCESSING_2' | 'FAILED_RETRY';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  const [activeGame, setActiveGame] = useState<'NONE' | 'MINES' | 'ROULETTE' | 'BLACKJACK' | 'PENALTY' | 'SHELL' | 'TOWER' | 'HORSE' | 'DICE' | 'TARGET' | 'HILO'>('NONE');
  const [showProfile, setShowProfile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Deposit Flow States
  const [depositStatus, setDepositStatus] = useState<DepositStatus>('IDLE');
  const [pendingDeposit, setPendingDeposit] = useState<{ amount: number, link: string } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Logic to handle persistent authentication
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

  // --- Deposit Workflow Logic ---

  const handleDepositStart = (amount: number, link: string) => {
    window.open(link, '_blank');
    setPendingDeposit({ amount, link });
    setDepositStatus('PROCESSING_1');

    // Simulate Payment Processing (6 seconds)
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
    
    // Simulate Secondary Validation (12 seconds)
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
                   className="group relative bg-royal-800 hover:bg-green-900 border border-royal-600 hover:border-green-500 p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300"
                >
                   {option.bonus && (
                      <span className="absolute -top-2 bg-neon-yellow text-royal-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                         {option.bonus}
                      </span>
                   )}
                   <span className="text-white font-display font-bold text-lg group-hover:text-green-400 transition-colors">
                     {option.label}
                   </span>
                   <div className="flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-green-300/70 mt-1 uppercase tracking-wide">
                      <Smartphone size={10} /> Pagamento Rápido
                   </div>
                </button>
             ))}
          </div>
        );

      case 'PROCESSING_1':
        return (
          <div className="bg-royal-800/50 p-8 rounded-xl border border-royal-700 flex flex-col items-center justify-center text-center animate-fade-in min-h-[200px]">
            <Loader2 className="w-12 h-12 text-neon-yellow animate-spin mb-4" />
            <h4 className="text-white font-bold text-lg mb-2">Processando Pagamento...</h4>
            <p className="text-gray-400 text-sm">Aguarde enquanto verificamos sua transação.</p>
          </div>
        );

      case 'CHECKING':
        return (
          <div className="bg-royal-800/50 p-6 rounded-xl border border-yellow-600/50 flex flex-col items-center justify-center text-center animate-fade-in">
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
          <div className="bg-royal-800/50 p-6 rounded-xl border border-royal-700 flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Upload size={24} className="text-blue-500" />
             </div>
             <h4 className="text-white font-bold text-lg mb-2">Envie o Comprovante</h4>
             <p className="text-gray-300 text-sm mb-6">
               Um de nosso agentes terá que avaliar manualmente o seu pagamento, por gentileza anexe o comprovante de pagamento abaixo.
             </p>
             
             <input 
               type="file" 
               id="proof-upload" 
               className="hidden" 
               accept="image/*,.pdf"
               onChange={handleFileChange}
             />
             
             {!proofFile ? (
               <label 
                 htmlFor="proof-upload"
                 className="w-full bg-royal-700 hover:bg-royal-600 border border-royal-500 border-dashed text-gray-300 font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer mb-2"
               >
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

             <button 
                onClick={handleProofSubmit}
                disabled={!proofFile}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide"
             >
                ENVIAR COMPROVANTE
             </button>
          </div>
        );

      case 'PROCESSING_2':
        return (
          <div className="bg-royal-800/50 p-8 rounded-xl border border-green-500/30 flex flex-col items-center justify-center text-center animate-fade-in min-h-[200px]">
             <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
             <h4 className="text-white font-bold text-lg mb-2">Validando Pagamento</h4>
             <p className="text-gray-400 text-sm">Isso pode levar alguns segundos...</p>
          </div>
        );

      case 'FAILED_RETRY':
        return (
          <div className="bg-royal-800/50 p-6 rounded-xl border border-royal-700 flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <X size={24} className="text-red-500" />
             </div>
             <h4 className="text-white font-bold text-lg mb-2">Ops! Pedimos desculpas.</h4>
             <p className="text-gray-300 text-sm mb-6">
               Não se preocupe, o sistema de pagamento está instável. Tente realizar o pagamento novamente pelo link abaixo.
             </p>
             <button 
                onClick={handleRetry}
                className="w-full bg-neon-yellow hover:bg-[#d9ff40] text-royal-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wider shadow-neon"
             >
                <RotateCcw size={18} /> Tentar Novamente R$ {pendingDeposit?.amount.toFixed(2)}
             </button>
             <button 
               onClick={() => { setDepositStatus('IDLE'); setPendingDeposit(null); setProofFile(null); }}
               className="mt-4 text-xs text-gray-500 hover:text-white underline"
             >
               Cancelar e escolher outro valor
             </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-royal-950 text-white font-sans selection:bg-neon-yellow selection:text-royal-900 overflow-x-hidden">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-yellow/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-purple-900/20 rounded-full blur-[100px]"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      <header className="relative z-20 w-full px-6 py-4 flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveGame('NONE')}>
          <div className="relative">
            <Crown className="text-neon-yellow w-8 h-8 drop-shadow-[0_0_8px_rgba(204,255,0,0.6)]" />
            <div className="absolute inset-0 bg-neon-yellow blur-lg opacity-30 group-hover:opacity-60 transition-opacity"></div>
          </div>
          <span className="text-2xl font-display font-black tracking-tighter text-white">
            ROYAL<span className="text-neon-yellow">BET</span>
          </span>
        </div>
        
        {authState.isAuthenticated && authState.user && (
           <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-gray-400">Saldo</span>
                <span className="text-neon-yellow font-display font-bold">R$ {authState.user.balance.toFixed(2)}</span>
              </div>
              
              <button 
                onClick={() => { setShowProfile(true); setIsDeleting(false); setDepositStatus('IDLE'); setProofFile(null); }}
                className="p-2 rounded-full bg-royal-800 border border-royal-700 text-gray-300 hover:text-white hover:border-neon-yellow transition-all"
                title="Minha Conta"
              >
                <User size={20} />
              </button>

              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded border border-royal-700 hover:border-red-500 hover:text-red-500 text-sm transition-colors"
              >
                Sair
              </button>
           </div>
        )}
      </header>

      {/* Profile Modal */}
      {showProfile && authState.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-royal-900 border border-royal-700 rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                      <User className="text-neon-yellow" /> Minha Conta
                    </h3>
                    <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-white">
                      <X size={24} />
                    </button>
                 </div>

                 <div className="space-y-4 mb-8">
                    <div className="bg-royal-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold">Nome Completo</p>
                      <p className="text-white font-bold">{authState.user.fullName}</p>
                    </div>
                    <div className="bg-royal-800 p-4 rounded-lg flex justify-between">
                       <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">CPF</p>
                          <p className="text-white">{authState.user.cpf}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-bold">Telefone</p>
                          <p className="text-white">{authState.user.phone}</p>
                       </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-royal-800 to-royal-700 p-6 rounded-xl border border-royal-600 relative overflow-hidden">
                       <div className="relative z-10">
                          <p className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-2">
                             <Wallet size={14} /> Saldo Disponível
                          </p>
                          <p className="text-3xl font-display font-bold text-neon-yellow">R$ {authState.user.balance.toFixed(2)}</p>
                       </div>
                       <div className="absolute right-[-20px] top-[-20px] opacity-10">
                          <Crown size={100} />
                       </div>
                    </div>
                 </div>

                 <div className="mb-2">
                    <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                       <CreditCard size={16} className="text-neon-yellow" /> Adicionar Saldo (PIX)
                    </h4>
                    
                    {/* Dynamic Deposit Section */}
                    {renderDepositContent()}

                 </div>
                 
                 {depositStatus === 'IDLE' && (
                    <p className="text-center text-xs text-gray-500 mb-6 flex items-center justify-center gap-1">
                      <ShieldCheck size={12} /> Processado via Mercado Pago
                    </p>
                 )}

                 {/* Danger Zone - Always visible at bottom */}
                 <div className="border-t border-royal-700 pt-6 mt-4 pb-4">
                    {!isDeleting ? (
                      <button 
                        onClick={() => setIsDeleting(true)}
                        className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-bold hover:text-red-400 transition-colors py-2"
                      >
                        <Trash2 size={16} /> EXCLUIR CONTA
                      </button>
                    ) : (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 animate-fade-in">
                        <div className="flex items-start gap-3 mb-4">
                           <AlertTriangle className="text-red-500 shrink-0" size={24} />
                           <div>
                             <h4 className="text-white font-bold text-sm">Tem certeza?</h4>
                             <p className="text-red-200 text-xs mt-1 leading-relaxed">
                               Se tiver algum valor para sacar, faça o saque antes de encerrar a conta ou <strong>o saldo será perdido permanentemente.</strong>
                             </p>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={() => setIsDeleting(false)}
                             className="flex-1 py-2 rounded bg-royal-700 text-white text-xs font-bold hover:bg-royal-600"
                           >
                             CANCELAR
                           </button>
                           <button 
                             onClick={handleDeleteAccount}
                             className="flex-1 py-2 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-lg"
                           >
                             CONFIRMAR EXCLUSÃO
                           </button>
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
            
            {/* Left Side Content (Hero Text) */}
            <div className="hidden lg:block flex-1 space-y-8 max-w-xl">
              <h1 className="text-6xl font-display font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">
                A Sorte Está <br/>
                <span className="text-neon-yellow drop-shadow-[0_0_15px_rgba(204,255,0,0.4)]">Ao Seu Lado</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Entre no mundo da Royal Bet. Slots exclusivos, cassino ao vivo e pagamentos instantâneos via PIX. Cadastre-se agora.
              </p>
              
              <div className="flex gap-6 mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-royal-800 flex items-center justify-center border border-royal-700">
                    <Zap className="text-neon-yellow" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">Saque Rápido</h3>
                    <p className="text-xs text-gray-500">Receba via PIX em segundos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-royal-800 flex items-center justify-center border border-royal-700">
                    <ShieldCheck className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">100% Seguro</h3>
                    <p className="text-xs text-gray-500">Dados criptografados</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Form */}
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
                      Olá, <span className="text-neon-yellow">{authState.user?.fullName?.split(' ')[0] || 'Jogador'}</span>
                    </h2>
                    <p className="text-gray-400">Escolha seu jogo e comece a ganhar.</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {/* Mines Game Card */}
                    <div 
                      onClick={() => setActiveGame('MINES')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Bomb size={32} className="text-neon-yellow" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Campo Minado</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                    {/* Roulette Game Card */}
                    <div 
                      onClick={() => setActiveGame('ROULETTE')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Target size={32} className="text-red-500" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Roleta</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                    {/* Blackjack Game Card */}
                    <div 
                      onClick={() => setActiveGame('BLACKJACK')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Spade size={32} className="text-blue-400" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Blackjack 21</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                    {/* Penalty Game Card */}
                    <div 
                      onClick={() => setActiveGame('PENALTY')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Trophy size={32} className="text-emerald-400" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Pênalti Pro</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                    {/* Shell Game Card */}
                    <div 
                      onClick={() => setActiveGame('SHELL')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <HelpCircle size={32} className="text-yellow-400" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Copinhos</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                    {/* Tower Game Card */}
                    <div 
                      onClick={() => setActiveGame('TOWER')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Castle size={32} className="text-purple-400" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Masmorra</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                     {/* Horse Race Game Card */}
                    <div 
                      onClick={() => setActiveGame('HORSE')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <MoveRight size={32} className="text-orange-400" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Corrida</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                    {/* Dice War Game Card */}
                    <div 
                      onClick={() => setActiveGame('DICE')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Dices size={32} className="text-indigo-400" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Guerra de Dados</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                    {/* Target Game Card */}
                    <div 
                      onClick={() => setActiveGame('TARGET')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Crosshair size={32} className="text-red-500" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Tiro ao Alvo</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                     {/* Hi-Lo Game Card */}
                    <div 
                      onClick={() => setActiveGame('HILO')}
                      className="group relative overflow-hidden rounded-2xl border border-royal-700 bg-royal-800/50 hover:border-neon-yellow/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/50 to-transparent opacity-50"></div>
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                          <div className="p-4 rounded-full bg-black/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <ArrowUpDown size={32} className="text-teal-400" />
                          </div>
                          <h3 className="font-display font-bold text-lg">Duelo Hi-Lo</h3>
                          <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-neon-yellow hover:text-black hover:border-neon-yellow transition-all text-xs font-bold uppercase tracking-wide">
                            Jogar
                          </button>
                        </div>
                    </div>

                 </div>
              </div>
            ) : activeGame === 'MINES' ? (
              <MinesGame 
                user={authState.user!} 
                onUpdateBalance={updateBalance} 
                onExit={() => setActiveGame('NONE')}
              />
            ) : activeGame === 'ROULETTE' ? (
              <RouletteGame 
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
              />
            ) : activeGame === 'BLACKJACK' ? (
               <BlackjackGame
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
               />
            ) : activeGame === 'PENALTY' ? (
              <PenaltyGame 
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
              />
            ) : activeGame === 'SHELL' ? (
               <ShellGame 
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
              />
            ) : activeGame === 'TOWER' ? (
               <TowerGame
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
               />
            ) : activeGame === 'HORSE' ? (
                <HorseRaceGame
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
               />
            ) : activeGame === 'DICE' ? (
                <DiceWarGame
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
               />
            ) : activeGame === 'TARGET' ? (
                <TargetGame
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
               />
            ) : (
                <HiLoGame
                user={authState.user!}
                onUpdateBalance={updateBalance}
                onExit={() => setActiveGame('NONE')}
               />
            )}
          </>
        )}

      </main>

      <footer className="relative z-20 py-8 text-center text-gray-600 text-sm border-t border-white/5 bg-royal-950">
        <p>© 2024 Royal Bet. Jogue com responsabilidade. +18</p>
      </footer>
    </div>
  );
};

export default App;