import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Headers CORS padrão para todas as Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 
    'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const handler = async (_req: Request): Promise<Response> => {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const allYears = new Set<number>();

    // Buscar anos da tabela dim_periodo
    const { data: dimPeriodos, error: dimError } = await supabase
      .from('dim_periodo')
      .select('ano')
      .order('ano', { ascending: false });

    if (dimError) {
      console.error('Error fetching from dim_periodo:', dimError);
    } else if (dimPeriodos) {
      dimPeriodos.forEach(p => {
        if (p.ano) allYears.add(p.ano);
      });
    }

    // Buscar anos da tabela dre_hitss
    const { data: dreHitss, error: dreError } = await supabase
      .from('dre_hitss')
      .select('periodo');

    if (dreError) {
      console.error('Error fetching from dre_hitss:', dreError);
    } else if (dreHitss) {
      dreHitss.forEach(d => {
        if (d.periodo) {
          const match = d.periodo.match(/\d{1,2}\/(\d{4})/);
          if (match && match[1]) {
            allYears.add(parseInt(match[1], 10));
          }
        }
      });
    }

    // Buscar anos da tabela fact_dre_lancamentos
    const { data: factLancamentos, error: factError } = await supabase
      .from('fact_dre_lancamentos')
      .select('ano');

    if (factError) {
      console.error('Error fetching from fact_dre_lancamentos:', factError);
    } else if (factLancamentos) {
      factLancamentos.forEach(f => {
        if (f.ano) allYears.add(f.ano);
      });
    }

    // Buscar anos da tabela transacoes_financeiras
    const { data: transacoes, error: transacoesError } = await supabase
      .from('transacoes_financeiras')
      .select('ano');

    if (transacoesError) {
      console.error('Error fetching from transacoes_financeiras:', transacoesError);
    } else if (transacoes) {
      transacoes.forEach(t => {
        if (t.ano) allYears.add(t.ano);
      });
    }

    let years = Array.from(allYears).sort((a, b) => b - a); // Ordenar decrescente

    // Fallback para anos padrão se nenhum for encontrado
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      years = [currentYear, currentYear - 1, currentYear - 2];
    }

    return new Response(JSON.stringify(years), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

// Manipulador para requisições OPTIONS (preflight CORS)
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  return await handler(req);
});