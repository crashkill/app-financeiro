// Edge Function para criar dimensões de projeto a partir da dre_hitss
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Iniciando criação de dimensões de projeto...')

    // 1. Buscar projetos únicos da dre_hitss
    const { data: dreProjects, error: dreError } = await supabaseClient
      .from('dre_hitss')
      .select('projeto, codigo_projeto, cliente')
      .not('projeto', 'is', null)
      .order('projeto')

    if (dreError) {
      console.error('Erro ao buscar projetos da dre_hitss:', dreError)
      throw dreError
    }

    console.log(`📊 Encontrados ${dreProjects?.length || 0} registros na dre_hitss`)

    // 2. Criar mapa de projetos únicos
    const uniqueProjects = new Map()

    if (dreProjects) {
      dreProjects.forEach(row => {
        const projectKey = row.projeto || row.codigo_projeto || 'DESCONHECIDO'

        if (!uniqueProjects.has(projectKey)) {
          uniqueProjects.set(projectKey, {
            codigo: row.codigo_projeto || projectKey,
            nome: row.projeto || projectKey,
            cliente: row.cliente || null,
            descricao: `Projeto ${projectKey}`,
            status: 'Ativo',
            data_inicio: new Date().toISOString().split('T')[0],
            data_fim: null,
            orcamento: 0.00
          })
        }
      })
    }

    console.log(`📋 Projetos únicos identificados: ${uniqueProjects.size}`)

    // 3. Inserir projetos na dim_projeto
    const projectsToInsert = Array.from(uniqueProjects.values())
    const { data: insertedProjects, error: insertError } = await supabaseClient
      .from('dim_projeto')
      .upsert(projectsToInsert, {
        onConflict: 'codigo',
        ignoreDuplicates: true
      })
      .select()

    if (insertError) {
      console.error('Erro ao inserir projetos na dim_projeto:', insertError)
      throw insertError
    }

    console.log(`✅ ${insertedProjects?.length || 0} projetos inseridos/atualizados na dim_projeto`)

    // 4. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dimensões de projeto criadas com sucesso',
        data: {
          totalProjects: uniqueProjects.size,
          insertedProjects: insertedProjects?.length || 0,
          projects: insertedProjects
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erro na criação de dimensões de projeto:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
