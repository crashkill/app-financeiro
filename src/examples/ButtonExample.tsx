import React from 'react';
import { Button } from '../components/common';
import { Download, Plus, Save } from 'lucide-react';
import { profissionaisService } from '../services/profissionaisService';

const ButtonExample: React.FC = () => {
  // Handlers para demonstrar o CRUD de profissionais sem alterar o layout
  const handleList = async () => {
    try {
      const res = await profissionaisService.listarProfissionais();
      console.log('[ButtonExample] Lista de profissionais:', res);
    } catch (error) {
      console.error('[ButtonExample] Erro ao listar profissionais:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const timestamp = Date.now();
      const novo = {
        nome: `Profissional ${timestamp}`,
        email: `prof${timestamp}@exemplo.com`,
        regime: 'CLT' as const,
        local_alocacao: 'Remoto',
        proficiencia_cargo: 'Desenvolvedor',
        tecnologias: 'react, node',
        disponivel_compartilhamento: true,
        percentual_compartilhamento: 20,
        projeto_id: undefined,
      };
      const res = await profissionaisService.criarProfissional(novo);
      console.log('[ButtonExample] Profissional criado:', res);
    } catch (error) {
      console.error('[ButtonExample] Erro ao criar profissional:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const lista = await profissionaisService.listarProfissionais();
      const primeiro = lista.data[0];
      if (!primeiro?.id) {
        console.warn('[ButtonExample] Nenhum profissional para atualizar');
        return;
      }
      const res = await profissionaisService.atualizarProfissional(primeiro.id, {
        local_alocacao: 'Híbrido',
        proficiencia_cargo: 'Desenvolvedor Sênior',
      });
      console.log('[ButtonExample] Profissional atualizado:', res);
    } catch (error) {
      console.error('[ButtonExample] Erro ao atualizar profissional:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const lista = await profissionaisService.listarProfissionais();
      const ultimo = lista.data[lista.data.length - 1];
      if (!ultimo?.id) {
        console.warn('[ButtonExample] Nenhum profissional para excluir');
        return;
      }
      await profissionaisService.excluirProfissional(ultimo.id);
      console.log('[ButtonExample] Profissional excluído:', ultimo.id);
    } catch (error) {
      console.error('[ButtonExample] Erro ao excluir profissional:', error);
    }
  };

  const handleLinkProject = async () => {
    try {
      const lista = await profissionaisService.listarProfissionais();
      const profissional = lista.data[0];
      if (!profissional?.id) {
        console.warn('[ButtonExample] Nenhum profissional para vincular');
        return;
      }
      const hoje = new Date().toISOString().split('T')[0];
      const res = await profissionaisService.vincularProfissionalProjeto({
        profissional_id: profissional.id,
        projeto_nome: 'Projeto Demonstração',
        percentual_alocacao: 50,
        data_inicio: hoje,
        status: 'ativo',
      });
      console.log('[ButtonExample] Profissional vinculado ao projeto:', res);
    } catch (error) {
      console.error('[ButtonExample] Erro ao vincular projeto:', error);
    }
  };

  const handleDefineCost = async () => {
    try {
      const lista = await profissionaisService.listarProfissionais();
      const profissional = lista.data[0];
      if (!profissional?.id) {
        console.warn('[ButtonExample] Nenhum profissional para definir custos');
        return;
      }
      // Definição de custos por tipo de conhecimento armazenada em "outras_tecnologias" (compatível com o serviço)
      const custos = { custos: { react: 120, node: 110, python: 100 } };
      const res = await profissionaisService.atualizarProfissional(profissional.id, {
        tecnologias: JSON.stringify(custos),
      });
      console.log('[ButtonExample] Custos por conhecimento definidos:', res);
    } catch (error) {
      console.error('[ButtonExample] Erro ao definir custos:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Exemplos de Botões</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Variantes</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={handleList}>Primário</Button>
          <Button variant="secondary" onClick={handleCreate}>Secundário</Button>
          <Button variant="danger" onClick={handleDelete}>Perigo</Button>
          <Button variant="success" onClick={handleUpdate}>Sucesso</Button>
          <Button variant="outline" onClick={handleLinkProject}>Contorno</Button>
          <Button variant="ghost" onClick={handleDefineCost}>Fantasma</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tamanhos</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Estados</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Normal</Button>
          <Button disabled>Desabilitado</Button>
          <Button loading>Carregando</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Com Ícones</h2>
        <div className="flex flex-wrap gap-4">
          <Button icon={<Plus size={16} />}>Adicionar</Button>
          <Button icon={<Save size={16} />} variant="success">Salvar</Button>
          <Button icon={<Download size={16} />} variant="outline">Baixar</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Largura Total</h2>
        <div className="space-y-2">
          <Button fullWidth>Botão de Largura Total</Button>
          <Button fullWidth variant="secondary">Botão de Largura Total</Button>
        </div>
      </div>
    </div>
  );
};

export default ButtonExample;