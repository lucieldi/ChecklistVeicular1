export interface User {
  id: string;
  username: string;
  fullName?: string;
  role: 'admin' | 'common';
}

export interface ChecklistData {
  empresa: {
    id?: number;
    razaoSocial: string;
    razaoSocial2: string;
    cnpj: string;
    cnpj2: string;
    obs: string;
  };
  colaborador: {
    id?: string | number;
    nome: string;
    cpf: string;
    cargo: string;
    cnh: string;
    validadeCnh: string;
  };
  veiculo: {
    id?: number;
    marcaModelo: string;
    placa: string;
    renavam: string;
    cor: string;
    anoModelo: string;
    kmEntrega: string;
    kmDevolucao: string;
    dataEntrega: string;
    dataDevolucao: string;
    horaEntrega: string;
    horaDevolucao: string;
    destino: string;
  };
  condicoesEntrega: {
    externa: {
      lataria: boolean;
      pintura: boolean;
      parachoques: boolean;
      vidros: boolean;
      retrovisores: boolean;
      farois: boolean;
      pneus: boolean;
      rodas: boolean;
      obs: string;
    };
    interna: {
      bancos: boolean;
      painel: boolean;
      arCondicionado: boolean;
      tapetes: boolean;
      cintos: boolean;
      obs: string;
    };
    mecanica: {
      motor: boolean;
      freios: boolean;
      direcao: boolean;
      suspensao: boolean;
      luzesAlerta: boolean;
      obs: string;
    };
  };
  acessorios: {
    documento: boolean;
    manual: boolean;
    chavePrincipal: boolean;
    triangulo: boolean;
    macaco: boolean;
    chaveRoda: boolean;
    estepe: boolean;
    cartaoCombustivel: boolean;
    controlePortao: boolean;
    giroflex?: boolean;
    obs: string;
  };
  combustivelEntrega: 'Cheio' | '3/4' | '2/4' | '1/4' | 'Reserva' | '';
  condicoesDevolucao: string;
  fotos?: string[];
  assinaturaColaborador?: string;
  assinaturaResponsavel?: string;
}
