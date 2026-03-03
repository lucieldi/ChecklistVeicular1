import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  User as UserIcon,
  X,
  Plus,
  AlertCircle,
  Loader2,
  Pencil,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'common'>('common');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setRole('common');
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: User) => {
    resetForm();
    setEditingUser(user);
    setUsername(user.username);
    setRole(user.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password: password || undefined, 
          role 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowAddModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        setError(result.message || 'Erro ao processar solicitação');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir usuário');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        <p className="text-zinc-500 font-medium">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Gerenciar Usuários</h2>
          <p className="text-zinc-500">Controle de acesso ao sistema</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-2xl font-bold hover:bg-[var(--color-brand-yellow-hover)] transition-all shadow-lg shadow-zinc-200"
        >
          <UserPlus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Usuário</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Papel</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-zinc-500" />
                    </div>
                    <span className="font-semibold text-zinc-900">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    user.role === 'admin' 
                    ? 'bg-[var(--color-brand-yellow)] text-zinc-900' 
                    : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {user.role === 'admin' && <Shield className="w-3 h-3" />}
                    {user.role === 'admin' ? 'Administrador' : 'Comum'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                      title="Editar Usuário"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {(showAddModal || editingUser) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setEditingUser(null); }}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-900">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button 
                  onClick={() => { setShowAddModal(false); setEditingUser(null); }}
                  className="p-2 text-zinc-400 hover:text-zinc-900 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nome de Usuário</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingUser}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Papel do Usuário</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('common')}
                      className={`px-4 py-3 rounded-2xl border font-bold text-sm transition-all ${
                        role === 'common' 
                        ? 'bg-[var(--color-brand-yellow)] text-zinc-900 border-[var(--color-brand-yellow)]' 
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      Comum
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`px-4 py-3 rounded-2xl border font-bold text-sm transition-all ${
                        role === 'admin' 
                        ? 'bg-[var(--color-brand-yellow)] text-zinc-900 border-[var(--color-brand-yellow)]' 
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      Administrador
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-2xl font-bold hover:bg-[var(--color-brand-yellow-hover)] transition-all shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingUser ? (
                    <Save className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
