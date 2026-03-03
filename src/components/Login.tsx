import React, { useState } from 'react';
import { LogIn, Shield, User as UserIcon, AlertCircle, Mail } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {isRegistering ? 'Criar Conta' : 'Acesso ao Sistema'}
          </h1>
          <p className="text-zinc-500 text-sm">Checklist de Veículos Corporativos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                placeholder="Seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Senha</label>
            <div className="relative">
              <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="password" 
                required
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : (isRegistering ? 'Criar Conta' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center space-y-4">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
          >
            {isRegistering 
              ? 'Já tem uma conta? Faça login' 
              : 'Não tem uma conta? Cadastre-se'}
          </button>
          
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-left space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">Exemplos de Acesso</p>
            
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-900">Administrador</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">E-mail:</span>
                <span className="font-mono font-medium text-zinc-900">admin@exemplo.com</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Senha:</span>
                <span className="font-mono font-medium text-zinc-900">admin123</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 space-y-2">
              <p className="text-xs font-bold text-zinc-900">Usuário Comum</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">E-mail:</span>
                <span className="font-mono font-medium text-zinc-900">user@exemplo.com</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Senha:</span>
                <span className="font-mono font-medium text-zinc-900">user123</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400">
            Acesso restrito a colaboradores autorizados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
