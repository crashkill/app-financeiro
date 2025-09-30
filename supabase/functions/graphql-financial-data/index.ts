import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  type: 'dashboard' | 'planilhas' | 'forecast' | 'profissionais' | 'projetos' | 'anos';
  filters?: {
    projeto?: string;
    ano?: number;
    mes?: number;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, filters = {} } = await req.json() as RequestBody;

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
        query = supabaseClient
          .from(tableName)
          .select('projeto')
          .eq('ativo', true);
        break;

      case 'anos':
        tableName = 'dre_hitss';
        query = supabaseClient
          .from(tableName)
          .select('ano')
          .eq('ativo', true);
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

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro na consulta:', error);
      throw error;
    }

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
        const uniqueProjects = [...new Set(data?.map(item => item.projeto).filter(Boolean))] || [];
        transformedData = { projetos: uniqueProjects };
        break;

      case 'anos':
        const uniqueYears = [...new Set(data?.map(item => item.ano).filter(Boolean))].sort((a, b) => b - a) || [];
        transformedData = { anos: uniqueYears };
        break;

      default:
        transformedData = data || [];
    }

    const response = {
      success: true,
      type,
      data: transformedData,
      count: count || transformedData.length,
      filters
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erro na função graphql-financial-data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        type: 'error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});