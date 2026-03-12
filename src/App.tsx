/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Truck,
  LogOut,
  Users,
  ClipboardList,
  History,
  Database,
  FileText,
  Loader2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChecklistData } from './types';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import Checklist from './components/Checklist';
import ChecklistHistory from './components/ChecklistHistory';
import Registrations from './components/Registrations';
import Reports from './components/Reports';
import FirebaseSetupGuide from './components/FirebaseSetupGuide';
import { auth, db_firebase } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'checklist' | 'history' | 'users' | 'registrations' | 'reports'>('checklist');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistData, setEditingChecklistData] = useState<ChecklistData | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPermissionError, setIsPermissionError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsPermissionError(false);
      if (firebaseUser) {
        try {
          // Sync with Firestore directly
          const userRef = doc(db_firebase, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          const adminEmails = ['ti@uniqservice.com.br'];
          const shouldBeAdmin = adminEmails.includes(firebaseUser.email || '') || firebaseUser.email?.includes('admin');
          
          let userData: User;

          if (userSnap.exists()) {
            const existingData = userSnap.data() as User;
            if (shouldBeAdmin && existingData.role !== 'admin') {
              // Forced upgrade to admin
              await setDoc(userRef, { role: 'admin' }, { merge: true });
              userData = { ...existingData, id: userSnap.id, role: 'admin' };
            } else {
              userData = { ...existingData, id: userSnap.id };
            }
          } else {
            // New user
            userData = {
              id: firebaseUser.uid,
              username: firebaseUser.email || '',
              role: shouldBeAdmin ? 'admin' : 'common'
            };
            await setDoc(userRef, userData);
          }

          setUser(userData);
          localStorage.setItem('fleetcheck_user', JSON.stringify(userData));
        } catch (error: any) {
          console.error('Error syncing user with Firestore:', error);
          
          if (error.code === 'permission-denied') {
            setIsPermissionError(true);
            setError('Erro de Permissão no Firebase: O banco de dados está bloqueado.');
          } else {
            setError('Erro ao sincronizar perfil: ' + (error.message || 'Erro desconhecido'));
          }

          const localUser = localStorage.getItem('fleetcheck_user');
          if (localUser) {
            setUser(JSON.parse(localUser));
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('fleetcheck_user');
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#154b85] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        <p className="text-blue-100 font-medium animate-pulse">Iniciando FleetCheck...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditChecklist = (id: string, data: ChecklistData) => {
    setEditingChecklistId(id);
    setEditingChecklistData(data);
    setView('checklist');
  };

  const handleFinishEdit = () => {
    setEditingChecklistId(null);
    setEditingChecklistData(null);
    setView('history');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-[110] shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-[100]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img 
              src="https://zpublicidade.com.br/wp-content/uploads/2013/07/Marca-AJM-Sem-Slogan.png" 
              alt="AJM Condomínios" 
              className="h-7 md:h-10 w-auto"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block border-l border-zinc-200 pl-3">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-tight">
                {user.role === 'admin' ? 'Painel Administrativo' : 'Acesso Colaborador'}
              </p>
              <p className="text-[9px] text-zinc-400 font-medium">FleetCheck v1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex bg-zinc-100 p-1 rounded-xl">
              <button 
                onClick={() => {
                  setEditingChecklistId(null);
                  setEditingChecklistData(null);
                  setView('checklist');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'checklist' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Novo
              </button>
              <button 
                onClick={() => setView('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'history' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <History className="w-4 h-4" />
                Histórico
              </button>
              <button 
                onClick={() => setView('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'reports' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Relatórios
              </button>
              {user.role === 'admin' && (
                <>
                  <button 
                    onClick={() => setView('registrations')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      view === 'registrations' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    Cadastros
                  </button>
                  <button 
                    onClick={() => setView('users')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      view === 'users' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Usuários
                  </button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLogout}
                className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all hidden lg:block"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all lg:hidden"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : (
                  <div className="space-y-1.5">
                    <div className="w-6 h-0.5 bg-current"></div>
                    <div className="w-6 h-0.5 bg-current"></div>
                    <div className="w-6 h-0.5 bg-current"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 overflow-hidden"
            >
              <div className="flex flex-col gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
                <button 
                  onClick={() => {
                    setEditingChecklistId(null);
                    setEditingChecklistData(null);
                    setView('checklist');
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    view === 'checklist' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <ClipboardList className="w-5 h-5" />
                  Novo Checklist
                </button>
                <button 
                  onClick={() => { setView('history'); setIsMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    view === 'history' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <History className="w-5 h-5" />
                  Histórico
                </button>
                <button 
                  onClick={() => { setView('reports'); setIsMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    view === 'reports' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Relatórios
                </button>
                {user.role === 'admin' && (
                  <>
                    <button 
                      onClick={() => { setView('registrations'); setIsMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        view === 'registrations' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      <Database className="w-5 h-5" />
                      Cadastros
                    </button>
                    <button 
                      onClick={() => { setView('users'); setIsMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        view === 'users' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      Usuários
                    </button>
                  </>
                )}
                <div className="h-px bg-zinc-200 my-1 mx-4"></div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sair do Sistema
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        {isPermissionError && <FirebaseSetupGuide />}
        
        {!isPermissionError && view === 'checklist' && (
          <Checklist 
            editingId={editingChecklistId} 
            initialData={editingChecklistData} 
            onFinish={handleFinishEdit}
          />
        )}
        {view === 'history' && <ChecklistHistory onEdit={handleEditChecklist} />}
        {view === 'reports' && <Reports />}
        {user.role === 'admin' && view === 'registrations' && <Registrations />}
        {user.role === 'admin' && view === 'users' && <UserManagement />}
      </main>
    </div>
  );
}
