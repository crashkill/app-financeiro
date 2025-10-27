import { useState, useEffect, useCallback } from 'react';
import { profissionaisService, Profissional } from '../services/profissionaisService';

interface UseProfissionaisManagementResult {
  profissionais: Profissional[];
  isLoading: boolean;
  error: string | null;
  statistics: {
    total: number;
    clt: number;
    pj: number;
    porRegime: { [key: string]: number };
    porLocalAlocacao: { [key: string]: number };
  };
  
  // Ações CRUD
  criarProfissional: (profissional: Omit<Profissional, 'id' | 'origem' | 'tipo' | 'data_criacao' | 'data_atualizacao'>) => Promise<void>;
  atualizarProfissional: (id: number, profissional: Partial<Profissional>, origem?: 'colaboradores' | 'profissionais') => Promise<void>;
  excluirProfissional: (id: number, origem?: 'colaboradores' | 'profissionais') => Promise<void>;
  buscarProfissional: (id: number, origem?: 'colaboradores' | 'profissionais') => Promise<Profissional | null>;
  
  // Filtros e busca
  filtrarProfissionais: (filtros: {
    regime?: string;
    local_alocacao?: string;
    tecnologia?: string;
    nome?: string;
  }) => Profissional[];
  
  // Controle de estado
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useProfissionaisManagement(): UseProfissionaisManagementResult {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar profissionais
  const carregarProfissionais = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await profissionaisService.listarProfissionais();
      
      if (response.success) {
        setProfissionais(response.data);
      } else {
        throw new Error('Falha ao carregar profissionais');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar profissionais';
      setError(errorMessage);
      console.error('[useProfissionaisManagement] Erro ao carregar:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar dados na inicialização
  useEffect(() => {
    carregarProfissionais();
  }, [carregarProfissionais]);

  // Criar profissional
  const criarProfissional = useCallback(async (novoProfissional: Omit<Profissional, 'id' | 'origem' | 'tipo' | 'data_criacao' | 'data_atualizacao'>) => {
    try {
      setError(null);
      const response = await profissionaisService.criarProfissional(novoProfissional);
      
      if (response.success) {
        // Adicionar o novo profissional à lista local
        setProfissionais(prev => [...prev, response.data]);
      } else {
        throw new Error('Falha ao criar profissional');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar profissional';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Atualizar profissional
  const atualizarProfissional = useCallback(async (
    id: number, 
    dadosAtualizacao: Partial<Profissional>, 
    origem: 'colaboradores' | 'profissionais' = 'colaboradores'
  ) => {
    try {
      setError(null);
      const response = await profissionaisService.atualizarProfissional(id, dadosAtualizacao, origem);
      
      if (response.success) {
        // Atualizar o profissional na lista local
        setProfissionais(prev => 
          prev.map(p => 
            p.id === id && p.origem === origem 
              ? { ...p, ...response.data } 
              : p
          )
        );
      } else {
        throw new Error('Falha ao atualizar profissional');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar profissional';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Excluir profissional
  const excluirProfissional = useCallback(async (
    id: number, 
    origem: 'colaboradores' | 'profissionais' = 'colaboradores'
  ) => {
    try {
      setError(null);
      const response = await profissionaisService.excluirProfissional(id, origem);
      
      if (response.success) {
        // Remover o profissional da lista local
        setProfissionais(prev => 
          prev.filter(p => !(p.id === id && p.origem === origem))
        );
      } else {
        throw new Error('Falha ao excluir profissional');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir profissional';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Buscar profissional específico
  const buscarProfissional = useCallback(async (
    id: number, 
    origem: 'colaboradores' | 'profissionais' = 'colaboradores'
  ): Promise<Profissional | null> => {
    try {
      setError(null);
      const response = await profissionaisService.buscarProfissional(id, origem);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Profissional não encontrado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar profissional';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Filtrar profissionais
  const filtrarProfissionais = useCallback((filtros: {
    regime?: string;
    local_alocacao?: string;
    tecnologia?: string;
    nome?: string;
  }) => {
    return profissionaisService.filtrarProfissionais(profissionais, filtros);
  }, [profissionais]);

  // Calcular estatísticas
  const statistics = profissionaisService.obterEstatisticas(profissionais);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refetch
  const refetch = useCallback(async () => {
    await carregarProfissionais();
  }, [carregarProfissionais]);

  return {
    profissionais,
    isLoading,
    error,
    statistics,
    criarProfissional,
    atualizarProfissional,
    excluirProfissional,
    buscarProfissional,
    filtrarProfissionais,
    refetch,
    clearError
  };
}