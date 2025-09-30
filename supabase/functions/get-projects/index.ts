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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: dimProjetos, error: dimError } = await supabase
      .from('dim_projeto')
      .select('codigo_projeto, nome')
      .order('nome');

    const { data: dreProjetos, error: dreError } = await supabase
      .from('dre_hitss')
      .select('projeto')
      .not('projeto', 'is', null)
      .order('projeto');

    if (dimError) throw dimError;
    if (dreError) throw dreError;

    const allProjects = new Set<string>();

    if (dimProjetos) {
      dimProjetos.forEach(p => {
        if (p.codigo_projeto) allProjects.add(p.codigo_projeto);
        if (p.nome) allProjects.add(p.nome);
      });
    }

    if (dreProjetos) {
      dreProjetos.forEach(p => {
        if (p.projeto) allProjects.add(p.projeto);
      });
    }

    const uniqueProjects = Array.from(allProjects).sort();

    return new Response(JSON.stringify(uniqueProjects), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});