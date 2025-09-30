import { supabase } from '../lib/supabase';

/**
 * Interface para requisição de filtro de anos
 */
export interface YearFilterRequest {
  search?: string;
  startYear?: number;
  endYear?: number;
  limit?: number;
  offset?: number;
}

/**
 * Interface para resposta de filtro de anos
 */
export interface YearFilterResponse {
  years: number[];
  total: number;
  hasMore: boolean;
}

/**
 * Serviço para filtrar anos usando Edge Function
 */
export class YearFilterService {
  private static readonly FUNCTION_NAME = 'filter-years';

  /**
   * Filtra anos com base nos parâmetros fornecidos
   */
  static async filterYears(params: YearFilterRequest = {}): Promise<YearFilterResponse> {
    try {
      // Atualizado para usar a API da Vercel em vez da Edge Function do Supabase
      const response = await fetch(`/api/filter-years`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data) {
        throw new Error('Resposta inválida do servidor');
      }

      return data as YearFilterResponse;
    } catch (error) {
      console.error('Erro ao chamar serviço de filtro de anos:', error);
      throw error;
    }
  }

  /**
   * Busca anos por termo de pesquisa
   */
  static async searchYears(search: string, limit: number = 20): Promise<YearFilterResponse> {
    return this.filterYears({
      search,
      limit
    });
  }

  /**
   * Busca anos em um range específico
   */
  static async getYearsByRange(
    startYear: number, 
    endYear: number, 
    limit: number = 50
  ): Promise<YearFilterResponse> {
    return this.filterYears({
      startYear,
      endYear,
      limit
    });
  }

  /**
   * Busca todos os anos disponíveis
   */
  static async getAllYears(): Promise<YearFilterResponse> {
    return this.filterYears({
      limit: 100 // Limite alto para pegar todos os anos
    });
  }

  /**
   * Busca anos com paginação
   */
  static async getYearsPaginated(
    page: number = 1, 
    pageSize: number = 20
  ): Promise<YearFilterResponse> {
    const offset = (page - 1) * pageSize;
    return this.filterYears({
      limit: pageSize,
      offset
    });
  }
}

export default YearFilterService;