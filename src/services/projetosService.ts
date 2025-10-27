import { supabase } from '../lib/supabase';

export interface Projeto {
  id: number;
  nome: string;
  cliente?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_total?: number;
  descricao?: string;
  responsavel?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjetosResponse {
  success: boolean;
  data: Projeto[];
  total: number;
  message?: string;
}

export interface ProjetoResponse {
  success: boolean;
  data: Projeto;
  message?: string;
}

class ProjetosService {
  /**
   * Lista todos os projetos ativos
   */
  async listarProjetos(): Promise<ProjetosResponse> {
    try {
      console.log('🔍 [ProjetosService] Iniciando busca de projetos...');
      
      const { data, error, count } = await supabase
        .from('projetos')
        .select('*', { count: 'exact' })
        .eq('status', 'ativo')
        .order('nome', { ascending: true });

      console.log('📊 [ProjetosService] Resultado da query:', { data, error, count });

      if (error) {
        console.error('❌ [ProjetosService] Erro ao buscar projetos:', error);
        return {
          success: false,
          data: [],
          total: 0,
          message: `Erro ao buscar projetos: ${error.message}`
        };
      }

      console.log(`✅ [ProjetosService] ${count || 0} projetos encontrados`);
      return {
        success: true,
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('💥 [ProjetosService] Erro inesperado ao buscar projetos:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Erro inesperado ao buscar projetos'
      };
    }
  }

  /**
   * Busca um projeto por ID
   */
  async buscarProjetoPorId(id: number): Promise<ProjetoResponse> {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar projeto:', error);
        return {
          success: false,
          data: {} as Projeto,
          message: `Erro ao buscar projeto: ${error.message}`
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erro inesperado ao buscar projeto:', error);
      return {
        success: false,
        data: {} as Projeto,
        message: 'Erro inesperado ao buscar projeto'
      };
    }
  }

  /**
   * Lista projetos para uso em filtros (apenas id e nome)
   */
  async listarProjetosParaFiltro(): Promise<{ id: number; nome: string }[]> {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar projetos para filtro:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar projetos para filtro:', error);
      return [];
    }
  }
}

export const projetosService = new ProjetosService();