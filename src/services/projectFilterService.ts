import { supabase } from '../lib/supabase';

export interface ProjectFilterRequest {
  year?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFilterResponse {
  success: boolean;
  data: ProjectResponse[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

/**
 * Serviço para filtrar projetos usando a Edge Function
 */
export class ProjectFilterService {
  private static readonly FUNCTION_NAME = 'filter-projects';

  /**
   * Busca projetos com filtros aplicados
   */
  static async filterProjects(filters: ProjectFilterRequest = {}): Promise<ProjectFilterResponse> {
    try {
      // Atualizado para usar a API da Vercel em vez da Edge Function do Supabase
      const response = await fetch(`/api/filter-projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao filtrar projetos');
      }

      return data as ProjectFilterResponse;
    } catch (error) {
      console.error('Erro no serviço de filtro de projetos:', error);
      throw error;
    }
  }

  /**
   * Busca todos os projetos (sem filtros)
   */
  static async getAllProjects(): Promise<ProjectResponse[]> {
    const response = await this.filterProjects({ limit: 1000 });
    return response.data;
  }

  /**
   * Busca projetos por ano
   */
  static async getProjectsByYear(year: number): Promise<ProjectResponse[]> {
    const response = await this.filterProjects({ year, limit: 1000 });
    return response.data;
  }

  /**
   * Busca projetos por termo de pesquisa
   */
  static async searchProjects(search: string): Promise<ProjectResponse[]> {
    const response = await this.filterProjects({ search, limit: 1000 });
    return response.data;
  }

  /**
   * Busca projetos com paginação
   */
  static async getProjectsPaginated(
    page: number = 1,
    limit: number = 50,
    filters: Omit<ProjectFilterRequest, 'limit' | 'offset'> = {}
  ): Promise<ProjectFilterResponse> {
    const offset = (page - 1) * limit;
    return this.filterProjects({ ...filters, limit, offset });
  }
}

export default ProjectFilterService;