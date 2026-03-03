import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Fuel, 
  ClipboardCheck, 
  Printer,
  Save,
  ChevronRight,
  ChevronLeft,
  Camera,
  ImagePlus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChecklistData } from '../types';
import PrintView from './PrintView';
import CameraCapture from './CameraCapture';
import SignaturePad from './SignaturePad';
import html2pdf from 'html2pdf.js';

const defaultInitialData: ChecklistData = {
  empresa: { razaoSocial: '', cnpj: '' },
  colaborador: { nome: '', cpf: '', cargo: '', cnh: '', validadeCnh: '' },
  veiculo: {
    marcaModelo: '',
    placa: '',
    renavam: '',
    cor: '',
    anoModelo: '',
    kmEntrega: '',
    kmDevolucao: '',
    dataEntrega: '',
    dataDevolucao: '',
    horaEntrega: '',
    horaDevolucao: '',
    destino: '',
  },
  condicoesEntrega: {
    externa: {
      lataria: false, pintura: false, parachoques: false, vidros: false,
      retrovisores: false, farois: false, pneus: false, rodas: false, obs: ''
    },
    interna: {
      bancos: false, painel: false, multimidia: false, arCondicionado: false,
      tapetes: false, cintos: false, obs: ''
    },
    mecanica: {
      motor: false, freios: false, direcao: false, suspensao: false,
      luzesAlerta: false, obs: ''
    },
  },
  acessorios: {
    documento: false, manual: false, chavePrincipal: false, chaveReserva: false,
    triangulo: false, macaco: false, chaveRoda: false, estepe: false,
    cartaoCombustivel: false, controlePortao: false, obs: ''
  },
  combustivelEntrega: '',
  condicoesDevolucao: '',
  fotos: [],
  assinaturaColaborador: '',
  assinaturaResponsavel: '',
};

interface ChecklistProps {
  editingId?: number | null;
  initialData?: ChecklistData | null;
  onFinish?: () => void;
}

export default function Checklist({ editingId, initialData, onFinish }: ChecklistProps) {
  const [data, setData] = useState<ChecklistData>(initialData || defaultInitialData);
  const [step, setStep] = useState(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);

  const totalSteps = 6;

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    } else {
      setData(defaultInitialData);
    }
  }, [initialData]);

  useEffect(() => {
    fetch('/api/empresas').then(res => res.json()).then(setEmpresas).catch(console.error);
    fetch('/api/colaboradores').then(res => res.json()).then(setColaboradores).catch(console.error);
    fetch('/api/veiculos').then(res => res.json()).then(setVeiculos).catch(console.error);
  }, []);

  const updateField = (section: keyof ChecklistData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' 
        ? { ...prev[section], [field]: value }
        : value
    }));
  };

  const updateNestedField = (section: 'condicoesEntrega', subSection: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...(prev[section][subSection as keyof typeof prev.condicoesEntrega] as any),
          [field]: value
        }
      }
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setData(prev => ({
          ...prev,
          fotos: [...(prev.fotos || []), base64String]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (indexToRemove: number) => {
    setData(prev => ({
      ...prev,
      fotos: (prev.fotos || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleCameraCapture = (base64Image: string) => {
    setData(prev => ({
      ...prev,
      fotos: [...(prev.fotos || []), base64Image]
    }));
    setIsCameraOpen(false);
  };

  const handlePrint = () => {
    const element = document.getElementById('print-view');
    if (!element) return;

    // Temporarily make the print view visible for PDF generation
    element.classList.remove('hidden');
    element.classList.add('block');

    const opt = {
      margin: 10,
      filename: `checklist-${data.veiculo.placa || 'veiculo'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Hide it again after generation
      element.classList.remove('block');
      element.classList.add('hidden');
    });
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/checklists/${editingId}` : '/api/checklists';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (result.success) {
        setSaveStatus({ type: 'success', message: 'Checklist salvo com sucesso!' });
        setTimeout(() => {
          setSaveStatus(null);
          setData(defaultInitialData);
          setStep(1);
          if (onFinish) onFinish();
        }, 2000);
      } else {
        setSaveStatus({ type: 'error', message: 'Erro ao salvar checklist: ' + result.message });
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Erro ao conectar ao servidor para salvar o checklist.' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">1. Identificação da Empresa</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Razão Social</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.empresa.razaoSocial}
                    onChange={e => {
                      const val = e.target.value;
                      updateField('empresa', 'razaoSocial', val);
                      const empresa = empresas.find(emp => emp.razaoSocial === val);
                      if (empresa) {
                        updateField('empresa', 'cnpj', empresa.cnpj);
                      } else {
                        updateField('empresa', 'cnpj', '');
                      }
                    }}
                  >
                    <option value="">Selecione uma empresa...</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.razaoSocial}>{emp.razaoSocial}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CNPJ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.empresa.cnpj}
                    onChange={e => updateField('empresa', 'cnpj', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <User className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">2. Identificação do Colaborador</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nome Completo</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.colaborador.nome}
                    onChange={e => updateField('colaborador', 'nome', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CPF</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.colaborador.cpf}
                    onChange={e => updateField('colaborador', 'cpf', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cargo</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.colaborador.cargo}
                    onChange={e => updateField('colaborador', 'cargo', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CNH nº</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.colaborador.cnh}
                    onChange={e => updateField('colaborador', 'cnh', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Validade</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.colaborador.validadeCnh}
                    onChange={e => updateField('colaborador', 'validadeCnh', e.target.value)}
                  />
                </div>
              </div>
            </section>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <Car className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">3. Identificação do Veículo</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Veículo</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.veiculo.marcaModelo}
                    onChange={e => {
                      const val = e.target.value;
                      updateField('veiculo', 'marcaModelo', val);
                      const veiculo = veiculos.find(v => v.marcaModelo === val);
                      if (veiculo) {
                        updateField('veiculo', 'placa', veiculo.placa || '');
                        updateField('veiculo', 'renavam', veiculo.renavam || '');
                        updateField('veiculo', 'cor', veiculo.cor || '');
                        updateField('veiculo', 'anoModelo', veiculo.anoModelo || '');
                      } else {
                        updateField('veiculo', 'placa', '');
                        updateField('veiculo', 'renavam', '');
                        updateField('veiculo', 'cor', '');
                        updateField('veiculo', 'anoModelo', '');
                      }
                    }}
                  >
                    <option value="">Selecione um veículo...</option>
                    {veiculos.map(v => (
                      <option key={v.id} value={v.marcaModelo}>
                        {v.marcaModelo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Placa</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.veiculo.placa}
                    onChange={e => updateField('veiculo', 'placa', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Renavam</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.veiculo.renavam}
                    onChange={e => updateField('veiculo', 'renavam', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cor</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.veiculo.cor}
                    onChange={e => updateField('veiculo', 'cor', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ano/Modelo</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.veiculo.anoModelo}
                    onChange={e => updateField('veiculo', 'anoModelo', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-3">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Inicial/Recebimento</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">KM</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm" value={data.veiculo.kmEntrega} onChange={e => updateField('veiculo', 'kmEntrega', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Data</label>
                        <input type="date" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm" value={data.veiculo.dataEntrega} onChange={e => updateField('veiculo', 'dataEntrega', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Hora</label>
                        <input type="time" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm" value={data.veiculo.horaEntrega} onChange={e => updateField('veiculo', 'horaEntrega', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Final/Devolução</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">KM</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm" value={data.veiculo.kmDevolucao} onChange={e => updateField('veiculo', 'kmDevolucao', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Data</label>
                        <input type="date" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm" value={data.veiculo.dataDevolucao} onChange={e => updateField('veiculo', 'dataDevolucao', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Hora</label>
                        <input type="time" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm" value={data.veiculo.horaDevolucao} onChange={e => updateField('veiculo', 'horaDevolucao', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Destino/Trajetos/Motivos</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all resize-none"
                    value={data.veiculo.destino}
                    onChange={e => updateField('veiculo', 'destino', e.target.value)}
                  />
                </div>
              </div>
            </section>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">4. Condições do Veículo (Inicial/Recebimento)</h2>
              </div>

              <div className="space-y-8">
                {/* Parte Externa */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Parte Externa</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(data.condicoesEntrega.externa).map(([key, value]) => {
                      if (key === 'obs') return null;
                      const labels: any = {
                        lataria: 'Lataria em bom estado',
                        pintura: 'Pintura preservada',
                        parachoques: 'Para-choques íntegros',
                        vidros: 'Vidros sem trincas',
                        retrovisores: 'Retrovisores íntegros',
                        farois: 'Faróis/Lanternas funcionando',
                        pneus: 'Pneus em boas condições',
                        rodas: 'Rodas sem avarias'
                      };
                      return (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            checked={value as boolean}
                            onChange={e => updateNestedField('condicoesEntrega', 'externa', key, e.target.checked)}
                          />
                          <span className="text-sm text-zinc-700">{labels[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                  <input 
                    placeholder="Observações Parte Externa..."
                    className="w-full mt-3 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-sm"
                    value={data.condicoesEntrega.externa.obs}
                    onChange={e => updateNestedField('condicoesEntrega', 'externa', 'obs', e.target.value)}
                  />
                </div>

                {/* Parte Interna */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Parte Interna</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(data.condicoesEntrega.interna).map(([key, value]) => {
                      if (key === 'obs') return null;
                      const labels: any = {
                        bancos: 'Bancos preservados',
                        painel: 'Painel sem avarias',
                        multimidia: 'Sistema multimídia',
                        arCondicionado: 'Ar-condicionado',
                        tapetes: 'Tapetes presentes',
                        cintos: 'Cintos de segurança'
                      };
                      return (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            checked={value as boolean}
                            onChange={e => updateNestedField('condicoesEntrega', 'interna', key, e.target.checked)}
                          />
                          <span className="text-sm text-zinc-700">{labels[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                  <input 
                    placeholder="Observações Parte Interna..."
                    className="w-full mt-3 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-sm"
                    value={data.condicoesEntrega.interna.obs}
                    onChange={e => updateNestedField('condicoesEntrega', 'interna', 'obs', e.target.value)}
                  />
                </div>

                {/* Parte Mecânica */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Parte Mecânica / Funcional</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(data.condicoesEntrega.mecanica).map(([key, value]) => {
                      if (key === 'obs') return null;
                      const labels: any = {
                        motor: 'Motor funcionando regular',
                        freios: 'Sistema de freios regular',
                        direcao: 'Direção regular',
                        suspensao: 'Suspensão regular',
                        luzesAlerta: 'Nenhuma luz de alerta'
                      };
                      return (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            checked={value as boolean}
                            onChange={e => updateNestedField('condicoesEntrega', 'mecanica', key, e.target.checked)}
                          />
                          <span className="text-sm text-zinc-700">{labels[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                  <input 
                    placeholder="Observações Parte Mecânica..."
                    className="w-full mt-3 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-sm"
                    value={data.condicoesEntrega.mecanica.obs}
                    onChange={e => updateNestedField('condicoesEntrega', 'mecanica', 'obs', e.target.value)}
                  />
                </div>
              </div>
            </section>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <FileText className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">5. Itens e Acessórios Entregues</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(data.acessorios).map(([key, value]) => {
                  if (key === 'obs') return null;
                  const labels: any = {
                    documento: 'Documento do veículo',
                    manual: 'Manual do proprietário',
                    chavePrincipal: 'Chave principal',
                    chaveReserva: 'Chave reserva',
                    triangulo: 'Triângulo',
                    macaco: 'Macaco',
                    chaveRoda: 'Chave de roda',
                    estepe: 'Estepe',
                    cartaoCombustivel: 'Cartão combustível',
                    controlePortao: 'Controle portão empresa'
                  };
                  return (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        checked={value as boolean}
                        onChange={e => updateField('acessorios', key, e.target.checked)}
                      />
                      <span className="text-sm text-zinc-700">{labels[key]}</span>
                    </label>
                  );
                })}
              </div>
              <input 
                placeholder="Observações acessórios..."
                className="w-full mt-4 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-sm"
                value={data.acessorios.obs}
                onChange={e => updateField('acessorios', 'obs', e.target.value)}
              />
            </section>

            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <Fuel className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">6. Nível de Combustível Inicial/Recebimento</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {['Cheio', '3/4', '2/4', '1/4', 'Reserva'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setData(prev => ({ ...prev, combustivelEntrega: level as any }))}
                    className={`px-6 py-3 rounded-xl border transition-all text-sm font-medium ${
                      data.combustivelEntrega === level 
                      ? 'bg-[var(--color-brand-yellow)] text-zinc-900 border-[var(--color-brand-yellow)] shadow-md' 
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">7. Condições na Finalização/Devolução</h2>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Descrição de eventuais avarias ou ocorrências</label>
                <textarea 
                  rows={6}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all resize-none"
                  value={data.condicoesDevolucao}
                  onChange={e => setData(prev => ({ ...prev, condicoesDevolucao: e.target.value }))}
                />
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <Camera className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">Fotos do Veículo</h2>
                  <p className="text-sm text-zinc-500">Adicione fotos para registrar o estado do veículo</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-xl font-semibold hover:bg-[var(--color-brand-yellow-hover)] transition-all cursor-pointer shadow-md"
                  >
                    <Camera className="w-5 h-5" />
                    Tirar Foto
                  </button>
                  <label className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-50 transition-all cursor-pointer shadow-sm">
                    <ImagePlus className="w-5 h-5" />
                    Galeria
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                {data.fotos && data.fotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-100">
                    {data.fotos.map((foto, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group">
                        <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                          title="Remover foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        );
      case 6:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">8. Termo de Responsabilidade</h2>
              </div>
              
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-zinc-600 text-sm leading-relaxed italic">
                "Eu, <strong className="text-zinc-900 not-italic">{data.colaborador.nome || '____________________'}</strong>, declaro que recebi o veículo nas condições descritas neste checklist, comprometendo-me a utilizá-lo exclusivamente para fins autorizados, cumprir a legislação de trânsito vigente, zelar pela conservação do bem, comunicar imediatamente qualquer sinistro ou irregularidade e assumir responsabilidade por multas decorrentes de infrações cometidas durante o período de utilização por mim, conforme o termo de responsabilidade assinado com a empresa <strong className="text-zinc-900 not-italic">{data.empresa.razaoSocial || '____________________'}</strong>{data.empresa.cnpj ? <span className="not-italic font-medium text-zinc-900">, CNPJ: {data.empresa.cnpj}</span> : ''}."
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                <div className="space-y-4 flex flex-col items-center">
                  <SignaturePad 
                    initialSignature={data.assinaturaColaborador}
                    onSave={(sig) => updateField('assinaturaColaborador', '', sig)} 
                  />
                  <div className="h-px bg-zinc-300 w-full max-w-md mt-2"></div>
                  <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400">Assinatura do Colaborador</p>
                  <p className="text-center text-sm text-zinc-900 font-medium">{data.colaborador.nome || 'Nome do Colaborador'}</p>
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <SignaturePad 
                    initialSignature={data.assinaturaResponsavel}
                    onSave={(sig) => updateField('assinaturaResponsavel', '', sig)} 
                  />
                  <div className="h-px bg-zinc-300 w-full max-w-md mt-2"></div>
                  <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400">Assinatura do Responsável Empresa</p>
                  <p className="text-center text-sm text-zinc-900 font-medium">{data.empresa.razaoSocial || 'Nome da Empresa'}</p>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <div className="text-zinc-400 text-sm">
                  Manaus, {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-zinc-200 rounded-2xl text-zinc-900 font-semibold hover:bg-zinc-50 transition-all shadow-sm"
              >
                <Printer className="w-5 h-5" />
                Imprimir Checklist
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-2xl font-bold hover:bg-[var(--color-brand-yellow-hover)] transition-all shadow-lg shadow-zinc-200"
              >
                <Save className="w-5 h-5" />
                Finalizar e Salvar
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="pb-20 print:hidden">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
            <span>Passo {step} de {totalSteps}</span>
            <div className="h-px flex-1 bg-zinc-200"></div>
          </div>
          <h2 className="text-3xl font-bold text-zinc-900">
            {step === 1 && "Identificação"}
            {step === 2 && "Dados do Veículo"}
            {step === 3 && "Condições de Entrega"}
            {step === 4 && "Acessórios e Combustível"}
            {step === 5 && "Devolução"}
            {step === 6 && "Finalização"}
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto flex justify-between pointer-events-auto">
            <button
              disabled={step === 1}
              onClick={() => setStep(s => s - 1)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                step === 1 
                ? 'opacity-0 pointer-events-none' 
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>

            {step < totalSteps && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-2xl font-bold hover:bg-[var(--color-brand-yellow-hover)] transition-all shadow-lg shadow-zinc-200"
              >
                Próximo
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <PrintView data={data} />

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white;
            padding: 0;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header, .fixed, button, .print\\:hidden {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {saveStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-xl ${
              saveStatus.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {saveStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {saveStatus.message}
          </motion.div>
        </div>
      )}

      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
    </>
  );
}
