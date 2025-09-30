import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface DreHitssRow {
  id?: number;
  projeto: string;
  ano: number;
  mes: number;
  valor: number;
  tipo: string;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

interface TransacaoProcessada {
  id?: number;
  projeto: string;
  ano: number;
  mes: number;
  valor: number;
  tipo: string;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

interface UseHitssDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
}

// Função para converter string para número
function converterParaNumero(valor: any): number {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    const numeroLimpo = valor.replace(/[^\d,-]/g, '').replace(',', '.');
    const numero = parseFloat(numeroLimpo);
    return isNaN(numero) ? 0 : numero;
  }
  return 0;
}

// Função para processar dados brutos em formato de transação
function processarDadosHitss(dados: DreHitssRow[]): TransacaoProcessada[] {
  return dados
    .filter(item => item.ativo)
    .map(item => ({
      id: item.id,
      projeto: item.projeto || 'Não informado',
      ano: item.ano || new Date().getFullYear(),
      mes: item.mes || new Date().getMonth() + 1,
      valor: converterParaNumero(item.valor),
      tipo: item.tipo || 'receita',
      ativo: item.ativo,
      data_criacao: item.data_criacao || new Date().toISOString(),
      data_atualizacao: item.data_atualizacao || new Date().toISOString()
    }));
}

// Hook principal para buscar dados da automação HITSS
export function useHitssData(options: UseHitssDataOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutos
    staleTime = 2 * 60 * 1000, // 2 minutos
    cacheTime = 10 * 60 * 1000 // 10 minutos
  } = options;

  return useQuery({
    queryKey: ['hitss-data'],
    queryFn: async (): Promise<TransacaoProcessada[]> => {
      console.log('🔄 Buscando dados da automação HITSS...');
      
      const { data, error } = await supabase
        .from('dre_hitss')
        .select('*')
        .eq('ativo', true)
        .order('data_atualizacao', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar dados HITSS:', error);
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      console.log(`✅ Encontrados ${data?.length || 0} registros ativos`);
      return processarDadosHitss(data || []);
    },
    enabled,
    refetchInterval,
    staleTime,
    gcTime: cacheTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook para buscar dados filtrados por projeto
export function useHitssDataByProject(projeto: string, options: UseHitssDataOptions = {}) {
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000,
    cacheTime = 10 * 60 * 1000
  } = options;

  return useQuery({
    queryKey: ['hitss-data', 'projeto', projeto],
    queryFn: async (): Promise<TransacaoProcessada[]> => {
      console.log(`🔄 Buscando dados do projeto: ${projeto}`);
      
      const { data, error } = await supabase
        .from('dre_hitss')
        .select('*')
        .eq('ativo', true)
        .eq('projeto', projeto)
        .order('data_atualizacao', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar dados do projeto:', error);
        throw new Error(`Erro ao buscar dados do projeto: ${error.message}`);
      }

      console.log(`✅ Encontrados ${data?.length || 0} registros para o projeto ${projeto}`);
      return processarDadosHitss(data || []);
    },
    enabled: enabled && !!projeto,
    staleTime,
    gcTime: cacheTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook para invalidar cache dos dados HITSS
export function useInvalidateHitssData() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['hitss-data'] });
    console.log('🔄 Cache dos dados HITSS invalidado');
  };
}