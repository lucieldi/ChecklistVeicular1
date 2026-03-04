import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Loader2,
  AlertCircle,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { ChecklistData } from '../types';

interface ChecklistRecord {
  id: number;
  created_at: string;
  data: ChecklistData;
}

export default function Reports() {
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchChecklists = async () => {
    try {
      const response = await fetch('/api/checklists');
      const data = await response.json();
      setChecklists(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const filteredChecklists = checklists.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.data.colaborador.nome.toLowerCase().includes(searchLower) ||
      record.data.empresa.razaoSocial.toLowerCase().includes(searchLower) ||
      record.data.veiculo.placa.toLowerCase().includes(searchLower) ||
      record.data.veiculo.marcaModelo.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Data',
      'Empresa',
      'CNPJ',
      'Colaborador',
      'CPF',
      'Veículo',
      'Placa',
      'KM Entrega',
      'KM Devolução'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredChecklists.map(record => {
        const date = new Date(record.created_at).toLocaleString('pt-BR');
        return [
          record.id,
          `"${date}"`,
          `"${record.data.empresa.razaoSocial}"`,
          `"${record.data.empresa.cnpj}"`,
          `"${record.data.colaborador.nome}"`,
          `"${record.data.colaborador.cpf}"`,
          `"${record.data.veiculo.marcaModelo}"`,
          `"${record.data.veiculo.placa}"`,
          `"${record.data.veiculo.kmEntrega}"`,
          `"${record.data.veiculo.kmDevolucao}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_checklists_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        <p className="text-zinc-500 font-medium">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Relatórios</h2>
          <p className="text-zinc-500">Visão geral e exportação de checklists</p>
        </div>
        
        <button 
          onClick={exportToCSV}
          disabled={filteredChecklists.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por colaborador, empresa, veículo ou placa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
            />
          </div>
          <div className="text-sm text-zinc-500 font-medium">
            {filteredChecklists.length} registro(s) encontrado(s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">ID</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Data</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Empresa</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Colaborador</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Veículo</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Placa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredChecklists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredChecklists.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">#{record.id}</td>
                    <td className="px-6 py-4 text-zinc-600">
                      {new Date(record.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {record.data.empresa.razaoSocial || '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {record.data.colaborador.nome || '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {record.data.veiculo.marcaModelo || '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {record.data.veiculo.placa || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
