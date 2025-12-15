import React, { useState } from 'react';
import { UserProfile, PixKeyType, AuthMode } from '../types';
import { isOver18, formatCPF, formatPhone } from '../utils/validation';
import { Input } from './Input';
import { Button } from './Button';
import { User, Lock, Calendar, Phone, CreditCard, Mail, ArrowRight, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';

interface AuthFormProps {
  onAuthenticate: (mode: AuthMode, formData: Partial<UserProfile>) => { success: boolean; message?: string };
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthenticate }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    pixKeyType: PixKeyType.CPF
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      // Allow only numbers
      const numeric = value.replace(/\D/g, '');
      // Limit to 11 digits maximum, formatting happens naturally via utils if possible
      // but ensure we don't block typing if the user is typing fast
      const truncated = numeric.slice(0, 11);
      formattedValue = formatCPF(truncated);
    }
    
    if (name === 'phone') {
      // Allow only numbers
      const numeric = value.replace(/\D/g, '');
      // Limit to 11 digits maximum (DDD + 9 digits)
      const truncated = numeric.slice(0, 11);
      formattedValue = formatPhone(truncated);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Clear global error/success
    if (errors.global) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.global;
        return newErrors;
      });
    }
    if (successMessage) setSuccessMessage(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validations logic based on mode
    if (mode === AuthMode.LOGIN) {
      const cleanCPF = (formData.cpf || '').replace(/\D/g, '');
      if (cleanCPF.length !== 11) newErrors.cpf = 'CPF inválido (deve ter 11 dígitos)';
      if (!formData.password) newErrors.password = 'Informe sua senha';
    }

    if (mode === AuthMode.RECOVERY) {
       if (!formData.email || !formData.email.includes('@')) newErrors.email = 'E-mail inválido';
       if (!formData.password || formData.password.length < 6) newErrors.password = 'A nova senha deve ter no mínimo 6 caracteres';
    }

    if (mode === AuthMode.REGISTER) {
      if (!formData.fullName) newErrors.fullName = 'Nome completo é obrigatório';
      if (!formData.email || !formData.email.includes('@')) newErrors.email = 'E-mail inválido';
      
      if (!formData.birthDate) {
        newErrors.birthDate = 'Data de nascimento é obrigatória';
      } else if (!isOver18(formData.birthDate)) {
        newErrors.birthDate = 'Você deve ser maior de 18 anos para se cadastrar';
      }

      // Strict CPF validation
      const cleanCPF = (formData.cpf || '').replace(/\D/g, '');
      if (cleanCPF.length !== 11) {
        newErrors.cpf = 'CPF deve conter exatamente 11 números';
      }

      // Strict Phone validation
      const cleanPhone = (formData.phone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone = 'Telefone inválido (mínimo 10 números)';
      }

      if (!formData.pixKey) newErrors.pixKey = 'Chave PIX é obrigatória';
      if (!formData.password || formData.password.length < 6) newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Call parent authentication logic
      const result = onAuthenticate(mode, formData);
      
      if (!result.success) {
        setErrors(prev => ({ ...prev, global: result.message || 'Erro na operação' }));
      } else {
        if (mode === AuthMode.RECOVERY) {
          setSuccessMessage(result.message || 'Senha alterada com sucesso! Faça login.');
          setTimeout(() => setMode(AuthMode.LOGIN), 2000);
        }
      }
    }
  };

  const toggleMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setSuccessMessage(null);
    setFormData(prev => ({ pixKeyType: prev.pixKeyType })); // Keep pix type default, clear others implicitly by UI but state remains partial
  };

  const getTitle = () => {
    switch(mode) {
      case AuthMode.REGISTER: return 'Crie sua conta';
      case AuthMode.RECOVERY: return 'Recuperar Senha';
      default: return 'Bem-vindo de volta';
    }
  };

  const getSubtitle = () => {
    switch(mode) {
      case AuthMode.REGISTER: return 'Junte-se ao Royal Bet e comece a apostar';
      case AuthMode.RECOVERY: return 'Informe seu e-mail para redefinir';
      default: return 'Entre para continuar ganhando';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <div className="bg-royal-900/80 backdrop-blur-xl border border-royal-700/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-neon-yellow shadow-neon blur-sm"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            {getTitle()}
          </h2>
          <p className="text-gray-400 text-sm">
            {getSubtitle()}
          </p>
        </div>

        {errors.global && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
             <AlertCircle size={16} className="text-red-500" />
             {errors.global}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-500/10 border border-green-500/50 text-green-200 p-3 rounded-lg flex items-center gap-2 text-sm">
             <ShieldCheck size={16} className="text-green-500" />
             {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === AuthMode.REGISTER && (
            <>
              <Input
                label="Nome Completo"
                name="fullName"
                placeholder="Seu nome completo"
                value={formData.fullName || ''}
                onChange={handleInputChange}
                icon={<User size={18} />}
                error={errors.fullName}
              />

              <Input
                label="E-mail"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email || ''}
                onChange={handleInputChange}
                icon={<Mail size={18} />}
                error={errors.email}
              />
              
              {/* Changed from grid-cols-2 to grid-cols-1 md:grid-cols-2 to fix mobile view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data de Nasc."
                  name="birthDate"
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={handleInputChange}
                  error={errors.birthDate}
                />
                 <Input
                  label="Telefone (Somente números)"
                  name="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  icon={<Phone size={18} />}
                  error={errors.phone}
                  inputMode="numeric"
                />
              </div>
            </>
          )}

          {/* CPF Field - Only for Login and Register */}
          {mode !== AuthMode.RECOVERY && (
            <Input
              label="CPF (Somente números)"
              name="cpf"
              placeholder="000.000.000-00"
              value={formData.cpf || ''}
              onChange={handleInputChange}
              icon={<ShieldCheck size={18} />}
              error={errors.cpf}
              // Removed maxLength constraint to prevent conflict with formatter
              inputMode="numeric"
            />
          )}

          {/* Email Field - Only for Recovery */}
          {mode === AuthMode.RECOVERY && (
             <Input
                label="E-mail Cadastrado"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email || ''}
                onChange={handleInputChange}
                icon={<Mail size={18} />}
                error={errors.email}
              />
          )}

          <Input
            label={mode === AuthMode.RECOVERY ? "Nova Senha" : "Senha"}
            name="password"
            type="password"
            placeholder={mode === AuthMode.RECOVERY ? "Crie uma nova senha" : "••••••••"}
            value={formData.password || ''}
            onChange={handleInputChange}
            icon={<Lock size={18} />}
            error={errors.password}
          />

          {mode === AuthMode.LOGIN && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => toggleMode(AuthMode.RECOVERY)}
                className="text-xs text-gray-400 hover:text-neon-yellow transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {mode === AuthMode.REGISTER && (
            <div className="bg-royal-800/50 p-4 rounded-lg border border-royal-700 mb-4">
              <label className="block text-neon-yellow text-xs font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} /> Chave PIX para Saques
              </label>
              
              <div className="flex gap-2 mb-3">
                {Object.values(PixKeyType).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pixKeyType: type }))}
                    className={`flex-1 text-xs py-2 px-1 rounded transition-colors ${
                      formData.pixKeyType === type 
                        ? 'bg-neon-yellow text-royal-900 font-bold shadow-neon' 
                        : 'bg-royal-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <Input
                label={`Chave PIX (${formData.pixKeyType})`}
                name="pixKey"
                placeholder={formData.pixKeyType === PixKeyType.EMAIL ? 'seu@email.com' : 'Informe a chave'}
                value={formData.pixKey || ''}
                onChange={handleInputChange}
                error={errors.pixKey}
                className="!mb-0" // Override margin for nested input
              />
            </div>
          )}

          <div className="pt-4">
            <Button type="submit">
              {mode === AuthMode.LOGIN && 'Entrar'}
              {mode === AuthMode.REGISTER && 'Cadastrar'}
              {mode === AuthMode.RECOVERY && 'Redefinir Senha'}
              <ArrowRight className="inline-block ml-2 mb-0.5" size={18} />
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {mode === AuthMode.LOGIN ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            {mode !== AuthMode.RECOVERY && (
              <button 
                onClick={() => toggleMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN)}
                className="ml-2 text-neon-yellow hover:text-white font-bold transition-colors focus:outline-none underline decoration-neon-yellow/30 hover:decoration-neon-yellow underline-offset-4"
              >
                {mode === AuthMode.LOGIN ? 'Criar agora' : 'Fazer login'}
              </button>
            )}
            {mode === AuthMode.RECOVERY && (
               <button 
                onClick={() => toggleMode(AuthMode.LOGIN)}
                className="ml-2 text-neon-yellow hover:text-white font-bold transition-colors focus:outline-none underline decoration-neon-yellow/30 hover:decoration-neon-yellow underline-offset-4"
              >
                Voltar para Login
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};