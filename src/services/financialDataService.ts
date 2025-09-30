import { supabase } from '../lib/supabase';
import type {
  DRERecord,
  MonthlyData,
  ForecastData,
  ProfessionalData,
  UnifiedAPIResponse,
  QueryFilters,
  QueryParams,
  ValidationResult,
  RetryConfig,
  RetryResult
} from '../types/contracts';

// Variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Métricas agregadas para dashboard
export interface DashboardMetrics {
  projeto: string;
  ano: number;
  mes: number;
  receita_total: number;
  custo_total: number;
  margem_bruta: number;
  margem_percentual: number;
  created_at: string;
  updated_at: string;
}

// Métricas de performance do sistema
export interface PerformanceMetrics {
  timestamp: string;
  requestDuration: number;
  retryAttempts: number;
  cacheHit: boolean;
}

// Classe para validação de schema
class SchemaValidator {
  static validateDRERecord(data: any): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    
    if (!data.projeto || typeof data.projeto !== 'string') {
      errors.push({ field: 'projeto', message: 'Projeto é obrigatório e deve ser string', value: data.projeto });
    }
    
    if (!data.ano || typeof data.ano !== 'number' || data.ano < 2000 || data.ano > 2100) {
      errors.push({ field: 'ano', message: 'Ano deve ser um número válido entre 2000 e 2100', value: data.ano });
    }
    
    if (!data.mes || typeof data.mes !== 'number' || data.mes < 1 || data.mes > 12) {
      errors.push({ field: 'mes', message: 'Mês deve ser um número entre 1 e 12', value: data.mes });
    }
    
    if (typeof data.valor !== 'number' || isNaN(data.valor)) {
      errors.push({ field: 'valor', message: 'Valor deve ser um número válido', value: data.valor });
    }
    
    if (!['receita', 'custo', 'despesa'].includes(data.tipo)) {
      errors.push({ field: 'tipo', message: 'Tipo deve ser receita, custo ou despesa', value: data.tipo });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static validateQueryParams(params: any): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    
    const validTypes = [
      'dashboard', 'planilhas', 'forecast', 'profissionais', 'projetos', 'anos', 'all',
      'calculate-dashboard-metrics', 'calculate-planilhas-metrics', 'calculate-forecast-metrics', 
      'calculate-profissionais-metrics', 'calculate-all-metrics', 'profissionais-metrics'
    ];
    
    if (!params.type || !validTypes.includes(params.type)) {
      errors.push({ field: 'type', message: 'Tipo de consulta inválido', value: params.type });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Classe para gerenciar retry com backoff exponencial
class RetryManager {
  private config: RetryConfig;
  
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      timeout: 60000,
      jitter: true,
      ...config
    };
  }
  
  async execute<T>(operation: () => Promise<T>, context: string = 'operation'): Promise<RetryResult<T>> {
    const stats: RetryResult<T>['stats'] = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageDelay: 0
    };
    
    let totalDelay = 0;
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      stats.totalAttempts++;
      
      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)
          )
        ]);
        
        stats.successfulAttempts++;
        stats.lastSuccess = new Date().toISOString();
        
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalDelay,
          stats
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        stats.failedAttempts++;
        stats.lastError = lastError.message;
        
        console.warn(`${context} - Tentativa ${attempt}/${this.config.maxRetries} falhou:`, lastError.message);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          totalDelay += delay;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    stats.averageDelay = totalDelay / (stats.totalAttempts - 1);
    
    return {
      success: false,
      error: lastError,
      attempts: this.config.maxRetries,
      totalDelay,
      stats
    };
  }
  
  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
      this.config.maxDelay
    );
    
    if (this.config.jitter) {
      return exponentialDelay * (0.5 + Math.random() * 0.5);
    }
    
    return exponentialDelay;
  }
}

// Tipos legados mantidos para compatibilidade
export interface LegacyDashboardMetrics {
  id: string;
  projeto: string;
  ano: number;
  mes: number;
  receita_total: number;
  custo_total: number;
  margem_bruta: number;
  margem_percentual: number;
  created_at: string;
  updated_at: string;
}

export interface PlanilhasMetrics {
  id: string;
  projeto: string;
  ano: number;
  mes: number;
  receita_mensal: number;
  receita_acumulada: number;
  desoneracao_mensal: number;
  desoneracao_acumulada: number;
  custo_mensal: number;
  custo_acumulado: number;
  margem_mensal: number;
  margem_acumulada: number;
  created_at: string;
  updated_at: string;
}

export interface ForecastMetrics {
  id: string;
  projeto: string;
  ano: number;
  mes: number;
  receita_total: number;
  custo_total: number;
  margem_bruta: number;
  margem_percentual: number;
  is_projecao: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfissionaisMetrics {
  id: string;
  projeto: string;
  ano: number;
  mes: number;
  tipo_custo: string;
  descricao: string;
  valor: number;
  total_tipo: number;
  percentual_tipo: number;
  total_geral: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialDataResponse<T> {
  success: boolean;
  type: string;
  data: T;
  count: number;
  filters: {
    projeto?: string;
    ano?: number;
    mes?: number;
  };
}

class FinancialDataService {
  private static instance: FinancialDataService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;
  private retryManager: RetryManager;
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private baseUrl: string;

  private constructor() {
    // Atualizado para usar a API da Vercel em vez da Edge Function do Supabase
    this.baseUrl = `/api`;
    this.retryManager = new RetryManager({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      timeout: 30000
    });
  }

  static getInstance(): FinancialDataService {
    if (!FinancialDataService.instance) {
      FinancialDataService.instance = new FinancialDataService();
    }
    return FinancialDataService.instance;
  }

  private async callEdgeFunction<T>(endpoint: string, params: Record<string, any>): Promise<FinancialDataResponse<T>> {
    try {
      // Simplificado para chamar a API da Vercel
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao chamar ${endpoint}:`, error);
      throw error;
    }
  }

  // Método para chamar a nova Edge Function unificada
  private async callUnifiedFunction<T>(type: string, filters: any = {}): Promise<T> {
    const startTime = Date.now();
    const requestBody = { type, filters };
    const cacheKey = `unified_${JSON.stringify(requestBody)}`;
    
    // Verificar cache primeiro
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Validar parâmetros
    const validation = SchemaValidator.validateQueryParams({ type, ...filters });
    if (!validation.valid) {
      throw new Error(`Parâmetros inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    const result = await this.retryManager.execute(async () => {
      const response = await this.callEdgeFunction<any>('financial-data-unified', requestBody);
      
      // Verificar se a resposta tem o formato esperado
      if (!response || !response.success) {
        throw new Error(`Edge Function retornou erro: ${(response as any)?.error || 'Resposta inválida'}`);
      }
      
      return response;
    }, `callUnifiedFunction(${type})`);
    
    if (!result.success) {
      console.error('Falha após todas as tentativas:', result.error?.message);
      // Fallback para função antiga se a nova falhar
      const fallbackResponse = await this.callEdgeFunction<T>('graphql-financial-data', { type, ...filters });
      return fallbackResponse.data;
    }
    
    // Registrar métricas de performance
    const endTime = Date.now();
    this.recordPerformanceMetrics(type, {
      requestDuration: endTime - startTime,
      retryAttempts: result.attempts,
      cacheHit: false,
      timestamp: new Date().toISOString()
    });
    
    // Garantir que tipos que devem retornar arrays sempre retornem arrays
    let responseData = result.data;
    
    // Tratamento especial para o tipo 'projetos'
    if (type === 'projetos') {
      // Se a resposta já é um array, mantém como está
      if (Array.isArray(responseData)) {
        console.log(`Resposta de projetos já é um array com ${responseData.length} itens`);
      } 
      // Se a resposta tem um campo 'projetos', usa esse campo
      else if (responseData && (responseData as any).projetos && Array.isArray((responseData as any).projetos)) {
        console.log(`Extraindo campo 'projetos' da resposta com ${(responseData as any).projetos.length} itens`);
        responseData = (responseData as any).projetos;
      }
      // Se não é nenhum dos formatos esperados, retorna um objeto com o campo 'projetos'
      else if (responseData && !Array.isArray(responseData) && typeof responseData === 'object') {
        console.log(`Convertendo resposta para formato esperado`);
        responseData = { projetos: responseData } as any;
      }
    }
    // Para outros tipos que devem retornar arrays
    else if (['planilhas', 'dashboard', 'forecast'].includes(type) && !Array.isArray(responseData)) {
      console.warn(`Tipo '${type}' deveria retornar array, mas retornou:`, typeof responseData);
      responseData = {
        success: true,
        type: type,
        data: [],
        count: 0,
        filters: filters,
        timestamp: new Date().toISOString()
      } as any;
    }
    
    // Armazenar no cache
    this.setCache(cacheKey, responseData, this.CACHE_TTL);
    
    return responseData as T;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private recordPerformanceMetrics(operation: string, metrics: PerformanceMetrics): void {
    this.performanceMetrics.set(operation, metrics);
  }
  
  // Método para obter métricas de performance
  getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }
  
  // Método para obter status de saúde do serviço
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    metrics: {
      cacheSize: number;
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
    edgeFunctionStatus: 'available' | 'unavailable';
  }> {
    const metrics = Array.from(this.performanceMetrics.values());
    const totalRequests = metrics.length;
    const averageResponseTime = totalRequests > 0 
      ? metrics.reduce((sum, m) => sum + m.requestDuration, 0) / totalRequests 
      : 0;
    
    // Testar conectividade com Edge Function
    let edgeFunctionStatus: 'available' | 'unavailable' = 'available';
    try {
      await this.callUnifiedFunction('projetos', {});
    } catch {
      edgeFunctionStatus = 'unavailable';
    }
    
    const errorRate = totalRequests > 0 
      ? metrics.filter(m => m.retryAttempts > 1).length / totalRequests 
      : 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (edgeFunctionStatus === 'unavailable' || errorRate > 0.5) {
      status = 'unhealthy';
    } else if (errorRate > 0.2 || averageResponseTime > 5000) {
      status = 'degraded';
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      metrics: {
        cacheSize: this.cache.size,
        totalRequests,
        averageResponseTime,
        errorRate
      },
      edgeFunctionStatus
    };
  }
  
  // Método para limpar cache e métricas
  clearCache(): void {
    this.cache.clear();
    this.performanceMetrics.clear();
  }

  // Métodos para calcular métricas
  async calculateDashboardMetrics(filters: {
    projetos?: string[];
    ano?: number;
    mes?: number;
  }): Promise<DashboardMetrics> {
    const startTime = Date.now();
    
    try {
      // Tentar primeiro via nova edge function unificada
      const response = await this.callUnifiedFunction<DashboardMetrics>('calculate-dashboard-metrics', filters);
      
      // Validar dados retornados
      if (!response) {
        throw new Error('Dados inválidos retornados da API');
      }
      
      this.recordPerformanceMetrics('calculateDashboardMetrics', {
        requestDuration: Date.now() - startTime,
        retryAttempts: 1,
        cacheHit: false,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      console.warn('Edge function falhou, calculando métricas diretamente:', error);
      // Fallback: cálculo direto das métricas com retry
      return this.calculateDashboardMetricsWithFallback(filters);
    }
  }
  
  private async calculateDashboardMetricsWithFallback(filters: {
    projetos?: string[];
    ano?: number;
    mes?: number;
  }): Promise<DashboardMetrics> {
    const result = await this.retryManager.execute(async () => {
      return this.calculateDashboardMetricsDirect(filters);
    }, 'calculateDashboardMetricsDirect');
    
    if (!result.success) {
      console.error('Fallback também falhou:', result.error?.message);
      throw new Error('Falha ao calcular métricas do dashboard');
    }
    
    return result.data;
  }

  private async calculateDashboardMetricsDirect(filters: {
    projetos?: string[];
    ano?: number;
    mes?: number;
  }): Promise<DashboardMetrics> {
    try {
      let query = supabase
        .from('dre_hitss')
        .select('receita_total, custo_total, desoneracao')
        .eq('ativo', true);

      if (filters.projetos && filters.projetos.length > 0) {
        query = query.in('projeto', filters.projetos);
      }
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }
      if (filters.mes) {
        query = query.eq('mes', filters.mes);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar dados para métricas:', error);
        throw error;
      }

      // Calcular métricas usando os campos corretos
      const totalReceitas = (data || []).reduce((sum: number, item: any) => {
        return sum + Number(item.receita_total || 0);
      }, 0);

      const totalCustos = (data || []).reduce((sum: number, item: any) => {
        return sum + Number(item.custo_total || 0);
      }, 0);

      const totalDesoneracao = (data || []).reduce((sum: number, item: any) => {
        return sum + Number(item.desoneracao || 0);
      }, 0);

      const margem = totalReceitas - totalCustos;
      const margemPercentual = totalReceitas > 0 ? (margem / totalReceitas) * 100 : 0;

      return {
        projeto: filters.projetos?.[0] || '',
        ano: filters.ano || new Date().getFullYear(),
        mes: filters.mes || new Date().getMonth() + 1,
        receita_total: totalReceitas,
        custo_total: totalCustos,
        margem_bruta: margem,
        margem_percentual: margemPercentual,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro no cálculo direto de métricas:', error);
      throw error;
    }
  }

  async calculatePlanilhasMetrics(projeto: string, ano: number, mes?: number): Promise<void> {
    await this.callUnifiedFunction('calculate-planilhas-metrics', { projeto, ano, mes });
  }

  async calculateForecastMetrics(projeto: string, ano: number, mes?: number): Promise<void> {
    await this.callUnifiedFunction('calculate-forecast-metrics', { projeto, ano, mes });
  }

  async calculateProfissionaisMetrics(projeto: string, ano: number, mes?: number): Promise<void> {
    await this.callUnifiedFunction('calculate-profissionais-metrics', { projeto, ano, mes });
  }

  async calculateAllMetrics(projeto: string, ano: number, mes?: number): Promise<void> {
    await this.callUnifiedFunction('calculate-all-metrics', { projeto, ano, mes });
  }

  // Métodos para obter dados pré-calculados
  async getDashboardData(projeto: string, ano: number, mes?: number): Promise<DashboardMetrics[]> {
    try {
      // Tentar primeiro via Edge Function
      const result = await this.callUnifiedFunction<DashboardMetrics[]>('dashboard', {
        projeto,
        ano,
        mes
      });
      return result;
    } catch (error) {
      console.warn('Edge Function falhou, usando consulta direta:', error);
      // Fallback: consulta direta à tabela dre_hitss
      return this.getDashboardDataDirect(projeto, ano, mes);
    }
  }

  private async getDashboardDataDirect(projeto: string, ano: number, mes?: number): Promise<DashboardMetrics[]> {
    try {
      let query = supabase
        .from('dre_hitss')
        .select('projeto, ano, mes, receita_total, custo_total, desoneracao')
        .eq('ativo', true)
        .eq('projeto', projeto)
        .eq('ano', ano);

      if (mes) {
        query = query.eq('mes', mes);
      }

      const { data, error } = await query.order('mes');

      if (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        throw error;
      }

      // Agrupar dados por mês e calcular métricas
      const groupedData = new Map<number, {
        receita_total: number;
        custo_total: number;
        desoneracao: number;
      }>();

      (data || []).forEach((item: any) => {
        const mesKey = item.mes;
        const existing = groupedData.get(mesKey) || {
          receita_total: 0,
          custo_total: 0,
          desoneracao: 0
        };

        existing.receita_total += Number(item.receita_total || 0);
        existing.custo_total += Number(item.custo_total || 0);
        existing.desoneracao += Number(item.desoneracao || 0);

        groupedData.set(mesKey, existing);
      });

      // Converter para array de DashboardMetrics
      const result: DashboardMetrics[] = [];
      groupedData.forEach((metrics, mesKey) => {
        const margem_bruta = metrics.receita_total - metrics.custo_total;
        const margem_percentual = metrics.receita_total > 0 
          ? (margem_bruta / metrics.receita_total) * 100 
          : 0;

        result.push({
          projeto,
          ano,
          mes: mesKey,
          receita_total: metrics.receita_total,
          custo_total: metrics.custo_total,
          margem_bruta,
          margem_percentual,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

      return result.sort((a, b) => a.mes - b.mes);
    } catch (error) {
      console.error('Erro na consulta direta do dashboard:', error);
      throw error;
    }
  }

  async getPlanilhasData(projeto: string, ano: number, mes?: number): Promise<PlanilhasMetrics[]> {
    return await this.callUnifiedFunction<PlanilhasMetrics[]>('planilhas', {
      projeto,
      ano,
      mes
    });
  }

  async getForecastData(projeto: string, ano: number, mes?: number): Promise<ForecastMetrics[]> {
    return await this.callUnifiedFunction<ForecastMetrics[]>('forecast', {
      projeto,
      ano,
      mes
    });
  }

  async getProfissionaisData(projeto: string, ano: number, mes?: number): Promise<{
    raw_data: ProfissionaisMetrics[];
    grouped_data: Array<{
      tipo: string;
      total: number;
      percentual: number;
      items: Array<{ descricao: string; valor: number }>;
    }>;
    total_geral: number;
  }> {
    return await this.callUnifiedFunction<any>('profissionais', {
      projeto,
      ano,
      mes
    });
  }

  // Método para buscar métricas de profissionais com filtros múltiplos
  async getProfissionaisMetrics(filters: {
    projects?: string[];
    year?: number;
    month?: number;
  }): Promise<Array<{
    projeto: string;
    ano: number;
    mes: number;
    custo_total: number;
    custo_clt: number;
    custo_outros: number;
    custo_subcontratados: number;
  }>> {
    try {
      return await this.callUnifiedFunction<any>('profissionais-metrics', {
        projetos: filters.projects,
        ano: filters.year,
        mes: filters.month
      });
    } catch (error) {
      console.warn('Edge function falhou, usando consulta direta:', error);
      return this.getProfissionaisMetricsDirect(filters);
    }
  }

  private async getProfissionaisMetricsDirect(filters: {
    projects?: string[];
    year?: number;
    month?: number;
  }): Promise<Array<{
    projeto: string;
    ano: number;
    mes: number;
    custo_total: number;
    custo_clt: number;
    custo_outros: number;
    custo_subcontratados: number;
  }>> {
    try {
      let query = supabase
        .from('dre_hitss')
        .select('projeto, ano, mes, custo_clt, custo_outros, custo_subcontratados')
        .eq('ativo', true);

      if (filters.projects && filters.projects.length > 0) {
        query = query.in('projeto', filters.projects);
      }

      if (filters.year) {
        query = query.eq('ano', filters.year);
      }

      if (filters.month) {
        query = query.eq('mes', filters.month);
      }

      const { data, error } = await query.order('projeto').order('ano').order('mes');

      if (error) {
        console.error('Erro ao buscar métricas de profissionais:', error);
        throw error;
      }

      // Processar dados para calcular totais
      return (data || []).map((item: any) => ({
        projeto: item.projeto,
        ano: item.ano,
        mes: item.mes,
        custo_clt: item.custo_clt || 0,
        custo_outros: item.custo_outros || 0,
        custo_subcontratados: item.custo_subcontratados || 0,
        custo_total: (item.custo_clt || 0) + (item.custo_outros || 0) + (item.custo_subcontratados || 0)
      }));
    } catch (error) {
      console.error('Erro na consulta direta de métricas de profissionais:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  async getAvailableProjects(): Promise<string[]> {
    try {
      // Usar diretamente a consulta à tabela dre_hitss para garantir todos os projetos
      return this.getAvailableProjectsDirect();
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      throw error;
    }
  }

  private async getAvailableProjectsDirect(): Promise<string[]> {
    try {
      console.log('Buscando todos os projetos diretamente da tabela dre_hitss');
      const { data, error } = await supabase
        .from('dre_hitss')
        .select('projeto')
        .order('projeto');

      if (error) {
        console.error('Erro ao buscar projetos:', error);
        throw error;
      }

      // Extrair projetos únicos sem limitação
      const uniqueProjects = Array.from(new Set((data || []).map((item: any) => item.projeto)));
      const filteredProjects = uniqueProjects.filter(Boolean);
      console.log(`Total de projetos encontrados: ${filteredProjects.length}`);
      return filteredProjects;
    } catch (error) {
      console.error('Erro na consulta direta de projetos:', error);
      throw error;
    }
  }

  async getAvailableYears(projeto?: string): Promise<number[]> {
    try {
      // Tentar primeiro via Edge Function
      const params = projeto ? { projeto } : {};
      const response = await this.callUnifiedFunction<FinancialDataResponse<number[]>>('anos', params);
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
      }
      throw new Error('Resposta inválida da Edge Function');
    } catch (error) {
      console.warn('Edge Function falhou, usando consulta direta:', error);
      // Fallback: consulta direta à tabela dre_hitss
      return this.getAvailableYearsDirect(projeto);
    }
  }

  private async getAvailableYearsDirect(projeto?: string): Promise<number[]> {
    try {
      let query = supabase
        .from('dre_hitss')
        .select('ano')
        .eq('ativo', true);

      if (projeto) {
        query = query.eq('projeto', projeto);
      }

      const { data, error } = await query.order('ano', { ascending: false });

      if (error) {
        console.error('Erro ao buscar anos:', error);
        throw error;
      }

      // Extrair anos únicos
      const uniqueYears = Array.from(new Set((data || []).map((item: any) => item.ano)));
      return uniqueYears.filter(Boolean).sort((a: number, b: number) => b - a);
    } catch (error) {
      console.error('Erro na consulta direta de anos:', error);
      throw error;
    }
  }

  // Método para sincronizar dados (calcular e buscar)
  async syncAndGetDashboardData(projeto?: string, ano?: number, mes?: number): Promise<DashboardMetrics[]> {
    if (projeto && ano) {
      await this.calculateDashboardMetricsWithFallback({ projetos: [projeto], ano });
      return this.getDashboardData(projeto, ano, mes);
    }
    return [];
  }

  async syncAndGetPlanilhasData(projeto?: string, ano?: number, mes?: number): Promise<PlanilhasMetrics[]> {
    if (projeto && ano) {
      await this.calculatePlanilhasMetrics(projeto, ano, mes);
      return this.getPlanilhasData(projeto, ano, mes);
    }
    return [];
  }

  async syncAndGetForecastData(projeto?: string, ano?: number, mes?: number): Promise<ForecastMetrics[]> {
    if (projeto && ano) {
      await this.calculateForecastMetrics(projeto, ano, mes);
      return this.getForecastData(projeto, ano, mes);
    }
    return [];
  }

  async syncAndGetProfissionaisData(projeto?: string, ano?: number, mes?: number) {
    if (projeto && ano) {
      await this.calculateProfissionaisMetrics(projeto, ano, mes);
      return this.getProfissionaisData(projeto, ano, mes);
    }
    return [];
  }
}

export const financialDataService = FinancialDataService.getInstance();
export default FinancialDataService.getInstance();

// Exportar classe para testes
export { FinancialDataService, SchemaValidator, RetryManager };