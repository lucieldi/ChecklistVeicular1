import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Loader2,
  AlertCircle,
  Download,
  Search,
  Filter,
  FileDown,
  Eye
} from 'lucide-react';
import { ChecklistData } from '../types';
import { db_firebase } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ChecklistRecord {
  id: string;
  created_at: string;
  creator_name?: string;
  data: ChecklistData;
}

export default function Reports() {
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });

  const fetchChecklists = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const userStr = localStorage.getItem('fleetcheck_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      let constraints: any[] = [orderBy('createdAt', 'desc')];

      if (user?.role !== 'admin') {
        constraints.push(where('userId', '==', user?.id));
      }

      if (dateFilter.start) {
        constraints.push(where('createdAt', '>=', new Date(dateFilter.start).toISOString()));
      }
      if (dateFilter.end) {
        // Set end of day
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999);
        constraints.push(where('createdAt', '<=', endDate.toISOString()));
      }

      if (isLoadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(20)); // Fetch 20 at a time to save credits

      const q = query(collection(db_firebase, 'checklists'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(newLastDoc);
      setHasMore(querySnapshot.docs.length === 20);

      const records = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          created_at: data.createdAt || new Date().toISOString(),
          creator_name: data.creator_name,
          data: data as ChecklistData
        };
      });

      if (isLoadMore) {
        setChecklists(prev => [...prev, ...records]);
      } else {
        setChecklists(records);
      }
    } catch (err: any) {
      console.error('Error fetching reports from Firebase:', err);
      setError('Erro ao carregar relatórios. Verifique sua conexão ou permissões.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [dateFilter]);

  const userStr = localStorage.getItem('fleetcheck_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';

  const filteredChecklists = checklists.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.data.colaborador.nome.toLowerCase().includes(searchLower) ||
      record.data.empresa.razaoSocial.toLowerCase().includes(searchLower) ||
      record.data.veiculo.placa.toLowerCase().includes(searchLower) ||
      record.data.veiculo.marcaModelo.toLowerCase().includes(searchLower) ||
      (record.creator_name && record.creator_name.toLowerCase().includes(searchLower))
    );
  });

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Data',
      'Criado por',
      'Empresa',
      'CNPJ',
      'Colaborador',
      'CPF',
      'Veículo',
      'Placa',
      'Destino',
      'KM Entrega',
      'KM Devolução',
      'Combustível',
      'Condições Devolução'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredChecklists.map(record => {
        const date = new Date(record.created_at).toLocaleString('pt-BR');
        return [
          record.id,
          `"${date}"`,
          `"${record.creator_name || 'N/A'}"`,
          `"${record.data.empresa.razaoSocial}"`,
          `"${record.data.empresa.cnpj}"`,
          `"${record.data.colaborador.nome}"`,
          `"${record.data.colaborador.cpf}"`,
          `"${record.data.veiculo.marcaModelo}"`,
          `"${record.data.veiculo.placa}"`,
          `"${record.data.veiculo.destino || ''}"`,
          `"${record.data.veiculo.kmEntrega}"`,
          `"${record.data.veiculo.kmDevolucao}"`,
          `"${record.data.combustivelEntrega || ''}"`,
          `"${record.data.condicoesDevolucao || ''}"`
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

  const exportToPDF = async (mode: 'download' | 'view' = 'download') => {
    const doc = new jsPDF();
    
    try {
      const logoUrl = "https://i.postimg.cc/TYnHNq5z/ajm-Photoroom-(1).png";
      doc.addImage(logoUrl, 'PNG', 14, 10, 30, 12);
    } catch (e) {
      console.error("Could not load logo for PDF", e);
    }

    doc.setFontSize(18);
    doc.text('Relatório de Checklists - FleetCheck', 50, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, 30);
    
    const tableColumn = ["ID", "Data", "Criado por", "Empresa", "Colaborador", "Veículo", "Placa", "Destino"];
    const tableRows = filteredChecklists.map(record => [
      record.id.substring(0, 8),
      new Date(record.created_at).toLocaleDateString('pt-BR'),
      record.creator_name || 'N/A',
      record.data.empresa.razaoSocial,
      record.data.colaborador.nome,
      record.data.veiculo.marcaModelo,
      record.data.veiculo.placa,
      record.data.veiculo.destino || ''
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 59, 92] }
    });

    if (mode === 'view') {
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`relatorio_checklists_${new Date().getTime()}.pdf`);
    }
  };

  const downloadIndividualPDF = async (record: ChecklistRecord, mode: 'download' | 'view' = 'download') => {
    const doc = new jsPDF();
    const data = record.data;
    
    // Header
    doc.setFillColor(26, 59, 92);
    doc.rect(0, 0, 210, 40, 'F');
    
    try {
      const logoUrl = "https://i.postimg.cc/TYnHNq5z/ajm-Photoroom-(1).png";
      doc.addImage(logoUrl, 'PNG', 14, 10, 40, 16);
    } catch (e) {
      console.error("Could not load logo for PDF", e);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FleetCheck', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Checklist de Veículo - Termo de Responsabilidade', 105, 30, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    let y = 50;

    // Section 1: Empresa
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Identificação da Empresa', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Razão Social: ${data.empresa.razaoSocial || '---'}`, 14, y);
    doc.text(`CNPJ: ${data.empresa.cnpj || '---'}`, 105, y);
    y += 6;
    doc.text(`Razão Social 2: ${data.empresa.razaoSocial2 || '---'}`, 14, y);
    doc.text(`CNPJ 2: ${data.empresa.cnpj2 || '---'}`, 105, y);
    y += 10;

    // Section 2: Colaborador
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Identificação do Colaborador', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${data.colaborador.nome || '---'}`, 14, y);
    y += 6;
    doc.text(`CPF: ${data.colaborador.cpf || '---'}`, 14, y);
    doc.text(`Cargo: ${data.colaborador.cargo || '---'}`, 105, y);
    y += 6;
    doc.text(`CNH: ${data.colaborador.cnh || '---'}`, 14, y);
    doc.text(`Validade CNH: ${data.colaborador.validadeCnh || '---'}`, 105, y);
    y += 10;

    // Section 3: Veículo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Identificação do Veículo', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Marca/Modelo: ${data.veiculo.marcaModelo || '---'}`, 14, y);
    doc.text(`Placa: ${data.veiculo.placa || '---'}`, 105, y);
    y += 6;
    doc.text(`Cor: ${data.veiculo.cor || '---'}`, 14, y);
    doc.text(`Ano/Modelo: ${data.veiculo.anoModelo || '---'}`, 105, y);
    y += 6;
    doc.text(`KM Entrega: ${data.veiculo.kmEntrega || '---'}`, 14, y);
    doc.text(`KM Devolução: ${data.veiculo.kmDevolucao || '---'}`, 105, y);
    y += 6;
    doc.text(`Data Entrega: ${data.veiculo.dataEntrega} ${data.veiculo.horaEntrega}`, 14, y);
    doc.text(`Data Devolução: ${data.veiculo.dataDevolucao} ${data.veiculo.horaDevolucao}`, 105, y);
    y += 6;
    doc.text(`Destino/Rota: ${data.veiculo.destino || '---'}`, 14, y);
    y += 15;

    // Section 4: Condições
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Condições do Veículo (Inicial)', 14, y);
    y += 7;
    
    const condRows = [
      ['Lataria', data.condicoesEntrega.externa.lataria ? 'OK' : 'N/A', 'Bancos', data.condicoesEntrega.interna.bancos ? 'OK' : 'N/A'],
      ['Pintura', data.condicoesEntrega.externa.pintura ? 'OK' : 'N/A', 'Painel', data.condicoesEntrega.interna.painel ? 'OK' : 'N/A'],
      ['Para-choques', data.condicoesEntrega.externa.parachoques ? 'OK' : 'N/A', 'Ar Cond.', data.condicoesEntrega.interna.arCondicionado ? 'OK' : 'N/A'],
      ['Vidros', data.condicoesEntrega.externa.vidros ? 'OK' : 'N/A', 'Motor', data.condicoesEntrega.mecanica.motor ? 'OK' : 'N/A'],
      ['Pneus', data.condicoesEntrega.externa.pneus ? 'OK' : 'N/A', 'Freios', data.condicoesEntrega.mecanica.freios ? 'OK' : 'N/A']
    ];

    autoTable(doc, {
      body: condRows,
      startY: y,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;

    // Section 5: Acessórios e Combustível
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Acessórios e Combustível', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Combustível: ${data.combustivelEntrega || '---'}`, 14, y);
    y += 6;
    
    const accList = [];
    if (data.acessorios.documento) accList.push('Doc');
    if (data.acessorios.manual) accList.push('Manual');
    if (data.acessorios.chavePrincipal) accList.push('Chave');
    if (data.acessorios.triangulo) accList.push('Triângulo');
    if (data.acessorios.macaco) accList.push('Macaco');
    if (data.acessorios.chaveRoda) accList.push('Chave Roda');
    if (data.acessorios.estepe) accList.push('Estepe');
    if (data.acessorios.cartaoCombustivel) accList.push('Cartão Comb.');
    if (data.acessorios.controlePortao) accList.push('Controle Portão');
    
    doc.text(`Acessórios: ${accList.join(', ') || 'Nenhum'}`, 14, y);
    y += 10;

    // Section 6: Devolução
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('6. Condições na Devolução', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const devText = data.condicoesDevolucao || 'Nenhuma avaria relatada.';
    const splitDev = doc.splitTextToSize(devText, 180);
    doc.text(splitDev, 14, y);
    y += (splitDev.length * 5) + 10;

    // Termo de Responsabilidade
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Termo de Responsabilidade', 14, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const termo = `Eu, ${data.colaborador.nome}, declaro que recebi o veículo nas condições descritas neste checklist, comprometendo-me a utilizá-lo exclusivamente para fins autorizados, cumprir a legislação de trânsito vigente, zelar pela conservação do bem, comunicar imediatamente qualquer sinistro ou irregularidade e assumir responsabilidade por multas decorrentes de infrações cometidas durante o período de utilização por mim, conforme o termo de responsabilidade assinado com a empresa ${data.empresa.razaoSocial}.`;
    const splitTermo = doc.splitTextToSize(termo, 180);
    doc.text(splitTermo, 14, y);
    
    y += (splitTermo.length * 4) + 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Manaus, ${new Date().toLocaleDateString('pt-BR')}`, 105, y, { align: 'center' });

    if (mode === 'view') {
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`checklist_${record.id.substring(0, 8)}.pdf`);
    }
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
          
          <div className="flex gap-2">
            <button 
              onClick={exportToCSV}
              disabled={filteredChecklists.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold hover:bg-zinc-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button 
              onClick={() => exportToPDF('view')}
              disabled={filteredChecklists.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold hover:bg-zinc-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              Visualizar
            </button>
            <button 
              onClick={() => exportToPDF('download')}
              disabled={filteredChecklists.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar nos resultados carregados..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <input 
                type="date" 
                value={dateFilter.start}
                onChange={e => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="text-xs outline-none bg-transparent"
              />
              <span className="text-zinc-300">|</span>
              <input 
                type="date" 
                value={dateFilter.end}
                onChange={e => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="text-xs outline-none bg-transparent"
              />
            </div>
            <button 
              onClick={() => setDateFilter({ start: '', end: '' })}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              Limpar
            </button>
          </div>

          <div className="text-sm text-zinc-500 font-medium whitespace-nowrap">
            {filteredChecklists.length} registro(s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">ID</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Data</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Criado por</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Empresa</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Colaborador</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Veículo</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Placa</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Destino</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredChecklists.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredChecklists.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">#{record.id.substring(0, 8)}</td>
                    <td className="px-6 py-4 text-zinc-600">
                      {new Date(record.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {record.creator_name || 'N/A'}
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
                    <td className="px-6 py-4 text-zinc-600 truncate max-w-[150px]" title={record.data.veiculo.destino}>
                      {record.data.veiculo.destino || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => downloadIndividualPDF(record, 'view')}
                          className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                          title="Visualizar PDF"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => downloadIndividualPDF(record, 'download')}
                          className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                          title="Baixar PDF"
                        >
                          <FileDown className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-center">
            <button
              onClick={() => fetchChecklists(true)}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-100 transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Carregar mais registros'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
