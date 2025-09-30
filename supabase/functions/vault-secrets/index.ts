import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VaultRequest {
  action: 'get' | 'list' | 'set' | 'update' | 'delete'
  secretName?: string
  secretValue?: string
  newSecretValue?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o usuário está autenticado
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse do corpo da requisição
    const { action, secretName, secretValue, newSecretValue }: VaultRequest = await req.json()

    let result
    let status = 200

    switch (action) {
      case 'get':
        if (!secretName) {
          return new Response(
            JSON.stringify({ error: 'Nome do segredo é obrigatório' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        const { data: secretData, error: getError } = await supabase.rpc('get_secret', {
          secret_name: secretName
        })
        
        if (getError) {
          return new Response(
            JSON.stringify({ error: `Erro ao recuperar segredo: ${getError.message}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        result = { secret: secretData }
        break

      case 'list':
        const { data: listData, error: listError } = await supabase.rpc('list_secrets')
        
        if (listError) {
          return new Response(
            JSON.stringify({ error: `Erro ao listar segredos: ${listError.message}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        result = { secrets: listData || [] }
        break

      case 'set':
        if (!secretName || !secretValue) {
          return new Response(
            JSON.stringify({ error: 'Nome e valor do segredo são obrigatórios' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        const { data: insertData, error: insertError } = await supabase.rpc('insert_secret', {
          secret_name: secretName,
          secret_value: secretValue
        })
        
        if (insertError) {
          return new Response(
            JSON.stringify({ error: `Erro ao inserir segredo: ${insertError.message}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        result = { id: insertData, message: 'Segredo criado com sucesso' }
        status = 201
        break

      case 'update':
        if (!secretName || !newSecretValue) {
          return new Response(
            JSON.stringify({ error: 'Nome do segredo e novo valor são obrigatórios' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        const { data: updateData, error: updateError } = await supabase.rpc('update_secret', {
          secret_name: secretName,
          new_secret_value: newSecretValue
        })
        
        if (updateError) {
          return new Response(
            JSON.stringify({ error: `Erro ao atualizar segredo: ${updateError.message}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        if (!updateData) {
          return new Response(
            JSON.stringify({ error: 'Segredo não encontrado' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        result = { message: 'Segredo atualizado com sucesso' }
        break

      case 'delete':
        if (!secretName) {
          return new Response(
            JSON.stringify({ error: 'Nome do segredo é obrigatório' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        const { data: deleteData, error: deleteError } = await supabase.rpc('delete_secret', {
          secret_name: secretName
        })
        
        if (deleteError) {
          return new Response(
            JSON.stringify({ error: `Erro ao deletar segredo: ${deleteError.message}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        if (!deleteData) {
          return new Response(
            JSON.stringify({ error: 'Segredo não encontrado' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        result = { message: 'Segredo deletado com sucesso' }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida. Use: get, list, set, update ou delete' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    return new Response(
      JSON.stringify(result),
      { 
        status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})