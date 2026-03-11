import React, { useState } from 'react';
import { User as UserIcon, AlertCircle, Truck, Check, FileText, Clock, Star, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged
} from 'firebase/auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      // The user sync is now handled by the onAuthStateChanged listener in App.tsx
    } catch (err: any) {
      console.error('Auth error:', err);
      const errorCode = err.code;
      const errorMessage = err.message;

      if (errorMessage === 'Failed to fetch') {
        setError('Erro de conexão com o Firebase. Verifique sua internet ou se o serviço está bloqueado.');
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (errorCode === 'auth/user-disabled') {
        setError('Esta conta foi desativada. Entre em contato com o administrador.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Muitas tentativas malsucedidas. Tente novamente mais tarde ou redefina sua senha.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (errorCode === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else {
        setError(`Erro ao autenticar: ${errorMessage || 'Tente novamente.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#154b85] p-6 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center" 
        style={{ 
          backgroundImage: 'url("https://static.wixstatic.com/media/3ef599_c1d5910aa5c34e4989dee739444ceb14f000.jpg/v1/fill/w_1208,h_621,al_c,q_85,usm_0.33_1.00_0.00,enc_avif,quality_auto/3ef599_c1d5910aa5c34e4989dee739444ceb14f000.jpg")', 
        }}
      ></div>
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f3866_100%)] opacity-80"></div>
      
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
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 p-12 bg-[#2b6cb0] flex flex-col justify-center">
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
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-12 pr-12 py-3.5 bg-white border-none rounded-xl text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-[#f59e0b] outline-none transition-all font-medium"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-white">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-white/20 bg-white/10 text-[#f59e0b] focus:ring-[#f59e0b]" />
                Lembrar-me
              </label>
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
              {loading ? 'Aguarde...' : 'ENTRAR'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
