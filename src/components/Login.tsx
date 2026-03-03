import React, { useState } from 'react';
import { LogIn, Shield, User as UserIcon, AlertCircle, Mail, Truck, Check, FileText, Clock, Star, Lock, ArrowRight, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });

      const result = await response.json();

      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Erro ao autenticar');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#154b85] p-6 relative overflow-hidden">
      {/* Grid background effect */}
      <div 
        className="absolute inset-0 opacity-20" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', 
          backgroundSize: '100px 100px',
          backgroundPosition: 'center center'
        }}
      ></div>
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f3866_100%)]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-[#1a3b5c] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10"
      >
        {/* Left Panel */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center items-center text-white bg-[#1a3b5c]">
          <div className="w-20 h-20 bg-[#3b82f6] rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <Truck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Fleet<span className="text-[#f59e0b]">Check</span>
          </h1>
          <p className="text-blue-200 text-sm tracking-widest uppercase mb-12 font-medium">Checklist Veicular Corporativo</p>

          <div className="space-y-6 w-full max-w-sm">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full border border-blue-400/30 flex items-center justify-center bg-blue-400/10 shrink-0">
                <Check className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <span className="text-sm text-blue-100">Inspeções rápidas e padronizadas</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full border border-blue-400/30 flex items-center justify-center bg-blue-400/10 shrink-0">
                <FileText className="w-4 h-4 text-blue-300" />
              </div>
              <span className="text-sm text-blue-100">Histórico e relatórios em tempo real</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full border border-blue-400/30 flex items-center justify-center bg-blue-400/10 shrink-0">
                <Clock className="w-4 h-4 text-blue-300" />
              </div>
              <span className="text-sm text-blue-100">Controle de frota por equipes</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full border border-blue-400/30 flex items-center justify-center bg-blue-400/10 shrink-0">
                <Star className="w-4 h-4 text-blue-300" />
              </div>
              <span className="text-sm text-blue-100">Conformidade e auditoria digital</span>
            </div>
          </div>

          <div className="mt-16 text-sm text-blue-200">
            Novo na plataforma? <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-[#f59e0b] font-bold hover:underline">Criar conta</button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 p-12 bg-[#2b6cb0] flex flex-col justify-center">
          <div className="flex justify-center mb-8">
            <img 
              src="https://raw.githubusercontent.com/lucieldi/ajm-logo/main/ajm-logo.png" 
              alt="Grupo AJM" 
              className="h-20 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.squarespace-cdn.com/content/v1/6351351543787722668e186a/eb71329a-5825-4c07-88d4-555355609653/AJM+Logo+2022+color+transparent.png";
              }}
            />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-8">
            {isRegistering ? 'Criar Conta' : 'Acesso ao Sistema'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-xl text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-[#f59e0b] outline-none transition-all font-medium"
                placeholder="Usuário ou e-mail corporativo"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input 
                type="password" 
                required
                className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-xl text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-[#f59e0b] outline-none transition-all font-medium"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-white">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-white/20 bg-white/10 text-[#f59e0b] focus:ring-[#f59e0b]" />
                Lembrar-me
              </label>
              <a href="#" className="hover:text-blue-200 transition-colors italic">Esqueci a senha</a>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 bg-red-500/20 text-red-100 rounded-xl text-sm border border-red-500/30"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#f59e0b] text-[#1a3b5c] rounded-xl font-bold hover:bg-[#d97706] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide"
            >
              {loading ? 'Aguarde...' : (isRegistering ? 'CRIAR CONTA' : 'ENTRAR')}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-blue-200 text-sm">ou</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>

          <button className="mt-8 w-full py-3.5 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Entrar com SSO Corporativo
          </button>

          {/* Keep the example logins but style them to fit */}
          <div className="mt-8 bg-black/10 p-4 rounded-xl border border-white/10 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200 text-center">Exemplos de Acesso</p>
            
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Administrador</p>
              <div className="flex justify-between text-xs">
                <span className="text-blue-200">E-mail:</span>
                <span className="font-mono text-white">admin@exemplo.com</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-200">Senha:</span>
                <span className="font-mono text-white">admin123</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-1">
              <p className="text-xs font-bold text-white">Usuário Comum</p>
              <div className="flex justify-between text-xs">
                <span className="text-blue-200">E-mail:</span>
                <span className="font-mono text-white">user@exemplo.com</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-200">Senha:</span>
                <span className="font-mono text-white">user123</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-blue-300 text-center">
            Acesso restrito a colaboradores autorizados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
