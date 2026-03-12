import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  Car, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db_firebase } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore';

type Tab = 'empresas' | 'colaboradores' | 'veiculos';

export default function Registrations() {
  const [activeTab, setActiveTab] = useState<Tab>('empresas');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const userStr = localStorage.getItem('fleetcheck_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const q = query(collection(db_firebase, activeTab));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err.code === 'permission-denied') {
        setError('Erro de Permissão: O banco de dados Firestore está bloqueado. Verifique as regras no console.');
      } else {
        setError(`Erro ao carregar ${activeTab} do Firebase`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await deleteDoc(doc(db_firebase, activeTab, id));
      fetchData();
    } catch (err: any) {
      console.error('Error deleting item:', err);
      if (err.code === 'permission-denied') {
        setError('Erro de Permissão: Você não tem permissão para excluir este item.');
      } else {
        setError(`Erro ao excluir item do Firebase`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        const itemRef = doc(db_firebase, activeTab, editingItem.id);
        const { id, ...updateData } = formData;
        await updateDoc(itemRef, updateData);
      } else {
        await addDoc(collection(db_firebase, activeTab), formData);
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving item:', err);
      if (err.code === 'permission-denied') {
        setError('Erro de Permissão: O banco de dados Firestore está bloqueado. Verifique as regras no console.');
      } else {
        setError('Erro ao salvar no Firebase. Verifique as regras de segurança.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormFields = () => {
    if (activeTab === 'empresas') {
      return (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Razão Social</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              value={formData.razaoSocial || ''}
              onChange={e => setFormData({...formData, razaoSocial: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CNPJ</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              value={formData.cnpj || ''}
              onChange={e => setFormData({...formData, cnpj: e.target.value})}
            />
          </div>
        </>
      );
    }
    
    if (activeTab === 'colaboradores') {
      return (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nome Completo</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              value={formData.nome || ''}
              onChange={e => setFormData({...formData, nome: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">E-mail Corporativo (para identificação automática)</label>
            <input 
              type="email"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="exemplo@empresa.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CPF</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.cpf || ''}
                onChange={e => setFormData({...formData, cpf: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cargo</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.cargo || ''}
                onChange={e => setFormData({...formData, cargo: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CNH nº</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.cnh || ''}
                onChange={e => setFormData({...formData, cnh: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Validade CNH</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.validadeCnh || ''}
                onChange={e => setFormData({...formData, validadeCnh: e.target.value})}
              />
            </div>
          </div>
        </>
      );
    }
    
    if (activeTab === 'veiculos') {
      return (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Marca/Modelo</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              value={formData.marcaModelo || ''}
              onChange={e => setFormData({...formData, marcaModelo: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Placa</label>
              <input 
                type="text" required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.placa || ''}
                onChange={e => setFormData({...formData, placa: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Renavam</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.renavam || ''}
                onChange={e => setFormData({...formData, renavam: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cor</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.cor || ''}
                onChange={e => setFormData({...formData, cor: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ano/Modelo</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                value={formData.anoModelo || ''}
                onChange={e => setFormData({...formData, anoModelo: e.target.value})}
              />
            </div>
          </div>
        </>
      );
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Cadastros</h2>
          <p className="text-zinc-500">Gerencie as opções dos formulários</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-2xl font-bold hover:bg-[var(--color-brand-yellow-hover)] transition-all shadow-lg shadow-zinc-200"
        >
          <Plus className="w-5 h-5" />
          Novo Registro
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-zinc-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('empresas')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'empresas' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Empresas
        </button>
        <button
          onClick={() => setActiveTab('colaboradores')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'colaboradores' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Colaboradores
        </button>
        <button
          onClick={() => setActiveTab('veiculos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'veiculos' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Car className="w-4 h-4" />
          Veículos
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {activeTab === 'empresas' ? 'Razão Social' : activeTab === 'colaboradores' ? 'Nome' : 'Veículo'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {activeTab === 'empresas' ? 'CNPJ' : activeTab === 'colaboradores' ? 'CPF' : 'Placa'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">Nenhum registro encontrado.</td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        {activeTab === 'empresas' ? item.razaoSocial : activeTab === 'colaboradores' ? item.nome : item.marcaModelo}
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {activeTab === 'empresas' ? item.cnpj : activeTab === 'colaboradores' ? item.cpf : item.placa}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
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
                  {editingItem ? 'Editar Registro' : 'Novo Registro'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {renderFormFields()}

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-2xl font-bold hover:bg-[var(--color-brand-yellow-hover)] transition-all shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingItem ? (
                    <Save className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {editingItem ? 'Salvar Alterações' : 'Criar Registro'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
