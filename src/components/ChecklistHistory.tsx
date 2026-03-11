import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Pencil, 
  Loader2,
  AlertCircle,
  Calendar,
  Car,
  User as UserIcon
} from 'lucide-react';
import { ChecklistData } from '../types';
import { db_firebase } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';

interface ChecklistRecord {
  id: string;
  created_at: string;
  creator_name?: string;
  data: ChecklistData;
}

interface ChecklistHistoryProps {
  onEdit: (id: string, data: ChecklistData) => void;
}

export default function ChecklistHistory({ onEdit }: ChecklistHistoryProps) {
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChecklists = async () => {
    try {
      const userStr = localStorage.getItem('fleetcheck_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      let q;
      if (user?.role === 'admin') {
        q = query(collection(db_firebase, 'checklists'), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db_firebase, 'checklists'), 
          where('userId', '==', user?.id)
        );
      }

      const querySnapshot = await getDocs(q);
      let records = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          created_at: data.createdAt || new Date().toISOString(),
          creator_name: data.creator_name,
          data: data as ChecklistData
        };
      });

      // Sort in memory if not already sorted by Firestore (for non-admin users)
      if (user?.role !== 'admin') {
        records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setChecklists(records);
    } catch (err: any) {
      console.error('Error fetching checklists from Firebase:', err);
      if (err.code === 'permission-denied') {
        setError('Erro de Permissão: O banco de dados Firestore está bloqueado. Verifique as regras no console.');
      } else {
        setError('Erro ao carregar histórico do Firebase. Verifique as regras.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }

    try {
      await deleteDoc(doc(db_firebase, 'checklists', id));
      setDeletingId(null);
      fetchChecklists();
    } catch (err) {
      console.error('Error deleting checklist from Firebase:', err);
      setError('Erro ao excluir checklist do Firebase');
      setDeletingId(null);
    }
  };

  const userStr = localStorage.getItem('fleetcheck_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        <p className="text-zinc-500 font-medium">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Histórico de Checklists</h2>
          <p className="text-zinc-500">Gerencie os formulários preenchidos</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {checklists.length === 0 && !error ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">Nenhum checklist encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {checklists.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(record.created_at).toLocaleString('pt-BR')}
                  </div>
                  {record.creator_name && (
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-zinc-100 rounded-md text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                      Criado por: {record.creator_name}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Veículo</p>
                      <p className="font-semibold text-zinc-900">{record.data.veiculo.marcaModelo || 'Não informado'}</p>
                      <p className="text-sm text-zinc-500">Placa: {record.data.veiculo.placa || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Colaborador</p>
                      <p className="font-semibold text-zinc-900">{record.data.colaborador.nome || 'Não informado'}</p>
                      <p className="text-sm text-zinc-500">{record.data.empresa.razaoSocial || 'Empresa não informada'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
                <button 
                  onClick={() => onEdit(record.id, record.data)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 rounded-xl font-bold transition-all"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(record.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    deletingId === record.id 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === record.id ? 'Confirmar?' : 'Excluir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
