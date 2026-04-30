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
import SignaturePad from './SignaturePad';
import html2pdf from 'html2pdf.js';
import { db_firebase } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query } from 'firebase/firestore';

const defaultInitialData: ChecklistData = {
  empresa: { razaoSocial: '', razaoSocial2: '', cnpj: '', cnpj2: '', obs: '' },
  colaborador: { id: undefined, nome: '', cpf: '', cargo: '', cnh: '', validadeCnh: '' },
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
      bancos: false, painel: false, arCondicionado: false,
      tapetes: false, cintos: false, obs: ''
    },
    mecanica: {
      motor: false, freios: false, direcao: false, suspensao: false,
      luzesAlerta: false, obs: ''
    },
  },
  acessorios: {
    documento: false, manual: false, chavePrincipal: false,
    triangulo: false, macaco: false, chaveRoda: false, estepe: false,
    cartaoCombustivel: false, controlePortao: false, giroflex: false, obs: ''
  },
  combustivelEntrega: '',
  condicoesDevolucao: '',
  fotos: [],
  assinaturaColaborador: '',
  assinaturaResponsavel: '',
};

interface ChecklistProps {
  editingId?: string | null;
  initialData?: ChecklistData | null;
  onFinish?: () => void;
}

export default function Checklist({ editingId, initialData, onFinish }: ChecklistProps) {
  const [data, setData] = useState<ChecklistData>(initialData || defaultInitialData);
  const [step, setStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
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
    const fetchMasterData = async () => {
      try {
        const empresasSnap = await getDocs(collection(db_firebase, 'empresas'));
        setEmpresas(empresasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const colaboradoresSnap = await getDocs(collection(db_firebase, 'colaboradores'));
        const colaboradoresList = colaboradoresSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setColaboradores(colaboradoresList);

        const veiculosSnap = await getDocs(collection(db_firebase, 'veiculos'));
        setVeiculos(veiculosSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Auto-identify collaborator if not editing and user is common
        if (!editingId && !initialData) {
          const userStr = localStorage.getItem('fleetcheck_user');
          const user = userStr ? JSON.parse(userStr) : null;
          
          if (user) {
            const match = colaboradoresList.find((c: any) => 
              (user.username && c.email?.toLowerCase() === user.username.toLowerCase()) ||
              (user.fullName && c.nome?.toLowerCase() === user.fullName.toLowerCase())
            ) as any;
            
            if (match) {
              // Helper to convert DD/MM/YYYY to YYYY-MM-DD for input[type="date"]
              const formatDate = (dateStr: string) => {
                if (!dateStr) return '';
                if (dateStr.includes('-')) return dateStr; // Already YYYY-MM-DD
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
                return dateStr;
              };

              setData(prev => ({
                ...prev,
                colaborador: {
                  id: match.id,
                  nome: match.nome || '',
                  cpf: match.cpf || '',
                  cargo: match.cargo || '',
                  cnh: match.cnh || '',
                  validadeCnh: formatDate(match.validadeCnh || '')
                }
              }));
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching master data from Firebase:', err);
        if (err.code === 'permission-denied') {
          setSaveStatus({ 
            type: 'error', 
            message: 'Erro de Permissão: Verifique as regras do Firestore no console do Firebase.' 
          });
        }
      }
    };
    fetchMasterData();
  }, []);

  const updateField = (section: keyof ChecklistData, field: string, value: any) => {
    setData(prev => {
      const sectionValue = prev[section];
      const isObject = sectionValue !== null && typeof sectionValue === 'object' && !Array.isArray(sectionValue);
      
      return {
        ...prev,
        [section]: isObject 
          ? { ...sectionValue as object, [field]: value }
          : value
      };
    });
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

  const toggleAll = (section: 'condicoesEntrega' | 'acessorios', subSection?: 'externa' | 'interna' | 'mecanica', value?: boolean) => {
    if (section === 'condicoesEntrega' && subSection !== undefined && value !== undefined) {
      setData(prev => {
        const currentSubSection = prev[section][subSection];
        const newSubSection = { ...currentSubSection };
        Object.keys(newSubSection).forEach(key => {
          if (key !== 'obs') {
            (newSubSection as any)[key] = value;
          }
        });
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [subSection]: newSubSection
          }
        };
      });
    } else if (section === 'acessorios' && value !== undefined) {
      setData(prev => {
        const newAcessorios = { ...prev.acessorios };
        Object.keys(newAcessorios).forEach(key => {
          if (key !== 'obs') {
            (newAcessorios as any)[key] = value;
          }
        });
        return {
          ...prev,
          acessorios: newAcessorios
        };
      });
    }
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

  const handlePrint = () => {
    // Validate all steps up to current before printing
    for (let i = 1; i <= step; i++) {
      if (!validateStep(i)) return;
    }
    
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

  const validateStep = (stepToValidate: number) => {
    const errors: string[] = [];

    if (stepToValidate === 1) {
      if (!data.empresa.razaoSocial) errors.push("Razão Social (Empresa)");
      if (!data.empresa.cnpj) errors.push("CNPJ (Empresa)");
      if (!data.colaborador.nome) errors.push("Nome do Colaborador");
      if (!data.colaborador.cpf) errors.push("CPF do Colaborador");
      if (!data.colaborador.cargo) errors.push("Cargo do Colaborador");
      if (!data.colaborador.cnh) errors.push("CNH do Colaborador");
      // Some collaborators might have invalid date format in DB, we should be careful but still validate if it exists
      if (!data.colaborador.validadeCnh) errors.push("Validade CNH");
    }

    if (stepToValidate === 2) {
      if (!data.veiculo.marcaModelo) errors.push("Marca/Modelo do Veículo");
      if (!data.veiculo.placa) errors.push("Placa do Veículo");
      if (!data.veiculo.renavam) errors.push("Renavam do Veículo");
      if (!data.veiculo.cor) errors.push("Cor do Veículo");
      if (!data.veiculo.anoModelo) errors.push("Ano/Modelo do Veículo");
      if (!data.veiculo.kmEntrega) errors.push("KM Inicial");
      if (!data.veiculo.dataEntrega) errors.push("Data Inicial");
      if (!data.veiculo.horaEntrega) errors.push("Hora Inicial");
      if (!data.veiculo.destino) errors.push("Destino/Rota");
    }

    if (stepToValidate === 4) {
      if (!data.combustivelEntrega) errors.push("Nível de Combustível");
    }

    if (stepToValidate === 5) {
      // Making this optional as requested by user's frustration with blocked progress
      // Users might not have specific notes for every return
    }

    if (stepToValidate === 6) {
      // Signatures are no longer mandatory as they are being removed from UI
    }

    if (errors.length > 0) {
      setShowValidationErrors(true);
      setSaveStatus({ 
        type: 'error', 
        message: `Preencha os campos obrigatórios: ${errors.join(', ')}` 
      });
      setTimeout(() => setSaveStatus(null), 4000);
      return false;
    }
    setShowValidationErrors(false);
    return true;
  };

  const handleSave = async () => {
    // Validate all steps before saving
    for (let i = 1; i <= step; i++) {
      if (!validateStep(i)) return;
    }
    
    try {
      const userStr = localStorage.getItem('fleetcheck_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
      }
      
      const checklistData = {
        ...data,
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      try {
        if (editingId) {
          await updateDoc(doc(db_firebase, 'checklists', String(editingId)), checklistData);
        } else {
          await addDoc(collection(db_firebase, 'checklists'), checklistData);
        }
        
        setSaveStatus({ type: 'success', message: 'Checklist salvo com sucesso!' });
        setTimeout(() => {
          setSaveStatus(null);
          setData(defaultInitialData);
          setStep(1);
          if (onFinish) onFinish();
        }, 2000);
      } catch (error: any) {
        // Detailed Firestore Error Handling as per guidelines
        const errInfo = {
          error: error instanceof Error ? error.message : String(error),
          operationType: editingId ? 'update' : 'create',
          path: 'checklists',
          authInfo: {
            userId: user.id,
            role: user.role
          }
        };
        console.error('Firestore Error Details:', JSON.stringify(errInfo));
        
        if (error.code === 'permission-denied') {
          setSaveStatus({ 
            type: 'error', 
            message: 'Erro de Permissão: Verifique se suas regras do Firestore permitem escrita para usuários comuns.' 
          });
        } else {
          setSaveStatus({ type: 'error', message: `Erro ao salvar: ${error.message || 'Erro desconhecido'}` });
        }
        setTimeout(() => setSaveStatus(null), 5000);
      }
    } catch (error: any) {
      console.error('Save setup error:', error);
      setSaveStatus({ type: 'error', message: error.message || 'Erro ao processar salvamento.' });
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-zinc-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900">1. Identificação da Empresa</h2>
                </div>
                {!editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm('Deseja realmente limpar todo o checklist?')) {
                        setData(defaultInitialData);
                        setStep(1);
                      }
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Limpar Tudo
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">RAZÃO SOCIAL <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      list="empresas-list"
                      className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all pr-10 ${
                        showValidationErrors && !data.empresa.razaoSocial ? 'border-red-500' : 'border-zinc-200'
                      }`}
                      value={data.empresa.razaoSocial}
                      onChange={e => {
                        const val = e.target.value;
                        const empresa = empresas.find(emp => emp.razaoSocial === val);
                        if (empresa) {
                          updateField('empresa', 'razaoSocial', empresa.razaoSocial);
                          updateField('empresa', 'cnpj', empresa.cnpj || '');
                        } else {
                          updateField('empresa', 'razaoSocial', val);
                        }
                      }}
                      placeholder="Digite ou selecione a empresa..."
                    />
                    {data.empresa.razaoSocial && (
                      <button 
                        type="button"
                        onClick={() => {
                          updateField('empresa', 'razaoSocial', '');
                          updateField('empresa', 'cnpj', '');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <datalist id="empresas-list">
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.razaoSocial}>{emp.razaoSocial}</option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CNPJ <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.empresa.cnpj ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.empresa.cnpj}
                    onChange={e => updateField('empresa', 'cnpj', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">RAZÃO SOCIAL 2</label>
                  <input 
                    list="empresas-list-2"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.empresa.razaoSocial2}
                    onChange={e => {
                      const val = e.target.value;
                      const empresa = empresas.find(emp => emp.razaoSocial === val);
                      if (empresa) {
                        updateField('empresa', 'razaoSocial2', empresa.razaoSocial);
                        updateField('empresa', 'cnpj2', empresa.cnpj || '');
                      } else {
                        updateField('empresa', 'razaoSocial2', val);
                      }
                    }}
                    placeholder="Digite ou selecione a empresa..."
                  />
                  <datalist id="empresas-list-2">
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.razaoSocial}>{emp.razaoSocial}</option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CNPJ 2</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.empresa.cnpj2}
                    onChange={e => updateField('empresa', 'cnpj2', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">OBSERVAÇÕES</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    value={data.empresa.obs}
                    onChange={e => updateField('empresa', 'obs', e.target.value)}
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
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">NOME COMPLETO <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      list="colaboradores-list"
                      className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all pr-10 ${
                        showValidationErrors && !data.colaborador.nome ? 'border-red-500' : 'border-zinc-200'
                      }`}
                      value={data.colaborador.nome}
                      onChange={e => {
                        const val = e.target.value;
                        const collab = colaboradores.find(c => c.nome === val);
                        if (collab) {
                          setData(prev => ({
                            ...prev,
                            colaborador: {
                              id: collab.id,
                              nome: collab.nome || '',
                              cpf: collab.cpf || '',
                              cargo: collab.cargo || '',
                              cnh: collab.cnh || '',
                              validadeCnh: collab.validadeCnh || ''
                            }
                          }));
                        } else {
                          updateField('colaborador', 'nome', val);
                        }
                      }}
                      placeholder="Nome do colaborador"
                    />
                    {data.colaborador.nome && (
                      <button 
                        type="button"
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            colaborador: {
                              id: undefined,
                              nome: '',
                              cpf: '',
                              cargo: '',
                              cnh: '',
                              validadeCnh: ''
                            }
                          }));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <datalist id="colaboradores-list">
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.nome}>{c.cargo} - {c.cpf}</option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CPF <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.colaborador.cpf ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.colaborador.cpf}
                    onChange={e => updateField('colaborador', 'cpf', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CARGO <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.colaborador.cargo ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.colaborador.cargo}
                    onChange={e => updateField('colaborador', 'cargo', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">CNH Nº <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.colaborador.cnh ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.colaborador.cnh}
                    onChange={e => updateField('colaborador', 'cnh', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">VALIDADE <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.colaborador.validadeCnh ? 'border-red-500' : 'border-zinc-200'
                    }`}
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
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">MARCA/MODELO <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      list="veiculos-list"
                      className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all pr-10 ${
                        showValidationErrors && !data.veiculo.marcaModelo ? 'border-red-500' : 'border-zinc-200'
                      }`}
                      value={data.veiculo.marcaModelo}
                      onChange={e => {
                        const val = e.target.value;
                        const veiculo = veiculos.find(v => v.id.toString() === val || v.marcaModelo === val);
                        if (veiculo) {
                          updateField('veiculo', 'id', veiculo.id);
                          updateField('veiculo', 'marcaModelo', veiculo.marcaModelo);
                          updateField('veiculo', 'placa', veiculo.placa || '');
                          updateField('veiculo', 'renavam', veiculo.renavam || '');
                          updateField('veiculo', 'cor', veiculo.cor || '');
                          updateField('veiculo', 'anoModelo', veiculo.anoModelo || '');
                        } else {
                          updateField('veiculo', 'id', undefined);
                          updateField('veiculo', 'marcaModelo', val);
                        }
                      }}
                      placeholder="Digite ou selecione o veículo..."
                    />
                    {data.veiculo.marcaModelo && (
                      <button 
                        type="button"
                        onClick={() => {
                          updateField('veiculo', 'id', undefined);
                          updateField('veiculo', 'marcaModelo', '');
                          updateField('veiculo', 'placa', '');
                          updateField('veiculo', 'renavam', '');
                          updateField('veiculo', 'cor', '');
                          updateField('veiculo', 'anoModelo', '');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                        title="Limpar seleção"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <datalist id="veiculos-list">
                    {veiculos.map(v => (
                      <option key={v.id} value={v.marcaModelo}>{v.placa} - {v.cor} - {v.anoModelo}</option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">PLACA <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.veiculo.placa ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.veiculo.placa}
                    onChange={e => updateField('veiculo', 'placa', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">RENAVAM <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.veiculo.renavam ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.veiculo.renavam}
                    onChange={e => updateField('veiculo', 'renavam', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">COR <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.veiculo.cor ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.veiculo.cor}
                    onChange={e => updateField('veiculo', 'cor', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">ANO/MODELO <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${
                      showValidationErrors && !data.veiculo.anoModelo ? 'border-red-500' : 'border-zinc-200'
                    }`}
                    value={data.veiculo.anoModelo}
                    onChange={e => updateField('veiculo', 'anoModelo', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2 lg:col-span-3">
                  <div className="p-3 md:p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-4">
                    <h3 className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest text-center sm:text-left">Inicial/Recebimento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">KM <span className="text-red-500">*</span></label>
                        <input type="text" className={`w-full px-3 py-2 bg-white border rounded-lg text-sm ${
                          showValidationErrors && !data.veiculo.kmEntrega ? 'border-red-500' : 'border-zinc-200'
                        }`} value={data.veiculo.kmEntrega} onChange={e => updateField('veiculo', 'kmEntrega', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-400">Data <span className="text-red-500">*</span></label>
                          <input type="date" className={`w-full px-3 py-2 bg-white border rounded-lg text-sm ${
                            showValidationErrors && !data.veiculo.dataEntrega ? 'border-red-500' : 'border-zinc-200'
                          }`} value={data.veiculo.dataEntrega} onChange={e => updateField('veiculo', 'dataEntrega', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-400">Hora <span className="text-red-500">*</span></label>
                          <input type="time" className={`w-full px-3 py-2 bg-white border rounded-lg text-sm ${
                            showValidationErrors && !data.veiculo.horaEntrega ? 'border-red-500' : 'border-zinc-200'
                          }`} value={data.veiculo.horaEntrega} onChange={e => updateField('veiculo', 'horaEntrega', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-4">
                    <h3 className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest text-center sm:text-left">Final/Devolução</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">KM</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm" value={data.veiculo.kmDevolucao} onChange={e => updateField('veiculo', 'kmDevolucao', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                </div>

                <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">DESTINO/ROTA <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={3}
                    className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all resize-none ${
                      showValidationErrors && !data.veiculo.destino ? 'border-red-500' : 'border-zinc-200'
                    }`}
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Parte Externa</h3>
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-900 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        checked={Object.entries(data.condicoesEntrega.externa).filter(([k]) => k !== 'obs').every(([_, v]) => v === true)}
                        onChange={e => toggleAll('condicoesEntrega', 'externa', e.target.checked)}
                      />
                      Marcar todos
                    </label>
                  </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Parte Interna</h3>
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-900 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        checked={Object.entries(data.condicoesEntrega.interna).filter(([k]) => k !== 'obs').every(([_, v]) => v === true)}
                        onChange={e => toggleAll('condicoesEntrega', 'interna', e.target.checked)}
                      />
                      Marcar todos
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(data.condicoesEntrega.interna).map(([key, value]) => {
                      if (key === 'obs') return null;
                      const labels: any = {
                        bancos: 'Bancos preservados',
                        painel: 'Painel sem avarias',
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Parte Mecânica / Funcional</h3>
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-900 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        checked={Object.entries(data.condicoesEntrega.mecanica).filter(([k]) => k !== 'obs').every(([_, v]) => v === true)}
                        onChange={e => toggleAll('condicoesEntrega', 'mecanica', e.target.checked)}
                      />
                      Marcar todos
                    </label>
                  </div>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 rounded-lg">
                    <FileText className="w-5 h-5 text-zinc-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900">5. Itens e Acessórios Entregues</h2>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-900 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    checked={Object.entries(data.acessorios).filter(([k]) => k !== 'obs').every(([_, v]) => v === true)}
                    onChange={e => toggleAll('acessorios', undefined, e.target.checked)}
                  />
                  Marcar todos
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(data.acessorios).map(([key, value]) => {
                  if (key === 'obs') return null;
                  
                  // Only show giroflex for Fiat Mobi Like
                  if (key === 'giroflex' && data.veiculo.marcaModelo !== 'Fiat Mobi Like') {
                    return null;
                  }

                  const labels: any = {
                    documento: 'Documento do veículo',
                    manual: 'Manual do proprietário',
                    chavePrincipal: 'Chave principal',
                    triangulo: 'Triângulo',
                    macaco: 'Macaco',
                    chaveRoda: 'Chave de roda',
                    estepe: 'Estepe',
                    cartaoCombustivel: 'Cartão combustível',
                    controlePortao: 'Controle portão empresa',
                    giroflex: 'Giroflex'
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
                <h2 className="text-xl font-semibold text-zinc-900">6. Nível de Combustível Inicial/Recebimento <span className="text-red-500">*</span></h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                {['Cheio', '3/4', '2/4', '1/4', 'Reserva'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setData(prev => ({ ...prev, combustivelEntrega: level as any }))}
                    className={`px-3 py-3 rounded-xl border transition-all text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                      data.combustivelEntrega === level 
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                      : (showValidationErrors && !data.combustivelEntrega ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400')
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
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Descrição de eventuais avarias ou ocorrências (Opcional)</label>
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
                  <label className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all cursor-pointer shadow-md">
                    <ImagePlus className="w-5 h-5" />
                    Adicionar da Galeria
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

              <div className="flex justify-center pt-4">
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
      <div className="pb-32 print:hidden">
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <span>PASSO {step} DE {totalSteps}</span>
            <div className="h-px flex-1 bg-zinc-200"></div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
            {step === 1 && "Identificação"}
            {step === 2 && "Dados do Veículo"}
            {step === 3 && "Condições de Entrega"}
            {step === 4 && "Acessórios e Combustível"}
            {step === 5 && "Devolução"}
            {step === 6 && "Finalização"}
          </h2>
          <div className="h-1.5 w-full bg-zinc-100 rounded-full mt-4 overflow-hidden">
            <motion.div 
              className="h-full bg-zinc-900"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent pointer-events-none z-[90]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">
            <button
              disabled={step === 1}
              onClick={() => setStep(s => s - 1)}
              className={`flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-xl md:rounded-2xl font-bold transition-all uppercase tracking-widest text-[10px] md:text-xs ${
                step === 1 
                ? 'opacity-0 pointer-events-none' 
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'
              }`}
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={handlePrint}
                className="p-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-all shadow-sm hidden sm:block"
                title="Imprimir PDF"
              >
                <Printer className="w-5 h-5" />
              </button>
              
              {step < totalSteps ? (
                <button
                  onClick={() => {
                    if (validateStep(step)) {
                      setStep(s => s + 1);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-6 md:px-10 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 uppercase tracking-widest text-[10px] md:text-xs"
                >
                  <span className="sm:inline">Próximo</span>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 px-6 md:px-10 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 uppercase tracking-widest text-[10px] md:text-xs"
                >
                  <Save className="w-4 h-4 md:w-5 md:h-5" />
                  Finalizar
                </button>
              )}
            </div>
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
    </>
  );
}
