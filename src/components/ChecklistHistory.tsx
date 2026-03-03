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

interface ChecklistRecord {
  id: number;
  created_at: string;
  data: ChecklistData;
}

interface ChecklistHistoryProps {
  onEdit: (id: number, data: ChecklistData) => void;
}

export default function ChecklistHistory({ onEdit }: ChecklistHistoryProps) {
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChecklists = async () => {
    try {
      const response = await fetch('/api/checklists');
      const data = await response.json();
      setChecklists(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar histórico de checklists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este checklist?')) return;

    try {
      await fetch(`/api/checklists/${id}`, { method: 'DELETE' });
      fetchChecklists();
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir checklist');
    }
  };

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
                <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                  <Calendar className="w-4 h-4" />
                  {new Date(record.created_at).toLocaleString('pt-BR')}
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
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
