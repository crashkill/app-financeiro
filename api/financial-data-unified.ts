import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos de requisição suportados
type RequestType = 'dashboard' | 'planilhas' | 'forecast' | 'profissionais' | 'projetos' | 'anos';

// Interface para o corpo da requisição
interface RequestBody {
  type: RequestType;
  filters?: {
    projeto?: string;
    ano?: number;
    mes?: number;
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Configuração de CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder a requisições OPTIONS (preflight CORS)
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    console.log("Inicializando processamento da requisição...");
    
    // Extrair dados da requisição
    const { type, filters = {} } = request.body as RequestBody;
    console.log(`Processando requisição do tipo: ${type}`, filters);

    if (!type) {
      return response.status(400).json({
        success: false,
        error: 'Tipo de requisição não especificado'
      });
    }

    let query;
    let tableName: string;

    // Configurar a consulta com base no tipo
    switch (type) {
      case 'dashboard':
        tableName = 'dre_hitss';
        query = supabase
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'planilhas':
        tableName = 'dre_hitss';
        query = supabase
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'forecast':
        tableName = 'dre_hitss';
        query = supabase
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'profissionais':
        tableName = 'dre_hitss';
        query = supabase
          .from(tableName)
          .select('*')
          .eq('ativo', true);
        break;

      case 'projetos':
        tableName = 'dre_hitss';
        console.log('Iniciando query para projetos...');
        query = supabase
          .from(tableName)
          .select('projeto')
          .eq('ativo', true)
          .order('projeto');
        console.log('Query para projetos configurada');
        break;

      case 'anos':
        tableName = 'dre_hitss';
        query = supabase
          .from(tableName)
          .select('ano')
          .eq('ativo', true)
          .order('ano');
        break;

      default:
        return response.status(400).json({
          success: false,
          error: `Tipo de dados não suportado: ${type}`
        });
    }

    // Aplicar filtros
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
    const { data, error, count } = await query;

    if (error) {
      console.error("Erro na query do Supabase:", error);
      throw error;
    }

    console.log(`Query executada com sucesso. ${data?.length || 0} registros encontrados.`);

    // Transformar dados com base no tipo
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
        const allProjects = data?.map(item => item.projeto).filter(Boolean) || [];
        const uniqueProjects = [...new Set(allProjects)] || [];
        console.log(`Projetos únicos encontrados: ${uniqueProjects.length}`);
        transformedData = uniqueProjects;
        break;

      case 'anos':
        const allYears = data?.map(item => item.ano).filter(Boolean) || [];
        const uniqueYears = [...new Set(allYears)].sort((a, b) => b - a) || [];
        console.log(`Anos únicos encontrados: ${uniqueYears.length}`);
        transformedData = uniqueYears;
        break;

      default:
        transformedData = data || [];
    }

    // Preparar resposta
    return response.status(200).json({
      success: true,
      type,
      data: transformedData,
      count: count || (Array.isArray(transformedData) ? transformedData.length : 1),
      filters
    });

  } catch (error) {
    console.error("Erro inesperado:", error);
    
    return response.status(500).json({
      success: false,
      error: error.message,
      type: 'error'
    });
  }
}