import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Pencil, 
  Loader2,
  AlertCircle,
  Calendar,
  Car,
  User as UserIcon,
  Search,
  Filter,
  FileDown,
  Eye
} from 'lucide-react';
import { ChecklistData } from '../types';
import { db_firebase } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, limit, startAfter } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999);
        constraints.push(where('createdAt', '<=', endDate.toISOString()));
      }

      if (isLoadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(15)); // Fetch 15 at a time

      const q = query(collection(db_firebase, 'checklists'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(newLastDoc);
      setHasMore(querySnapshot.docs.length === 15);

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
      console.error('Error fetching history:', err);
      setError('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [dateFilter]);

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

    // Photos Section in PDF
    if (data.fotos && data.fotos.length > 0) {
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Fotos Anexas', 105, y, { align: 'center' });
      y += 15;

      const photoSize = 80;
      const margin = 15;
      const photosPerRow = 2;
      
      for (let i = 0; i < data.fotos.length; i++) {
        if (i > 0 && i % 4 === 0) {
          doc.addPage();
          y = 20;
        }
        
        const row = Math.floor((i % 4) / photosPerRow);
        const col = i % photosPerRow;
        
        const xPos = margin + col * (photoSize + 10);
        const yPos = y + row * (photoSize + 10);

        try {
          // Cloudinary images allow cross-origin
          doc.addImage(data.fotos[i], 'JPEG', xPos, yPos, photoSize, photoSize);
        } catch (err) {
          console.error("Error adding photo to PDF", err);
          doc.setFontSize(8);
          doc.text("Erro ao carregar foto", xPos, yPos + 5);
        }
      }
    }

    if (mode === 'view') {
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`checklist_${record.id.substring(0, 8)}.pdf`);
    }
  };

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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar no histórico carregado..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-sm">
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
      </div>

      {checklists.length === 0 && !error ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">Nenhum checklist encontrado.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {filteredChecklists.map((record) => (
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
                      <p className="text-xs text-zinc-400 mt-1"><span className="font-bold">Destino:</span> {record.data.veiculo.destino || '-'}</p>
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
                      <p className="text-xs text-zinc-400 mt-1"><span className="font-bold">Combustível:</span> {record.data.combustivelEntrega || '-'}</p>
                    </div>
                  </div>
                </div>

                {record.data.condicoesDevolucao && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Condições na Devolução</p>
                    <p className="text-xs text-zinc-600 italic">{record.data.condicoesDevolucao}</p>
                  </div>
                )}

                {record.data.fotos && record.data.fotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {record.data.fotos.map((foto, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 flex-shrink-0">
                        <img 
                          src={foto} 
                          alt="Foto do Checklist" 
                          className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                          onClick={() => window.open(foto, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
                <button 
                  onClick={() => downloadIndividualPDF(record, 'view')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-bold transition-all"
                  title="Visualizar PDF"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button 
                  onClick={() => downloadIndividualPDF(record, 'download')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-bold transition-all"
                  title="Baixar PDF"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </button>
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

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => fetchChecklists(true)}
              disabled={loadingMore}
              className="flex items-center gap-2 px-8 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Carregar mais histórico'
              )}
            </button>
          </div>
        )}
      </>
    )}
  </div>
);
}
