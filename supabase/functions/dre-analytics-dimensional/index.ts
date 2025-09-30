import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Interfaces para tipagem das respostas
interface AnalyticsResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    total_records: number;
    execution_time: number;
    cache_key?: string;
  };
}

interface QueryFilters {
  ano?: number;
  mes?: number;
  trimestre?: number;
  projeto?: string;
  cliente?: string;
  natureza?: 'RECEITA' | 'CUSTO';
  tipo_negocio?: 'Mercado' | 'InterCompany';
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const startTime = Date.now();

    let response: AnalyticsResponse;

    switch (endpoint) {
      case 'dashboard-summary':
        response = await getDashboardSummary(supabase, url.searchParams);
        break;
      
      case 'projeto-performance':
        response = await getProjetoPerformance(supabase, url.searchParams);
        break;
      
      case 'receita-custo-analise':
        response = await getReceitaCustoAnalise(supabase, url.searchParams);
        break;
      
      case 'tendencia-temporal':
        response = await getTendenciaTemporal(supabase, url.searchParams);
        break;
      
      case 'top-projetos':
        response = await getTopProjetos(supabase, url.searchParams);
        break;
      
      case 'margem-analise':
        response = await getMargemAnalise(supabase, url.searchParams);
        break;
      
      case 'cliente-performance':
        response = await getClientePerformance(supabase, url.searchParams);
        break;
      
      case 'recursos-utilizacao':
        response = await getRecursosUtilizacao(supabase, url.searchParams);
        break;
      
      case 'comparativo-periodos':
        response = await getComparativoPeriodos(supabase, url.searchParams);
        break;
      
      case 'drill-down':
        response = await getDrillDown(supabase, url.searchParams);
        break;
      
      default:
        response = {
          success: false,
          error: `Endpoint '${endpoint}' não encontrado. Endpoints disponíveis: dashboard-summary, projeto-performance, receita-custo-analise, tendencia-temporal, top-projetos, margem-analise, cliente-performance, recursos-utilizacao, comparativo-periodos, drill-down`
        };
    }

    // Adicionar metadados de performance
    if (response.success && response.data) {
      response.metadata = {
        ...response.metadata,
        execution_time: Date.now() - startTime
      };
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.success ? 200 : 400,
      }
    );

  } catch (error) {
    console.error("Erro na API de Analytics:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// 1. Dashboard Summary - Visão geral dos KPIs principais
async function getDashboardSummary(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  
  try {
    // Query principal para métricas agregadas
    let query = `
      SELECT 
        COUNT(*) as total_lancamentos,
        COUNT(DISTINCT f.id_projeto) as total_projetos,
        COUNT(DISTINCT f.id_cliente) as total_clientes,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) as total_receita,
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as total_custo,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) - 
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as margem_bruta
      FROM fact_dre_lancamentos f
      INNER JOIN dim_projeto p ON f.id_projeto = p.id_projeto
      INNER JOIN dim_cliente cl ON f.id_cliente = cl.id_cliente
      INNER JOIN dim_conta c ON f.id_conta = c.id_conta
      INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
      WHERE f.ativo = TRUE
    `;

    const conditions = buildWhereConditions(filters);
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    // Buscar todos os lançamentos para calcular métricas
    const { data: lancamentos, error } = await supabase
      .from('fact_dre_lancamentos')
      .select(`
        valor_lancamento,
        id_projeto,
        id_cliente,
        dim_conta!inner(natureza)
      `)
      .eq('ativo', true);

    if (error) throw error;

    // Calcular métricas agregadas
    const totalLancamentos = lancamentos?.length || 0;
    const projetosUnicos = new Set(lancamentos?.map(l => l.id_projeto)).size;
    const clientesUnicos = new Set(lancamentos?.map(l => l.id_cliente)).size;
    
    const totalReceita = lancamentos?.reduce((acc, item) => {
      return acc + (item.dim_conta?.natureza === 'RECEITA' ? item.valor_lancamento : 0);
    }, 0) || 0;
    
    const totalCusto = lancamentos?.reduce((acc, item) => {
      return acc + (item.dim_conta?.natureza === 'CUSTO' ? item.valor_lancamento : 0);
    }, 0) || 0;
    
    const margemBruta = totalReceita - totalCusto;
    
    const summaryData = {
      total_lancamentos: totalLancamentos,
      total_projetos: projetosUnicos,
      total_clientes: clientesUnicos,
      total_receita: totalReceita,
      total_custo: totalCusto,
      margem_bruta: margemBruta
    };

    // Buscar distribuição por natureza
    const { data: distribuicao } = await supabase
      .from('vw_dre_por_cliente_natureza')
      .select('natureza, total_valor')
      .gte('ano', filters.ano || new Date().getFullYear() - 1);

    return {
      success: true,
      data: {
        resumo: summaryData,
        distribuicao_natureza: distribuicao,
        periodo_analise: {
          ano: filters.ano || 'Todos',
          mes: filters.mes || 'Todos'
        }
      },
      metadata: {
        total_records: 1
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar resumo do dashboard: ${error.message}`
    };
  }
}

// 2. Performance de Projetos
async function getProjetoPerformance(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  
  try {
    let query = supabase
      .from('vw_dre_receita_custo_projeto')
      .select('*')
      .order('margem_bruta', { ascending: false });

    if (filters.ano) query = query.eq('ano', filters.ano);
    if (filters.mes) query = query.eq('mes', filters.mes);
    if (filters.projeto) query = query.ilike('codigo_projeto', `%${filters.projeto}%`);
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data,
      metadata: {
        total_records: count || data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar performance de projetos: ${error.message}`
    };
  }
}

// 3. Análise Receita vs Custo
async function getReceitaCustoAnalise(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  
  try {
    let query = `
      SELECT 
        per.ano,
        per.mes,
        per.nome_mes,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) as receita,
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as custo,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) - 
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as margem,
        COUNT(*) as total_lancamentos
      FROM fact_dre_lancamentos f
      INNER JOIN dim_conta c ON f.id_conta = c.id_conta
      INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
      WHERE f.ativo = TRUE
    `;

    const conditions = buildWhereConditions(filters, 'per', 'p', 'cl');
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += " GROUP BY per.ano, per.mes, per.nome_mes ORDER BY per.ano DESC, per.mes DESC";

    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
    }

    const { data, error } = await supabase.rpc('execute_sql', {
      query: query
    });

    if (error) throw error;

    return {
      success: true,
      data: data,
      metadata: {
        total_records: data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar análise receita vs custo: ${error.message}`
    };
  }
}

// 4. Tendência Temporal
async function getTendenciaTemporal(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  const agrupamento = params.get('agrupamento') || 'mes'; // mes, trimestre, ano
  
  try {
    let selectFields = '';
    let groupFields = '';
    let orderFields = '';

    switch (agrupamento) {
      case 'trimestre':
        selectFields = 'per.ano, per.trimestre, per.nome_trimestre';
        groupFields = 'per.ano, per.trimestre, per.nome_trimestre';
        orderFields = 'per.ano DESC, per.trimestre DESC';
        break;
      case 'ano':
        selectFields = 'per.ano';
        groupFields = 'per.ano';
        orderFields = 'per.ano DESC';
        break;
      default: // mes
        selectFields = 'per.ano, per.mes, per.nome_mes';
        groupFields = 'per.ano, per.mes, per.nome_mes';
        orderFields = 'per.ano DESC, per.mes DESC';
    }

    let query = `
      SELECT 
        ${selectFields},
        SUM(f.valor_lancamento) as valor_total,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) as receita,
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as custo,
        COUNT(*) as total_lancamentos,
        COUNT(DISTINCT f.id_projeto) as projetos_ativos
      FROM fact_dre_lancamentos f
      INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
      INNER JOIN dim_conta c ON f.id_conta = c.id_conta
      WHERE f.ativo = TRUE
    `;

    const conditions = buildWhereConditions(filters, 'per');
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += ` GROUP BY ${groupFields} ORDER BY ${orderFields}`;

    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
    }

    const { data, error } = await supabase.rpc('execute_sql', {
      query: query
    });

    if (error) throw error;

    return {
      success: true,
      data: {
        tendencia: data,
        agrupamento: agrupamento
      },
      metadata: {
        total_records: data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar tendência temporal: ${error.message}`
    };
  }
}

// 5. Top Projetos
async function getTopProjetos(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  const metrica = params.get('metrica') || 'receita'; // receita, margem, volume
  const limite = filters.limit || 10;
  
  try {
    let orderField = '';
    let selectExtra = '';

    switch (metrica) {
      case 'margem':
        orderField = 'margem_bruta DESC';
        selectExtra = ', margem_bruta';
        break;
      case 'volume':
        orderField = 'total_lancamentos DESC';
        selectExtra = ', COUNT(*) as total_lancamentos';
        break;
      default: // receita
        orderField = 'total_receita DESC';
        selectExtra = ', total_receita';
    }

    let query = `
      SELECT 
        p.codigo_projeto,
        p.nome_projeto,
        p.tipo_negocio,
        cl.nome_cliente,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) as total_receita,
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as total_custo,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) - 
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as margem_bruta,
        COUNT(*) as total_lancamentos
        ${selectExtra}
      FROM fact_dre_lancamentos f
      INNER JOIN dim_projeto p ON f.id_projeto = p.id_projeto
      INNER JOIN dim_cliente cl ON f.id_cliente = cl.id_cliente
      INNER JOIN dim_conta c ON f.id_conta = c.id_conta
      INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
      WHERE f.ativo = TRUE AND p.ativo = TRUE
    `;

    const conditions = buildWhereConditions(filters, 'per', 'p', 'cl');
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += ` GROUP BY p.codigo_projeto, p.nome_projeto, p.tipo_negocio, cl.nome_cliente`;
    query += ` ORDER BY ${orderField} LIMIT ${limite}`;

    const { data, error } = await supabase.rpc('execute_sql', {
      query: query
    });

    if (error) throw error;

    return {
      success: true,
      data: {
        projetos: data,
        metrica_ordenacao: metrica,
        limite: limite
      },
      metadata: {
        total_records: data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar top projetos: ${error.message}`
    };
  }
}

// 6. Análise de Margem
async function getMargemAnalise(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  const codigoProjeto = params.get('projeto');
  
  try {
    if (codigoProjeto) {
      // Análise específica de um projeto
      const { data, error } = await supabase.rpc('calcular_margem_projeto', {
        p_codigo_projeto: codigoProjeto,
        p_ano: filters.ano || new Date().getFullYear(),
        p_mes: filters.mes || null
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          projeto: codigoProjeto,
          detalhes: data
        },
        metadata: {
          total_records: data?.length || 0
        }
      };
    } else {
      // Análise geral de margem
      let query = supabase
        .from('vw_dre_receita_custo_projeto')
        .select('codigo_projeto, nome_projeto, total_receita, total_custo, margem_bruta')
        .order('margem_bruta', { ascending: false });

      if (filters.ano) query = query.eq('ano', filters.ano);
      if (filters.mes) query = query.eq('mes', filters.mes);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data,
        metadata: {
          total_records: data?.length || 0
        }
      };
    }

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar análise de margem: ${error.message}`
    };
  }
}

// 7. Performance de Clientes
async function getClientePerformance(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  
  try {
    let query = supabase
      .from('vw_dre_por_cliente_natureza')
      .select('*')
      .order('total_valor', { ascending: false });

    if (filters.ano) query = query.eq('ano', filters.ano);
    if (filters.cliente) query = query.ilike('nome_cliente', `%${filters.cliente}%`);
    if (filters.natureza) query = query.eq('natureza', filters.natureza);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data,
      metadata: {
        total_records: data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar performance de clientes: ${error.message}`
    };
  }
}

// 8. Utilização de Recursos
async function getRecursosUtilizacao(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  
  try {
    let query = `
      SELECT 
        r.tipo_recurso,
        r.nome_recurso,
        COUNT(*) as total_alocacoes,
        SUM(f.valor_lancamento) as valor_total,
        COUNT(DISTINCT f.id_projeto) as projetos_distintos,
        AVG(f.valor_lancamento) as valor_medio
      FROM fact_dre_lancamentos f
      INNER JOIN dim_recurso r ON f.id_recurso = r.id_recurso
      INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
      WHERE f.ativo = TRUE AND r.ativo = TRUE
    `;

    const conditions = buildWhereConditions(filters, 'per');
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += ` GROUP BY r.tipo_recurso, r.nome_recurso`;
    query += ` ORDER BY valor_total DESC`;

    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
    }

    const { data, error } = await supabase.rpc('execute_sql', {
      query: query
    });

    if (error) throw error;

    return {
      success: true,
      data: data,
      metadata: {
        total_records: data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar utilização de recursos: ${error.message}`
    };
  }
}

// 9. Comparativo entre Períodos
async function getComparativoPeriodos(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const ano1 = parseInt(params.get('ano1') || String(new Date().getFullYear() - 1));
  const ano2 = parseInt(params.get('ano2') || String(new Date().getFullYear()));
  const mes = params.get('mes') ? parseInt(params.get('mes')!) : null;
  
  try {
    let query = `
      SELECT 
        per.ano,
        ${mes ? 'per.mes, per.nome_mes,' : ''}
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) as receita,
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as custo,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) - 
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) as margem,
        COUNT(DISTINCT f.id_projeto) as projetos_ativos
      FROM fact_dre_lancamentos f
      INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
      INNER JOIN dim_conta c ON f.id_conta = c.id_conta
      WHERE f.ativo = TRUE AND per.ano IN (${ano1}, ${ano2})
    `;

    if (mes) {
      query += ` AND per.mes = ${mes}`;
    }

    query += ` GROUP BY per.ano${mes ? ', per.mes, per.nome_mes' : ''}`;
    query += ` ORDER BY per.ano${mes ? ', per.mes' : ''}`;

    const { data, error } = await supabase.rpc('execute_sql', {
      query: query
    });

    if (error) throw error;

    return {
      success: true,
      data: {
        comparativo: data,
        periodos: { ano1, ano2, mes }
      },
      metadata: {
        total_records: data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar comparativo de períodos: ${error.message}`
    };
  }
}

// 10. Drill Down - Análise detalhada
async function getDrillDown(supabase: any, params: URLSearchParams): Promise<AnalyticsResponse> {
  const filters = parseFilters(params);
  const nivel = params.get('nivel') || 'projeto'; // projeto, conta, recurso
  
  try {
    let query = `
      SELECT 
        f.id_lancamento,
        p.codigo_projeto,
        p.nome_projeto,
        cl.nome_cliente,
        c.conta_resumo,
        c.denominacao_conta,
        c.natureza,
        r.nome_recurso,
        r.tipo_recurso,
        per.periodo_original,
        per.ano,
        per.mes,
        f.valor_lancamento,
        f.relatorio_origem,
        f.data_processamento
      FROM fact_dre_lancamentos f
      INNER JOIN dim_projeto p ON f.id_projeto = p.id_projeto
      INNER JOIN dim_cliente cl ON f.id_cliente = cl.id_cliente
      INNER JOIN dim_conta c ON f.id_conta = c.id_conta
      INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
      LEFT JOIN dim_recurso r ON f.id_recurso = r.id_recurso
      WHERE f.ativo = TRUE
    `;

    const conditions = buildWhereConditions(filters, 'per', 'p', 'cl', 'c', 'r');
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += ` ORDER BY f.data_processamento DESC`;

    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
    }
    if (filters.offset) {
      query += ` OFFSET ${filters.offset}`;
    }

    const { data, error } = await supabase.rpc('execute_sql', {
      query: query
    });

    if (error) throw error;

    return {
      success: true,
      data: {
        detalhes: data,
        nivel_analise: nivel,
        filtros_aplicados: filters
      },
      metadata: {
        total_records: data?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar drill down: ${error.message}`
    };
  }
}

// Funções auxiliares
function parseFilters(params: URLSearchParams): QueryFilters {
  return {
    ano: params.get('ano') ? parseInt(params.get('ano')!) : undefined,
    mes: params.get('mes') ? parseInt(params.get('mes')!) : undefined,
    trimestre: params.get('trimestre') ? parseInt(params.get('trimestre')!) : undefined,
    projeto: params.get('projeto') || undefined,
    cliente: params.get('cliente') || undefined,
    natureza: params.get('natureza') as 'RECEITA' | 'CUSTO' || undefined,
    tipo_negocio: params.get('tipo_negocio') as 'Mercado' | 'InterCompany' || undefined,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
    offset: params.get('offset') ? parseInt(params.get('offset')!) : undefined
  };
}

function buildWhereConditions(
  filters: QueryFilters, 
  periodoAlias = 'per', 
  projetoAlias = 'p', 
  clienteAlias = 'cl',
  contaAlias = 'c',
  recursoAlias = 'r'
): string[] {
  const conditions: string[] = [];

  if (filters.ano) {
    conditions.push(`${periodoAlias}.ano = ${filters.ano}`);
  }
  if (filters.mes) {
    conditions.push(`${periodoAlias}.mes = ${filters.mes}`);
  }
  if (filters.trimestre) {
    conditions.push(`${periodoAlias}.trimestre = ${filters.trimestre}`);
  }
  if (filters.projeto) {
    conditions.push(`${projetoAlias}.codigo_projeto ILIKE '%${filters.projeto}%'`);
  }
  if (filters.cliente) {
    conditions.push(`${clienteAlias}.nome_cliente ILIKE '%${filters.cliente}%'`);
  }
  if (filters.natureza) {
    conditions.push(`${contaAlias}.natureza = '${filters.natureza}'`);
  }
  if (filters.tipo_negocio) {
    conditions.push(`${projetoAlias}.tipo_negocio = '${filters.tipo_negocio}'`);
  }

  return conditions;
}