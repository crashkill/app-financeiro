import { supabase } from '../lib/supabase';

export interface FilterData {
  projects: string[];
  years: number[];
}

export interface FilterOptions {
  includeAllYears?: boolean;
  cacheTimeout?: number;
}

class FilterDataService {
  private static instance: FilterDataService;
  private cache: Map<string, { data: FilterData; timestamp: number }> = new Map();
  private readonly DEFAULT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  static getInstance(): FilterDataService {
    if (!FilterDataService.instance) {
      FilterDataService.instance = new FilterDataService();
    }
    return FilterDataService.instance;
  }

  private getCacheKey(options: FilterOptions = {}): string {
    return `filter_data_${JSON.stringify(options)}`;
  }

  private isCacheValid(timestamp: number, timeout: number): boolean {
    return Date.now() - timestamp < timeout;
  }

  private getFromCache(options: FilterOptions = {}): FilterData | null {
    const cacheKey = this.getCacheKey(options);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp, options.cacheTimeout || this.DEFAULT_CACHE_TIMEOUT)) {
      return cached.data;
    }

    this.cache.delete(cacheKey);
    return null;
  }

  private setCache(data: FilterData, options: FilterOptions = {}): void {
    const cacheKey = this.getCacheKey(options);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  private async fetchFromSupabase(): Promise<FilterData> {
    try {
      console.log('[FilterDataService] Buscando dados da tabela dre_hitss...');

      // Buscar projetos únicos
      const { data: projectsData, error: projectsError } = await supabase
        .from('dre_hitss')
        .select('projeto')
        .eq('ativo', true)
        .not('projeto', 'is', null)
        .order('projeto');

      if (projectsError) {
        console.error('[FilterDataService] Erro ao buscar projetos:', projectsError);
        throw projectsError;
      }

      // Buscar anos únicos
      const { data: yearsData, error: yearsError } = await supabase
        .from('dre_hitss')
        .select('ano')
        .eq('ativo', true)
        .not('ano', 'is', null)
        .order('ano', { ascending: false });

      if (yearsError) {
        console.error('[FilterDataService] Erro ao buscar anos:', yearsError);
        throw yearsError;
      }

      // Extrair valores únicos
      const projects = Array.from(new Set(
        (projectsData || []).map((item: any) => item.projeto).filter(Boolean)
      )).sort();

      const years = Array.from(new Set(
        (yearsData || []).map((item: any) => item.ano).filter(Boolean)
      )).sort((a: number, b: number) => b - a); // Ordenar do mais recente para o mais antigo

      const result: FilterData = { projects, years };

      console.log(`[FilterDataService] Dados carregados: ${projects.length} projetos, ${years.length} anos`);

      return result;
    } catch (error) {
      console.error('[FilterDataService] Erro ao buscar dados do Supabase:', error);
      throw error;
    }
  }

  async getFilterData(options: FilterOptions = {}): Promise<FilterData> {
    try {
      // Verificar cache primeiro
      const cached = this.getFromCache(options);
      if (cached) {
        console.log('[FilterDataService] Retornando dados do cache');
        return cached;
      }

      // Buscar dados do Supabase
      const data = await this.fetchFromSupabase();

      // Armazenar no cache
      this.setCache(data, options);

      return data;
    } catch (error) {
      console.error('[FilterDataService] Erro ao obter dados de filtro:', error);

      // Retornar dados vazios em caso de erro
      return {
        projects: [],
        years: []
      };
    }
  }

  async getProjects(): Promise<string[]> {
    const data = await this.getFilterData();
    return data.projects;
  }

  async getYears(): Promise<number[]> {
    const data = await this.getFilterData();
    return data.years;
  }

  async refreshCache(options: FilterOptions = {}): Promise<FilterData> {
    console.log('[FilterDataService] Forçando refresh do cache...');

    // Limpar cache específico
    const cacheKey = this.getCacheKey(options);
    this.cache.delete(cacheKey);

    // Buscar dados frescos
    return this.getFilterData(options);
  }

  clearCache(): void {
    console.log('[FilterDataService] Limpando cache...');
    this.cache.clear();
  }

  // Método para verificar se há dados disponíveis
  async hasData(): Promise<boolean> {
    try {
      const data = await this.getFilterData();
      return data.projects.length > 0 && data.years.length > 0;
    } catch {
      return false;
    }
  }
}

export const filterDataService = FilterDataService.getInstance();
export default FilterDataService;
