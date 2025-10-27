import { db, Transacao } from '../db/database';
import { supabase } from '../lib/supabase';

// Interfaces para os dados de filtro
export interface ProfissionaisFilterData {
  locaisAlocacao: string[];
  regimes: string[];
  anos: number[];
  meses: { value: number; label: string }[];
}

export interface ProfissionaisFilterOptions {
  cacheTimeout?: number; // em milissegundos
}

class ProfissionaisFilterService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultCacheTimeout = 5 * 60 * 1000; // 5 minutos

  constructor(private options: ProfissionaisFilterOptions = {}) {}

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const timeout = this.options.cacheTimeout || this.defaultCacheTimeout;
    return Date.now() - cached.timestamp < timeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private async getAuthHeaders() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        };
      }
    } catch (error) {
      console.warn('[ProfissionaisFilterService] Erro ao obter sessão:', error);
    }

    return {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    };
  }

  /**
   * Busca dados de filtros via Edge Function (financial-data-unified)
   */
  private async fetchFilterDataFromBackend(): Promise<ProfissionaisFilterData> {
    try {
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-data-unified`;
      const headers = await this.getAuthHeaders();

      const [projetosResp, anosResp] = await Promise.all([
        fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ type: 'projetos' })
        }),
        fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ type: 'anos' })
        })
      ]);

      const projetosJson = await projetosResp.json();
      const anosJson = await anosResp.json();

      const locaisAlocacao = Array.isArray(projetosJson?.data) ? projetosJson.data : [];
      const anos: number[] = Array.isArray(anosJson?.data) ? anosJson.data : [];

      // Regimes fixos (mantendo compatibilidade)
      const regimes = ['CLT', 'PJ', 'Terceirizado', 'Estagiário'];

      // Meses fixos (padrão)
      const meses = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' }
      ];

      return {
        locaisAlocacao,
        regimes,
        anos,
        meses
      };

    } catch (error) {
      console.error('[ProfissionaisFilterService] Erro ao buscar dados de filtro do backend:', error);
      throw error;
    }
  }

  /**
   * Método principal para obter dados de filtro
   */
  async getFilterData(options: ProfissionaisFilterOptions = {}): Promise<ProfissionaisFilterData> {
    try {
      // Verificar cache primeiro
      const cacheKey = 'filter_data';
      if (this.isCacheValid(cacheKey)) {
        console.log('[ProfissionaisFilterService] Retornando dados do cache');
        return this.getCache(cacheKey);
      }

      // Buscar dados via Edge Function
      const data = await this.fetchFilterDataFromBackend();

      // Armazenar no cache
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error('[ProfissionaisFilterService] Erro ao obter dados de filtro:', error);

      // Retornar dados vazios em caso de erro
      return {
        locaisAlocacao: [],
        regimes: ['CLT', 'PJ', 'Terceirizado', 'Estagiário'],
        anos: [new Date().getFullYear()],
        meses: [
          { value: 1, label: 'Janeiro' },
          { value: 2, label: 'Fevereiro' },
          { value: 3, label: 'Março' },
          { value: 4, label: 'Abril' },
          { value: 5, label: 'Maio' },
          { value: 6, label: 'Junho' },
          { value: 7, label: 'Julho' },
          { value: 8, label: 'Agosto' },
          { value: 9, label: 'Setembro' },
          { value: 10, label: 'Outubro' },
          { value: 11, label: 'Novembro' },
          { value: 12, label: 'Dezembro' }
        ]
      };
    }
  }

  async getLocaisAlocacao(): Promise<string[]> {
    const data = await this.getFilterData();
    return data.locaisAlocacao;
  }

  async getRegimes(): Promise<string[]> {
    const data = await this.getFilterData();
    return data.regimes;
  }

  async getAnos(): Promise<number[]> {
    const data = await this.getFilterData();
    return data.anos;
  }

  async getMeses(): Promise<{ value: number; label: string }[]> {
    const data = await this.getFilterData();
    return data.meses;
  }

  async refreshCache(): Promise<ProfissionaisFilterData> {
    console.log('[ProfissionaisFilterService] Forçando refresh do cache...');

    // Limpar cache
    this.clearCache();

    // Buscar dados frescos
    return this.getFilterData();
  }

  clearCache(): void {
    console.log('[ProfissionaisFilterService] Limpando cache...');
    this.cache.clear();
  }

  // Método para verificar se há dados disponíveis
  async hasData(): Promise<boolean> {
    try {
      const data = await this.getFilterData();
      return data.locaisAlocacao.length > 0 || data.regimes.length > 0;
    } catch {
      return false;
    }
  }
}

// Criar instância única do serviço
export const profissionaisFilterService = new ProfissionaisFilterService();
export default ProfissionaisFilterService;