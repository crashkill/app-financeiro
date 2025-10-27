import { supabase } from '../lib/supabase';

export interface Profissional {
  id?: number;
  nome: string;
  email: string;
  telefone?: string;
  departamento?: string;
  cargo?: string;
  salario?: number;
  data_admissao?: string;
  status?: string;
  tipo_contrato?: string;
  regime?: 'CLT' | 'PJ';
  regime_trabalho?: string;
  local_alocacao?: string;
  proficiencia_cargo?: string;
  disponivel_compartilhamento?: boolean;
  percentual_compartilhamento?: number;
  ativo?: boolean;
  tecnologias?: {
    java?: number;
    javascript?: number;
    python?: number;
    typescript?: number;
    php?: number;
    dotnet?: number;
    react?: number;
    angular?: number;
    ionic?: number;
    flutter?: number;
    mysql?: number;
    postgres?: number;
    oracle_db?: number;
    sql_server?: number;
    mongodb?: number;
    aws?: number;
    azure?: number;
    gcp?: number;
    android?: number;
    cobol?: number;
    linguagem_r?: number;
    linguagem_c?: number;
    linguagem_cpp?: number;
    windows?: number;
    raspberry_pi?: number;
    arduino?: number;
    outras_tecnologias?: string;
  } | string; // Mantém compatibilidade com formato string
  observacoes?: string;
  projeto_atual?: string;
  data_inicio_projeto?: string;
  data_fim_projeto?: string;
  valor_hora?: number;
  valor_mensal?: number;
  origem?: 'colaboradores' | 'profissionais';
  tipo?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  projeto_id?: number;
  projeto_nome?: string;
}

export interface ProfissionalProjeto {
  id?: number;
  profissional_id: number;
  projeto_nome: string;
  percentual_alocacao: number;
  data_inicio: string;
  data_fim?: string;
  valor_hora?: number;
  valor_mensal?: number;
  status: 'ativo' | 'inativo' | 'pausado';
  observacoes?: string;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface ProfissionaisResponse {
  success: boolean;
  data: Profissional[];
  total: number;
  message?: string;
}

export interface ProfissionalResponse {
  success: boolean;
  data: Profissional;
  message?: string;
}

export interface ProfissionalProjetoResponse {
  success: boolean;
  data: ProfissionalProjeto;
  message?: string;
}

export interface ProfissionalProjetosResponse {
  success: boolean;
  data: ProfissionalProjeto[];
  total: number;
  message?: string;
}

class ProfissionaisService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestao-profissionais`;
  }

  private async getAuthHeaders() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se há uma sessão válida, usa o token de acesso
      if (session?.access_token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        };
      }
    } catch (error) {
      console.warn('Erro ao obter sessão:', error);
    }
    
    // Fallback: usa a chave anônima como Bearer token para Edge Functions
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    return response.json();
  }

  // Listar todos os profissionais
  async listarProfissionais(): Promise<ProfissionaisResponse> {
    try {
      console.log('[ProfissionaisService] Buscando colaboradores via Edge Function gestao-profissionais...');
      
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/list?origem=colaboradores`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        const errorMessage = errorData.error?.message || errorData.error || `Erro HTTP: ${response.status}`;
        console.error('[ProfissionaisService] Erro na resposta da API:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // A Edge Function gestao-profissionais retorna { profissionais: [...] }
      if (!result.profissionais || !Array.isArray(result.profissionais)) {
        console.warn('[ProfissionaisService] Resposta inválida da Edge Function:', result);
        const errorMessage = result.error?.message || 'Dados de profissionais inválidos recebidos do servidor';
        throw new Error(errorMessage);
      }

      // Mapear os dados para o formato esperado pelo frontend
      const profissionaisMapeados: Profissional[] = result.profissionais.map((item: any) => {
        // Criar um ID numérico baseado no hash do UUID se necessário
        const id = typeof item.id === 'string' ? 
          Math.abs(item.id.split('').reduce((a: number, b: string) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0)) : item.id;

        return {
          id,
          nome: item.nome || '',
          email: item.email || '',
          regime: item.tipo_contrato || 'CLT',
          local_alocacao: item.local_alocacao || '',
          proficiencia_cargo: item.proficiencia_cargo || '',
          tecnologias: item.tecnologias || [],
          disponivel_compartilhamento: item.disponivel_compartilhamento || false,
          percentual_compartilhamento: parseInt(item.percentual_compartilhamento) || 0,
          observacoes: item.observacoes || '',
          projeto_atual: item.projeto_atual || '',
          data_inicio_projeto: item.data_inicio_projeto || '',
          data_fim_projeto: item.data_fim_projeto || '',
          valor_hora: item.valor_hora || 0,
          valor_mensal: item.valor_mensal || 0,
          projeto_id: null,
          projeto_nome: item.projeto_atual || '',
          origem: 'colaboradores',
          data_criacao: item.criado_em,
          data_atualizacao: item.atualizado_em,
          ativo: item.ativo !== false // Considera ativo se não for explicitamente false
        };
      });

      console.log(`[ProfissionaisService] ${profissionaisMapeados.length} colaboradores carregados com sucesso`);

      return {
        success: true,
        data: profissionaisMapeados,
        total: profissionaisMapeados.length
      };
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao listar colaboradores:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // Buscar profissional por ID
  async buscarProfissional(id: number, origem: 'colaboradores' | 'profissionais' = 'colaboradores'): Promise<ProfissionalResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/${id}?origem=${origem}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        const errorMessage = errorData.error?.message || errorData.error || `Erro HTTP: ${response.status}`;
        console.error('[ProfissionaisService] Erro na resposta da API:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.profissional) {
        console.warn('[ProfissionaisService] Resposta inválida da Edge Function:', result);
        const errorMessage = result.error?.message || 'Dados do profissional inválidos recebidos do servidor';
        throw new Error(errorMessage);
      }

      return {
        success: true,
        data: result.profissional
      };
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao buscar profissional:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // Criar novo profissional
  async criarProfissional(profissional: Omit<Profissional, 'id' | 'origem' | 'tipo' | 'data_criacao' | 'data_atualizacao'>): Promise<ProfissionalResponse> {
    try {
      console.log('[ProfissionaisService] Criando profissional via Edge Function gestao-profissionais...');
      
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(profissional)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        const errorMessage = errorData.error?.message || errorData.error || `Erro HTTP: ${response.status}`;
        console.error('[ProfissionaisService] Erro na resposta da API ao criar:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.profissional) {
        console.warn('[ProfissionaisService] Resposta inválida da Edge Function ao criar:', result);
        const errorMessage = result.error?.message || 'Dados de profissional inválidos recebidos do servidor';
        throw new Error(errorMessage);
      }

      // Mapear o resultado para o formato esperado pelo frontend
      const profissionalCriado: Profissional = {
        id: Math.abs(result.profissional.id.split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0)),
        nome: result.profissional.nome,
        email: result.profissional.email,
        telefone: result.profissional.telefone,
        departamento: result.profissional.departamento,
        cargo: result.profissional.cargo,
        salario: result.profissional.salario,
        data_admissao: result.profissional.data_admissao,
        status: result.profissional.status || 'Ativo',
        tipo_contrato: result.profissional.tipo_contrato,
        regime: result.profissional.regime_trabalho || 'CLT',
        regime_trabalho: result.profissional.regime_trabalho,
        local_alocacao: result.profissional.local_alocacao,
        proficiencia_cargo: result.profissional.proficiencia_cargo,
        disponivel_compartilhamento: result.profissional.disponivel_compartilhamento,
        percentual_compartilhamento: result.profissional.percentual_compartilhamento,
        tecnologias: result.profissional.tecnologias || [],
        observacoes: result.profissional.observacoes,
        projeto_atual: result.profissional.projeto_atual,
        data_inicio_projeto: result.profissional.data_inicio_projeto,
        data_fim_projeto: result.profissional.data_fim_projeto,
        valor_hora: result.profissional.valor_hora,
        valor_mensal: result.profissional.valor_mensal,
        origem: 'profissionais',
        data_criacao: result.profissional.criado_em,
        data_atualizacao: result.profissional.atualizado_em
      };

      console.log('[ProfissionaisService] Profissional criado com sucesso via Edge Function:', profissionalCriado.id);

      return {
        success: true,
        data: profissionalCriado
      };
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao criar profissional:', error);
      throw error;
    }
  }

  // Atualizar profissional existente
  async atualizarProfissional(id: number, profissional: Partial<Profissional>): Promise<ProfissionalResponse> {
    try {
      console.log('[ProfissionaisService] Atualizando profissional via Edge Function gestao-profissionais...', id);
      console.log('🔍 [ProfissionaisService] Dados enviados para atualização:', { id, ...profissional });
      console.log('🔍 [ProfissionaisService] Tecnologias enviadas:', profissional.tecnologias);
      
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...profissional })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        const errorMessage = errorData.error?.message || errorData.error || `Erro HTTP: ${response.status}`;
        console.error('[ProfissionaisService] Erro na resposta da API ao atualizar:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('🔍 [ProfissionaisService] Resposta recebida da Edge Function:', result);
      console.log('🔍 [ProfissionaisService] Tecnologias retornadas:', result.profissional?.tecnologias);
      
      if (!result.profissional) {
        console.warn('[ProfissionaisService] Resposta inválida da Edge Function ao atualizar:', result);
        const errorMessage = result.error?.message || 'Dados de profissional inválidos recebidos do servidor';
        throw new Error(errorMessage);
      }

      // Mapear o resultado para o formato esperado pelo frontend
      const profissionalAtualizado: Profissional = {
        id: Math.abs(result.profissional.id.split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0)),
        nome: result.profissional.nome,
        email: result.profissional.email,
        telefone: result.profissional.telefone,
        departamento: result.profissional.departamento,
        cargo: result.profissional.cargo,
        salario: result.profissional.salario,
        data_admissao: result.profissional.data_admissao,
        status: result.profissional.status || 'Ativo',
        tipo_contrato: result.profissional.tipo_contrato,
        regime: result.profissional.regime_trabalho || 'CLT',
        regime_trabalho: result.profissional.regime_trabalho,
        local_alocacao: result.profissional.local_alocacao,
        proficiencia_cargo: result.profissional.proficiencia_cargo,
        disponivel_compartilhamento: result.profissional.disponivel_compartilhamento,
        percentual_compartilhamento: result.profissional.percentual_compartilhamento,
        tecnologias: result.profissional.tecnologias || [],
        observacoes: result.profissional.observacoes,
        projeto_atual: result.profissional.projeto_atual,
        data_inicio_projeto: result.profissional.data_inicio_projeto,
        data_fim_projeto: result.profissional.data_fim_projeto,
        valor_hora: result.profissional.valor_hora,
        valor_mensal: result.profissional.valor_mensal,
        origem: 'profissionais',
        data_criacao: result.profissional.criado_em,
        data_atualizacao: result.profissional.atualizado_em
      };

      console.log('[ProfissionaisService] Profissional atualizado com sucesso via Edge Function:', profissionalAtualizado.id);

      return {
        success: true,
        data: profissionalAtualizado
      };
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao atualizar profissional:', error);
      throw error;
    }
  }

  // Excluir profissional
  async excluirProfissional(id: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[ProfissionaisService] Excluindo profissional via Edge Function gestao-profissionais...', id);
      
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        const errorMessage = errorData.error?.message || errorData.error || `Erro HTTP: ${response.status}`;
        console.error('[ProfissionaisService] Erro na resposta da API ao excluir:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn('[ProfissionaisService] Resposta inválida da Edge Function ao excluir:', result);
        const errorMessage = result.error?.message || 'Erro ao excluir profissional';
        throw new Error(errorMessage);
      }

      console.log('[ProfissionaisService] Profissional excluído com sucesso via Edge Function:', id);

      return {
        success: true,
        message: result.message || 'Profissional excluído com sucesso'
      };
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao excluir profissional:', error);
      throw error;
    }
  }

  // Filtrar profissionais por critérios
  filtrarProfissionais(profissionais: Profissional[], filtros: {
    regime?: string;
    local_alocacao?: string;
    tecnologia?: string;
    nome?: string;
  }): Profissional[] {
    return profissionais.filter(profissional => {
      if (filtros.regime && profissional.regime !== filtros.regime) {
        return false;
      }
      
      if (filtros.local_alocacao && !profissional.local_alocacao?.includes(filtros.local_alocacao)) {
        return false;
      }
      
      if (filtros.tecnologia && !profissional.tecnologias?.toLowerCase().includes(filtros.tecnologia.toLowerCase())) {
        return false;
      }
      
      if (filtros.nome && !profissional.nome.toLowerCase().includes(filtros.nome.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  // Agrupar profissionais por regime
  agruparPorRegime(profissionais: Profissional[]): { CLT: Profissional[]; PJ: Profissional[] } {
    return profissionais.reduce((acc, profissional) => {
      const regime = profissional.regime || 'CLT';
      if (!acc[regime]) {
        acc[regime] = [];
      }
      acc[regime].push(profissional);
      return acc;
    }, { CLT: [], PJ: [] } as { CLT: Profissional[]; PJ: Profissional[] });
  }

  // Estatísticas dos profissionais
  obterEstatisticas(profissionais: Profissional[]): {
    total: number;
    clt: number;
    pj: number;
    porRegime: { [key: string]: number };
    porLocalAlocacao: { [key: string]: number };
  } {
    const stats = {
      total: profissionais.length,
      clt: 0,
      pj: 0,
      porRegime: {} as { [key: string]: number },
      porLocalAlocacao: {} as { [key: string]: number }
    };

    profissionais.forEach(profissional => {
      const regime = profissional.regime || 'CLT';
      const local = profissional.local_alocacao || 'Não informado';

      // Contar por regime
      if (regime === 'CLT') stats.clt++;
      if (regime === 'PJ') stats.pj++;
      
      stats.porRegime[regime] = (stats.porRegime[regime] || 0) + 1;
      stats.porLocalAlocacao[local] = (stats.porLocalAlocacao[local] || 0) + 1;
    });

    return stats;
  }

  // ===== MÉTODOS PARA GESTÃO DE PROJETOS =====

  // Listar projetos de um profissional
  async listarProjetosProfissional(profissionalId: number): Promise<ProfissionalProjetosResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/projetos/${profissionalId}`, {
        method: 'GET',
        headers
      });

      return this.handleResponse<ProfissionalProjetosResponse>(response);
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao listar projetos do profissional:', error);
      throw error;
    }
  }

  // Vincular profissional a projeto
  async vincularProfissionalProjeto(vinculacao: Omit<ProfissionalProjeto, 'id' | 'data_criacao' | 'data_atualizacao'>): Promise<ProfissionalProjetoResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/projetos/vincular`, {
        method: 'POST',
        headers,
        body: JSON.stringify(vinculacao)
      });

      return this.handleResponse<ProfissionalProjetoResponse>(response);
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao vincular profissional ao projeto:', error);
      throw error;
    }
  }

  // Atualizar vinculação de profissional a projeto
  async atualizarVinculacaoProjeto(id: number, vinculacao: Partial<ProfissionalProjeto>): Promise<ProfissionalProjetoResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/projetos/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(vinculacao)
      });

      return this.handleResponse<ProfissionalProjetoResponse>(response);
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao atualizar vinculação do projeto:', error);
      throw error;
    }
  }

  // Desvincular profissional de projeto
  async desvincularProfissionalProjeto(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/projetos/${id}`, {
        method: 'DELETE',
        headers
      });

      return this.handleResponse<{ success: boolean; message: string }>(response);
    } catch (error) {
      console.error('[ProfissionaisService] Erro ao desvincular profissional do projeto:', error);
      throw error;
    }
  }
}

export const profissionaisService = new ProfissionaisService();
export default profissionaisService;