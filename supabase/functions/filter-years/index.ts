import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from "../_shared/cors.ts";
import { Logger } from "../_shared/logger.ts";

interface YearFilterRequest {
  search?: string;
  startYear?: number;
  endYear?: number;
  limit?: number;
  offset?: number;
}

interface YearFilterResponse {
  years: number[];
  total: number;
  hasMore: boolean;
}

serve(async (req: Request) => {
  const logger = new Logger();
  logger.setExecutionId(crypto.randomUUID());
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCors(req);
  }

  try {
    logger.info('Iniciando filtro de anos');

    // Verificar método HTTP
    if (req.method !== 'POST') {
      return createErrorResponse('Método não permitido', 405);
    }

    // Parse do body da requisição
    let requestData: YearFilterRequest = {};
    try {
      const body = await req.text();
      if (body) {
        requestData = JSON.parse(body);
      }
    } catch (error) {
      logger.warn('Erro ao fazer parse do body, usando valores padrão', { error });
    }

    const {
      search,
      startYear = 2020,
      endYear = new Date().getFullYear(),
      limit = 50,
      offset = 0
    } = requestData;

    logger.info('Parâmetros de filtro', { search, startYear, endYear, limit, offset });

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar anos únicos das transações
    let query = supabase
      .from('transacoes')
      .select('periodo')
      .not('periodo', 'is', null);

    // Aplicar filtro de busca se fornecido
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Buscar por ano específico ou parte do período
      query = query.or(`periodo.ilike.%${searchTerm}%`);
    }

    const { data: transacoes, error: transacoesError } = await query;

    if (transacoesError) {
      logger.error('Erro ao buscar transações', { error: transacoesError });
      return createErrorResponse('Erro ao buscar dados de transações', 500);
    }

    // Extrair anos únicos do campo periodo (formato MM/YYYY)
    const yearsSet = new Set<number>();
    
    if (transacoes && transacoes.length > 0) {
      transacoes.forEach(transacao => {
        if (transacao.periodo) {
          const [, anoStr] = transacao.periodo.split('/');
          const year = parseInt(anoStr, 10);
          if (!isNaN(year) && year >= startYear && year <= endYear) {
            yearsSet.add(year);
          }
        }
      });
    }

    // Converter para array e ordenar (mais recente primeiro)
    let years = Array.from(yearsSet).sort((a, b) => b - a);

    // Se não houver anos nos dados, gerar range padrão
    if (years.length === 0) {
      logger.info('Nenhum ano encontrado nos dados, gerando range padrão');
      for (let year = endYear; year >= startYear; year--) {
        years.push(year);
      }
    }

    // Aplicar paginação
    const total = years.length;
    const paginatedYears = years.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    const response: YearFilterResponse = {
      years: paginatedYears,
      total,
      hasMore
    };

    logger.info('Filtro de anos concluído', {
      totalYears: total,
      returnedYears: paginatedYears.length,
      hasMore
    });

    return createCorsResponse(response, 200);

  } catch (error) {
    logger.error('Erro inesperado no filtro de anos', { error });
    return createErrorResponse('Erro interno do servidor', 500);
  }
});