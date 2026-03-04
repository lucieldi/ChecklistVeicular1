/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Car, 
  Truck,
  LogOut,
  Users,
  ClipboardList,
  History,
  Database
} from 'lucide-react';
import { User, ChecklistData } from './types';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import Checklist from './components/Checklist';
import ChecklistHistory from './components/ChecklistHistory';
import Registrations from './components/Registrations';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'checklist' | 'history' | 'users' | 'registrations'>('checklist');
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const [editingChecklistData, setEditingChecklistData] = useState<ChecklistData | null>(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const handleEditChecklist = (id: number, data: ChecklistData) => {
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.ibb.co/LzN2Yg1Z/logo.png" 
              alt="FleetCheck Logo" 
              className="h-10 w-auto"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {user.role === 'admin' ? 'Painel Administrativo' : 'Acesso Colaborador'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-100 p-1 rounded-xl">
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
            
            <button 
              onClick={() => setUser(null)}
              className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-12">
        {view === 'checklist' && (
          <Checklist 
            editingId={editingChecklistId} 
            initialData={editingChecklistData} 
            onFinish={handleFinishEdit}
          />
        )}
        {view === 'history' && <ChecklistHistory onEdit={handleEditChecklist} />}
        {view === 'registrations' && <Registrations />}
        {view === 'users' && <UserManagement />}
      </main>
    </div>
  );
}
