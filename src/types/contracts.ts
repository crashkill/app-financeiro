// Tipos padronizados para contratos de dados do sistema financeiro

// Registro base da tabela DRE HITSS
export interface DRERecord {
  id: number;
  projeto: string;
  ano: number;
  mes: number;
  valor: number;
  tipo: 'receita' | 'custo' | 'despesa';
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

// Métricas agregadas para dashboard
export interface DashboardMetrics {
  receita_total: number;
  custo_total: number;
  margem_bruta: number;
  margem_percentual: number;
  periodo: {
    ano: number;
    mes?: number;
  };
  projetos_ativos: number;
  ultima_atualizacao: string;
}

// Dados mensais para planilhas
export interface MonthlyData {
  mes: number;
  ano: number;
  receita: number;
  custo: number;
  margem: number;
  margem_percentual: number;
  projetos: string[];
}

// Dados de forecast/projeção
export interface ForecastData {
  mes: number;
  ano: number;
  receita_projetada: number;
  custo_projetado: number;
  margem_projetada: number;
  confianca: number; // 0-100%
  base_calculo: 'media_3_meses' | 'tendencia' | 'manual';
}

// Dados de profissionais por projeto
export interface ProfessionalData {
  projeto: string;
  ano: number;
  custo_total: number;
  detalhes: {
    salarios: number;
    beneficios: number;
    terceiros: number;
    outros: number;
  };
  profissionais_count: number;
}

// Resposta da API unificada
export interface UnifiedAPIResponse<T = any> {
  success: boolean;
  data: T;
  metadata: {
    total_records: number;
    processing_time_ms: number;
    cache_hit: boolean;
    last_updated: string;
  };
  performance?: {
    query_duration_ms: number;
    processing_duration_ms: number;
    total_duration_ms: number;
    cache_size: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Filtros para consultas
export interface QueryFilters {
  projeto?: string;
  ano?: number;
  mes?: number;
  tipo?: 'receita' | 'custo' | 'despesa';
  ativo?: boolean;
  data_inicio?: string;
  data_fim?: string;
}

// Parâmetros para diferentes tipos de consulta
export interface QueryParams {
  type: 'dashboard' | 'planilhas' | 'forecast' | 'profissionais' | 'projetos' | 'anos' | 'all';
  filters: QueryFilters;
  options?: {
    cache_ttl?: number;
    include_metadata?: boolean;
    include_performance?: boolean;
  };
}

// Resultado de validação de schema
export interface ValidationResult {
  valid: boolean;
  errors: {
    field: string;
    message: string;
    value?: any;
  }[];
}

// Métricas de performance do sistema
export interface PerformanceMetrics {
  timestamp: string;
  operation: string;
  duration_ms: number;
  success: boolean;
  cache_hit?: boolean;
  records_processed?: number;
  memory_usage?: number;
  error?: string;
}

// Status de health check
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime_ms: number;
  cache: {
    size: number;
    hit_rate: number;
    memory_usage: number;
  };
  database: {
    connected: boolean;
    response_time_ms?: number;
    last_error?: string;
  };
  environment: {
    deno_version: string;
    memory_usage: number;
    cpu_usage?: number;
  };
}

// Configuração de retry
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeout: number;
  jitter: boolean;
}

// Estatísticas de retry
export interface RetryStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageDelay: number;
  lastError?: string;
  lastSuccess?: string;
}

// Resultado de execução com retry
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
  stats: RetryStats;
}