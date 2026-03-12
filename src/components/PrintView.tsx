import React from 'react';
import { ChecklistData } from '../types';

interface PrintViewProps {
  data: ChecklistData;
}

export default function PrintView({ data }: PrintViewProps) {
  return (
    <div id="print-view" className="hidden print:block p-8 bg-white max-w-[210mm] mx-auto text-sm text-zinc-900">
      <div className="flex justify-between items-start mb-8 border-b-2 border-zinc-900 pb-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Checklist de Veículo</h1>
          <p className="text-zinc-500 mt-1">Termo de Responsabilidade e Vistoria</p>
        </div>
        <img 
          src="https://i.postimg.cc/TYnHNq5z/ajm-Photoroom-(1).png" 
          alt="AJM Logo" 
          className="h-12 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="space-y-6">
        {/* 1. Identificação da Empresa */}
        <section>
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">1. Identificação da Empresa</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-semibold">Razão Social:</span> {data.empresa.razaoSocial || '---'}</div>
            <div><span className="font-semibold">CNPJ:</span> {data.empresa.cnpj || '---'}</div>
            <div><span className="font-semibold">Razão Social 2:</span> {data.empresa.razaoSocial2 || '---'}</div>
            <div><span className="font-semibold">CNPJ 2:</span> {data.empresa.cnpj2 || '---'}</div>
            <div className="col-span-2"><span className="font-semibold">Observações:</span> {data.empresa.obs || '---'}</div>
          </div>
        </section>

        {/* 2. Identificação do Colaborador */}
        <section>
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">2. Identificação do Colaborador</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><span className="font-semibold">Nome:</span> {data.colaborador.nome || '---'}</div>
            <div><span className="font-semibold">CPF:</span> {data.colaborador.cpf || '---'}</div>
            <div><span className="font-semibold">Cargo:</span> {data.colaborador.cargo || '---'}</div>
            <div><span className="font-semibold">CNH:</span> {data.colaborador.cnh || '---'}</div>
            <div><span className="font-semibold">Validade CNH:</span> {data.colaborador.validadeCnh || '---'}</div>
          </div>
        </section>

        {/* 3. Identificação do Veículo */}
        <section>
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">3. Identificação do Veículo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><span className="font-semibold">Marca/Modelo:</span> {data.veiculo.marcaModelo || '---'}</div>
            <div><span className="font-semibold">Placa:</span> {data.veiculo.placa || '---'}</div>
            <div><span className="font-semibold">Renavam:</span> {data.veiculo.renavam || '---'}</div>
            <div><span className="font-semibold">Cor:</span> {data.veiculo.cor || '---'}</div>
            <div><span className="font-semibold">Ano/Modelo:</span> {data.veiculo.anoModelo || '---'}</div>
            <div><span className="font-semibold">KM Inicial/Recebimento:</span> {data.veiculo.kmEntrega || '---'}</div>
            <div><span className="font-semibold">KM Final/Devolução:</span> {data.veiculo.kmDevolucao || '---'}</div>
            <div><span className="font-semibold">Data/Hora Inicial/Recebimento:</span> {data.veiculo.dataEntrega} {data.veiculo.horaEntrega}</div>
            <div><span className="font-semibold">Data/Hora Final/Devolução:</span> {data.veiculo.dataDevolucao} {data.veiculo.horaDevolucao}</div>
            <div className="col-span-2"><span className="font-semibold">Destino/Rota:</span> {data.veiculo.destino || '---'}</div>
          </div>
        </section>

        {/* 4. Condições na Entrega */}
        <section>
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">4. Condições do Veículo (Inicial/Recebimento)</h2>
          
          <div className="mb-3">
            <h3 className="font-semibold mb-1">Externa</h3>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>Lataria: {data.condicoesEntrega.externa.lataria ? 'OK' : 'N/A'}</div>
              <div>Pintura: {data.condicoesEntrega.externa.pintura ? 'OK' : 'N/A'}</div>
              <div>Para-choques: {data.condicoesEntrega.externa.parachoques ? 'OK' : 'N/A'}</div>
              <div>Vidros: {data.condicoesEntrega.externa.vidros ? 'OK' : 'N/A'}</div>
              <div>Retrovisores: {data.condicoesEntrega.externa.retrovisores ? 'OK' : 'N/A'}</div>
              <div>Faróis/Lanternas: {data.condicoesEntrega.externa.farois ? 'OK' : 'N/A'}</div>
              <div>Pneus: {data.condicoesEntrega.externa.pneus ? 'OK' : 'N/A'}</div>
              <div>Rodas/Calotas: {data.condicoesEntrega.externa.rodas ? 'OK' : 'N/A'}</div>
            </div>
            {data.condicoesEntrega.externa.obs && <div className="text-xs mt-1 italic">Obs: {data.condicoesEntrega.externa.obs}</div>}
          </div>

          <div className="mb-3">
            <h3 className="font-semibold mb-1">Interna</h3>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>Bancos: {data.condicoesEntrega.interna.bancos ? 'OK' : 'N/A'}</div>
              <div>Painel: {data.condicoesEntrega.interna.painel ? 'OK' : 'N/A'}</div>
              <div>Ar Condicionado: {data.condicoesEntrega.interna.arCondicionado ? 'OK' : 'N/A'}</div>
              <div>Tapetes: {data.condicoesEntrega.interna.tapetes ? 'OK' : 'N/A'}</div>
              <div>Cintos: {data.condicoesEntrega.interna.cintos ? 'OK' : 'N/A'}</div>
            </div>
            {data.condicoesEntrega.interna.obs && <div className="text-xs mt-1 italic">Obs: {data.condicoesEntrega.interna.obs}</div>}
          </div>

          <div>
            <h3 className="font-semibold mb-1">Mecânica</h3>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>Motor: {data.condicoesEntrega.mecanica.motor ? 'OK' : 'N/A'}</div>
              <div>Freios: {data.condicoesEntrega.mecanica.freios ? 'OK' : 'N/A'}</div>
              <div>Direção: {data.condicoesEntrega.mecanica.direcao ? 'OK' : 'N/A'}</div>
              <div>Suspensão: {data.condicoesEntrega.mecanica.suspensao ? 'OK' : 'N/A'}</div>
              <div>Luzes de Alerta: {data.condicoesEntrega.mecanica.luzesAlerta ? 'OK' : 'N/A'}</div>
            </div>
            {data.condicoesEntrega.mecanica.obs && <div className="text-xs mt-1 italic">Obs: {data.condicoesEntrega.mecanica.obs}</div>}
          </div>
        </section>

        {/* 5. Acessórios e Documentos */}
        <section>
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">5. Acessórios e Documentos</h2>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>Documento (CRLV): {data.acessorios.documento ? 'Sim' : 'Não'}</div>
            <div>Manual: {data.acessorios.manual ? 'Sim' : 'Não'}</div>
            <div>Chave Principal: {data.acessorios.chavePrincipal ? 'Sim' : 'Não'}</div>
            <div>Triângulo: {data.acessorios.triangulo ? 'Sim' : 'Não'}</div>
            <div>Macaco: {data.acessorios.macaco ? 'Sim' : 'Não'}</div>
            <div>Chave de Roda: {data.acessorios.chaveRoda ? 'Sim' : 'Não'}</div>
            <div>Estepe: {data.acessorios.estepe ? 'Sim' : 'Não'}</div>
            <div>Cartão Combustível: {data.acessorios.cartaoCombustivel ? 'Sim' : 'Não'}</div>
            <div>Controle Portão: {data.acessorios.controlePortao ? 'Sim' : 'Não'}</div>
            {data.veiculo.marcaModelo === 'Fiat Mobi Like' && (
              <div>Giroflex: {data.acessorios.giroflex ? 'Sim' : 'Não'}</div>
            )}
          </div>
          {data.acessorios.obs && <div className="text-xs mt-1 italic">Obs: {data.acessorios.obs}</div>}
        </section>

        {/* 6. Nível de Combustível */}
        <section>
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">6. Nível de Combustível Inicial/Recebimento</h2>
          <div>{data.combustivelEntrega || 'Não informado'}</div>
        </section>

        {/* 7. Condições na Devolução */}
        <section>
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">7. Condições na Finalização/Devolução</h2>
          <div className="min-h-[60px] whitespace-pre-wrap">{data.condicoesDevolucao || 'Nenhuma avaria ou ocorrência relatada.'}</div>
        </section>

        {/* Fotos */}
        {data.fotos && data.fotos.length > 0 && (
          <section>
            <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">Fotos do Veículo</h2>
            <div className="grid grid-cols-4 gap-2">
              {data.fotos.map((foto, index) => (
                <div key={index} className="aspect-square border border-zinc-200">
                  <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Termo de Responsabilidade */}
        <section className="pt-4">
          <h2 className="font-bold text-lg border-b border-zinc-200 mb-2 pb-1">8. Termo de Responsabilidade</h2>
          <p className="text-justify text-xs leading-relaxed italic">
            "Eu, <strong className="not-italic">{data.colaborador.nome || '____________________'}</strong>, declaro que recebi o veículo nas condições descritas neste checklist, comprometendo-me a utilizá-lo exclusivamente para fins autorizados, cumprir a legislação de trânsito vigente, zelar pela conservação do bem, comunicar imediatamente qualquer sinistro ou irregularidade e assumir responsabilidade por multas decorrentes de infrações cometidas durante o período de utilização por mim, conforme o termo de responsabilidade assinado com a empresa <strong className="not-italic">{data.empresa.razaoSocial || '____________________'}</strong>{data.empresa.cnpj ? <span className="not-italic font-medium">, CNPJ: {data.empresa.cnpj}</span> : ''}."
          </p>
        </section>

        {/* Assinaturas */}
        <section className="pt-12 pb-8">
          <div className="grid grid-cols-2 gap-12">
            <div className="text-center">
              <div className="border-t border-zinc-900 pt-2">
                <p className="font-bold text-sm uppercase">Assinatura do Colaborador</p>
                <p className="text-sm">{data.colaborador.nome || 'Nome do Colaborador'}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-zinc-900 pt-2">
                <p className="font-bold text-sm uppercase">Assinatura do Responsável</p>
                <p className="text-sm">{data.empresa.razaoSocial || 'Nome da Empresa'}</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 text-sm">
            Manaus, {new Date().toLocaleDateString('pt-BR')}
          </div>
        </section>
      </div>
    </div>
  );
}
