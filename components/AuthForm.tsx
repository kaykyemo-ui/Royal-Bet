import React, { useState } from 'react';
import { UserProfile, PixKeyType, AuthMode } from '../types';
import { isOver18, formatCPF, formatPhone } from '../utils/validation';
import { Input } from './Input';
import { Button } from './Button';
import { User, Lock, Mail, Phone, CreditCard, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  onAuthenticate: (mode: AuthMode, formData: Partial<UserProfile>) => { success: boolean; message?: string };
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthenticate }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [formData, setFormData] = useState<Partial<UserProfile>>({ pixKeyType: PixKeyType.CPF });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cpf') formattedValue = formatCPF(value.replace(/\D/g, '').slice(0, 11));
    if (name === 'phone') formattedValue = formatPhone(value.replace(/\D/g, '').slice(0, 11));
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (mode === AuthMode.LOGIN) {
      if ((formData.cpf || '').replace(/\D/g, '').length !== 11) newErrors.cpf = 'CPF inválido';
      if (!formData.password) newErrors.password = 'Informe sua senha';
    }
    if (mode === AuthMode.REGISTER) {
      if (!formData.fullName) newErrors.fullName = 'Nome obrigatório';
      if (!formData.email?.includes('@')) newErrors.email = 'E-mail inválido';
      if (!formData.birthDate || !isOver18(formData.birthDate)) newErrors.birthDate = '+18 apenas';
      if (!formData.pixKey) newErrors.pixKey = 'PIX obrigatório';
      if ((formData.password || '').length < 6) newErrors.password = 'Mínimo 6 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const result = onAuthenticate(mode, formData);
      if (!result.success) setErrors(prev => ({ ...prev, global: result.message || 'Erro na operação' }));
      else if (mode === AuthMode.RECOVERY) {
        setSuccessMessage(result.message || 'Sucesso! Faça login.');
        setTimeout(() => setMode(AuthMode.LOGIN), 2000);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <div className="bg-onix-900/80 backdrop-blur-xl border border-onix-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-accent-primary shadow-accent blur-sm"></div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            {mode === AuthMode.REGISTER ? 'Criar Conta' : mode === AuthMode.RECOVERY ? 'Recuperar' : 'Entrar'}
          </h2>
          <p className="text-gray-400 text-sm">Onixbet - Exclusividade e Sorte</p>
        </div>

        {errors.global && <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm"><AlertCircle size={16} />{errors.global}</div>}
        {successMessage && <div className="mb-6 bg-green-500/10 border border-green-500/50 text-green-200 p-3 rounded-lg flex items-center gap-2 text-sm"><ShieldCheck size={16} />{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === AuthMode.REGISTER && (
            <>
              <Input label="Nome Completo" name="fullName" value={formData.fullName || ''} onChange={handleInputChange} icon={<User size={18} />} error={errors.fullName} />
              <Input label="E-mail" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} icon={<Mail size={18} />} error={errors.email} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nascimento" name="birthDate" type="date" value={formData.birthDate || ''} onChange={handleInputChange} error={errors.birthDate} />
                <Input label="Telefone" name="phone" value={formData.phone || ''} onChange={handleInputChange} icon={<Phone size={18} />} error={errors.phone} />
              </div>
            </>
          )}

          {mode !== AuthMode.RECOVERY && (
            <Input label="CPF" name="cpf" placeholder="000.000.000-00" value={formData.cpf || ''} onChange={handleInputChange} icon={<ShieldCheck size={18} />} error={errors.cpf} />
          )}

          <Input label="Senha" name="password" type="password" value={formData.password || ''} onChange={handleInputChange} icon={<Lock size={18} />} error={errors.password} />

          {mode === AuthMode.REGISTER && (
            <div className="bg-onix-800/50 p-4 rounded-lg border border-onix-800 mb-4">
              <label className="block text-accent-primary text-xs font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} /> Chave PIX
              </label>
              <div className="flex gap-2 mb-3">
                {Object.values(PixKeyType).map((type) => (
                  <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, pixKeyType: type }))} className={`flex-1 text-xs py-2 px-1 rounded transition-colors ${formData.pixKeyType === type ? 'bg-accent-primary text-white font-bold shadow-accent' : 'bg-onix-700 text-gray-400 hover:text-white'}`}>{type}</button>
                ))}
              </div>
              <Input label={`Chave (${formData.pixKeyType})`} name="pixKey" value={formData.pixKey || ''} onChange={handleInputChange} error={errors.pixKey} className="!mb-0" />
            </div>
          )}

          <div className="pt-4">
            <Button type="submit">
              {mode === AuthMode.LOGIN ? 'Entrar' : mode === AuthMode.REGISTER ? 'Cadastrar' : 'Redefinir'}
              <ArrowRight className="inline-block ml-2" size={18} />
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {mode === AuthMode.LOGIN ? 'Ainda não é Onix?' : 'Já é da casa?'}
          <button onClick={() => setMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN)} className="ml-2 text-accent-primary font-bold hover:underline">{mode === AuthMode.LOGIN ? 'Criar conta' : 'Login'}</button>
        </div>
      </div>
    </div>
  );
};