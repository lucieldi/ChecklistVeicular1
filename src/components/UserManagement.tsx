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
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { db_firebase } from '../lib/firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, setDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

// Secondary Firebase app to create users without signing out the admin
const firebaseConfig = {
  apiKey: "AIzaSyD26v9EVZljibvV2vqlWizqVuChKRumyys",
  authDomain: "checklistauto-558e2.firebaseapp.com",
  projectId: "checklistauto-558e2",
  storageBucket: "checklistauto-558e2.firebasestorage.app",
  messagingSenderId: "318214932522",
  appId: "1:318214932522:web:651c4f1d868c45f5ef1b53",
};

const secondaryApp = getApps().find(app => app.name === 'Secondary') 
  || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState('');
  
  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'common'>('common');
  const [submitting, setSubmitting] = useState(false);

  const userStr = localStorage.getItem('fleetcheck_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db_firebase, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users from Firebase:', err);
      setError('Erro ao carregar usuários do Firebase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setPassword('');
    setShowPassword(false);
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
    setFullName(user.fullName || '');
    setRole(user.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingUser) {
        const userRef = doc(db_firebase, 'users', editingUser.id);
        await updateDoc(userRef, { role, fullName });
        
        setShowAddModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        // Create new user in Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, username, password);
        const newUser = userCredential.user;

        // Save user info in Firestore
        await setDoc(doc(db_firebase, 'users', newUser.uid), {
          username: username,
          fullName: fullName,
          role: role
        });

        // Sign out from secondary auth to be clean
        await secondaryAuth.signOut();

        setShowAddModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Error saving user in Firebase:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido');
      } else {
        setError('Erro ao salvar usuário no Firebase');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db_firebase, 'users', userToDelete.id));
      
      // Delete from local SQLite database via server API
      await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });

      // If deleting current user, also delete from Firebase Auth
      const auth = getAuth();
      if (userToDelete.id === auth.currentUser?.uid) {
        await deleteUser(auth.currentUser);
        window.location.reload(); // Force logout/refresh
      }

      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Erro ao excluir usuário');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-zinc-900">Acesso Negado</h2>
        <p className="text-zinc-500">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">Gerenciar Usuários</h2>
          <p className="text-zinc-500">Controle de papéis e acesso ao sistema</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#b46e0a] text-white/90 rounded-xl font-bold hover:bg-[#965a08] transition-all shadow-lg shadow-zinc-200"
          >
            <UserPlus className="w-5 h-5" />
            Novo Usuário
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-blue-50/30 border-b border-blue-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-blue-400">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-blue-400">Papel</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-blue-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-zinc-900 truncate">{user.fullName || 'Sem Nome'}</span>
                        <span className="text-xs text-zinc-500 truncate">{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'admin' 
                      ? 'bg-[#f59e0b] text-zinc-900' 
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user.role === 'admin' ? 'Administrador' : 'Comum'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(isAdmin || currentUser?.id === user.id) && (
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Editar Usuário"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      )}
                      {isAdmin && (
                        <button 
                          onClick={() => setUserToDelete(user)}
                          className="p-2 text-blue-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Excluir Usuário?</h3>
              <p className="text-zinc-500 mb-8">
                Tem certeza que deseja excluir <strong>{userToDelete.username}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-[#f59e0b] transition-all"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nome Completo do Usuário"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Nome de Usuário (E-mail)</label>
                  <input 
                    type="email" 
                    required
                    disabled={!!editingUser}
                    className={`w-full px-4 py-3 border border-blue-100 rounded-xl outline-none transition-all ${
                      editingUser ? 'bg-zinc-100 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-[#f59e0b]'
                    }`}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="exemplo@email.com"
                  />
                </div>

                {!editingUser && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Senha</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-[#f59e0b] transition-all"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Papel do Usuário</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => setRole('common')}
                      className={`px-4 py-3 rounded-xl border font-bold text-sm transition-all disabled:opacity-50 ${
                        role === 'common' 
                        ? 'bg-[#f59e0b] text-zinc-900 border-[#f59e0b]' 
                        : 'bg-white text-blue-500 border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      Comum
                    </button>
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => setRole('admin')}
                      className={`px-4 py-3 rounded-xl border font-bold text-sm transition-all disabled:opacity-50 ${
                        role === 'admin' 
                        ? 'bg-[#f59e0b] text-zinc-900 border-[#f59e0b]' 
                        : 'bg-white text-blue-500 border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      Administrador
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#f59e0b] text-zinc-900 rounded-xl font-bold hover:bg-[#d97706] transition-all shadow-[0_4px_0_rgb(180,110,10)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
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
