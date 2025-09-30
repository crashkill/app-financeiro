import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  type: 'dashboard' | 'planilhas' | 'forecast' | 'profissionais' | 'projetos' | 'anos';
  filters?: {
    projeto?: string;
    ano?: number;
    mes?: number;
  };
}

// Cache do cliente Supabase para reutilização
let supabaseClient: ReturnType<typeof createClient>;

// Função para obter o cliente Supabase (singleton)
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
  }
  return supabaseClient;
}

// Cache de resultados com TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos

// Função para gerar chave de cache
function getCacheKey(type: string, filters: any = {}) {
  return `${type}-${JSON.stringify(filters)}`;
}

// Função para verificar e retornar dados do cache
function getFromCache(key: string) {
  const cached = cache.get(key);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(key);
  }
  return null;
}

// Função para salvar dados no cache
function saveToCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();

    const { type, filters = {} } = await req.json() as RequestBody;
    const cacheKey = getCacheKey(type, filters);
    
    // Tenta obter dados do cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query;
    let tableName: string;

    switch (type) {
      case 'dashboard':
        tableName = 'dre_hitss';
        query = supabaseClient
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'planilhas':
        tableName = 'dre_hitss';
        query = supabaseClient
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'forecast':
        tableName = 'dre_hitss';
        query = supabaseClient
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'profissionais':
        tableName = 'dre_hitss';
        query = supabaseClient
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'projetos':
        tableName = 'dre_hitss';
        console.log('Iniciando query para projetos...');
        query = supabaseClient
          .from(tableName)
          .select('projeto')
          .eq('ativo', true)
          .order('projeto');
        console.log('Query para projetos configurada');
        break;

      case 'anos':
        tableName = 'dre_hitss';
        query = supabaseClient
          .from(tableName)
          .select('ano')
          .eq('ativo', true)
          .order('ano');
        break;

      default:
        throw new Error(`Tipo de dados não suportado: ${type}`);
    }

    // Apply filters
    if (filters.projeto) {
      query = query.eq('projeto', filters.projeto);
    }
    if (filters.ano) {
      query = query.eq('ano', filters.ano);
    }
    if (filters.mes) {
      query = query.eq('mes', filters.mes);
    }

    console.log(`Executando query na tabela '${tableName}' para tipo '${type}'...`);
    console.log(`Query object:`, JSON.stringify(query, null, 2));
    const { data, error, count } = await query;

    if (error) {
      console.error("Erro na query do Supabase:", error);
      throw error;
    }

    // Transforma os dados antes de salvar no cache

    // Transform data based on type
    let transformedData;
    switch (type) {
      case 'dashboard':
        transformedData = data?.map(item => ({
          id: item.id,
          projeto: item.projeto,
          ano: item.ano,
          mes: item.mes,
          receita_total: item.receita_total || 0,
          custo_total: item.custo_total || 0,
          margem_bruta: (item.receita_total || 0) - (item.custo_total || 0),
          margem_percentual: item.receita_total ? ((item.receita_total - item.custo_total) / item.receita_total) * 100 : 0,
          created_at: item.created_at,
          updated_at: item.updated_at
        })) || [];
        break;

      case 'planilhas':
        transformedData = data?.map(item => ({
          id: item.id,
          projeto: item.projeto,
          ano: item.ano,
          mes: item.mes,
          receita_mensal: item.receita_total || 0,
          receita_acumulada: item.receita_total || 0,
          desoneracao_mensal: item.desoneracao || 0,
          desoneracao_acumulada: item.desoneracao || 0,
          custo_mensal: item.custo_total || 0,
          custo_acumulado: item.custo_total || 0,
          margem_mensal: (item.receita_total || 0) - (item.custo_total || 0),
          margem_acumulada: (item.receita_total || 0) - (item.custo_total || 0),
          created_at: item.created_at,
          updated_at: item.updated_at
        })) || [];
        break;

      case 'forecast':
        transformedData = data?.map(item => ({
          id: item.id,
          projeto: item.projeto,
          ano: item.ano,
          mes: item.mes,
          receita_total: item.receita_total || 0,
          custo_total: item.custo_total || 0,
          margem_bruta: (item.receita_total || 0) - (item.custo_total || 0),
          margem_percentual: item.receita_total ? ((item.receita_total - item.custo_total) / item.receita_total) * 100 : 0,
          is_projecao: false,
          created_at: item.created_at,
          updated_at: item.updated_at
        })) || [];
        break;

      case 'profissionais':
        transformedData = data?.map(item => ({
          id: item.id,
          projeto: item.projeto,
          ano: item.ano,
          mes: item.mes,
          tipo_custo: 'Profissionais',
          descricao: item.projeto,
          valor: item.custo_total || 0,
          total_tipo: item.custo_total || 0,
          percentual_tipo: 100,
          total_geral: item.custo_total || 0,
          created_at: item.created_at,
          updated_at: item.updated_at
        })) || [];
        break;

      case 'projetos':
        console.log(`Raw data length for projetos: ${data?.length || 0}`);
        console.log(`First 10 raw items:`, data?.slice(0, 10));
        const allProjects = data?.map(item => item.projeto).filter(Boolean) || [];
        console.log(`All projects before unique: ${allProjects.length}`, allProjects.slice(0, 10));
        const uniqueProjects = [...new Set(allProjects)] || [];
        console.log(`Projetos únicos encontrados: ${uniqueProjects.length}`, uniqueProjects.slice(0, 10));
        transformedData = uniqueProjects;
        break;

      case 'anos':
        console.log(`Raw data length for anos: ${data?.length || 0}`);
        console.log(`First 10 raw items:`, data?.slice(0, 10));
        const allYears = data?.map(item => item.ano).filter(Boolean) || [];
        console.log(`All years before unique: ${allYears.length}`, allYears.slice(0, 10));
        const uniqueYears = [...new Set(allYears)].sort((a, b) => b - a) || [];
        console.log(`Anos únicos encontrados: ${uniqueYears.length}`, uniqueYears);
        transformedData = uniqueYears;
        break;

      default:
        transformedData = data || [];
    }

    const response = {
      success: true,
      type,
      data: transformedData,
      count: count || (Array.isArray(transformedData) ? transformedData.length : 1),
      filters
    };

    console.log(`Resposta preparada para tipo '${type}':`, {
      success: response.success,
      type: response.type,
      dataLength: Array.isArray(response.data) ? response.data.length : 'object',
      count: response.count
    });

    // Salva os dados transformados no cache
    saveToCache(cacheKey, response);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Log detalhado do erro
    const errorDetails = {
      timestamp: new Date().toISOString(),
      type: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestType: type,
      filters: filters
    };

    // Salva o erro no banco para monitoramento
    try {
      await supabaseClient
        .from('logs_auditoria')
        .insert({
          tipo: 'error',
          servico: 'financial-data-unified',
          detalhes: errorDetails,
          usuario_id: null // Erro no sistema
        });
    } catch (logError) {
      console.error('Erro ao salvar log:', logError);
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      errorId: errorDetails.timestamp // Referência para rastreamento
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});