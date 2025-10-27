import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

function handleCors(req: Request): Response {
  return new Response('ok', { headers: corsHeaders })
}

function createCorsResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  )
}

function createErrorResponse(message: string, status: number = 500): Response {
  return createCorsResponse({
    success: false,
    error: {
      message
    }
  }, status)
}

// Simple authentication
async function authenticateUser(req: Request): Promise<any | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    // Se o token é a chave anônima, permite acesso sem autenticação
    if (token === anonKey) {
      console.log('Anonymous access with anon key')
      return null // Retorna null mas não é erro - acesso anônimo permitido
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      anonKey
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.log('User authentication failed, allowing anonymous access')
      return null
    }

    console.log('User authenticated:', user.email)
    return {
      id: user.id,
      email: user.email || ''
    }
  } catch (error) {
    console.error('Authentication error, allowing anonymous access:', error)
    return null
  }
}

interface Profissional {
  id?: string
  nome: string
  email: string
  telefone?: string
  departamento?: string
  cargo?: string
  salario?: number
  data_admissao?: string
  status?: string
  tipo_contrato?: string
  regime_trabalho?: string
  local_alocacao?: string
  proficiencia_cargo?: string
  disponivel_compartilhamento?: boolean
  percentual_compartilhamento?: string
  tecnologias?: any
  observacoes?: string
  projeto_atual?: string
  data_inicio_projeto?: string
  data_fim_projeto?: string
  valor_hora?: number
  valor_mensal?: number
  ativo?: boolean
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    console.log('Gestão de profissionais request received', {
      method: req.method,
      url: req.url
    })

    // Authenticate user (optional - permite acesso sem autenticação)
    const user = await authenticateUser(req)
    console.log('User authentication result:', user ? 'authenticated' : 'anonymous access')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    let action = pathSegments[pathSegments.length - 1] || 'list'

    if (action === 'gestao-profissionais') {
      action = 'list'
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(supabase, action, url, user)
      case 'POST':
        return await handlePost(supabase, req, user)
      case 'PUT':
        return await handlePut(supabase, req, action, user)
      case 'DELETE':
        const deleteBody = await req.json()
        const deleteId = deleteBody.id
        if (!deleteId) {
          return createErrorResponse('ID is required for deletion', 400)
        }
        return await handleDelete(supabase, deleteId.toString(), user)
      default:
        return createErrorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Error in gestao-profissionais', error)
    return createErrorResponse('Internal server error', 500)
  }
})

async function handleGet(supabase: any, action: string, url: URL, user: any) {
  try {
    const origem = url.searchParams.get('origem') || 'colaboradores';
    if (action === 'list') {
      if (origem === 'profissionais') {
        const { data, error } = await supabase
          .from('profissionais')
          .select('*')
          .or('ativo.is.null,ativo.eq.true') // Filtrar apenas profissionais ativos ou sem campo ativo definido
          .order('nome', { ascending: true })

        if (error) {
          console.error('Error listing professionals', error)
          return createErrorResponse('Error listing professionals', 500)
        }

        return createCorsResponse({ profissionais: data || [] })
      } else {
        // List all collaborators
        const { data, error } = await supabase
          .from('colaboradores')
          .select('*')
          .order('nome_completo', { ascending: true })

        if (error) {
          console.error('Error listing collaborators', error)
          return createErrorResponse('Error listing collaborators', 500)
        }

        // Map colaboradores data to match profissionais structure
        const mappedData = (data || []).map((colaborador: any) => ({
          id: colaborador.id,
          nome: colaborador.nome_completo,
          email: colaborador.email,
          telefone: null, // Not available in colaboradores
          departamento: colaborador.area_atuacao,
          cargo: colaborador.proficiencia_cargo,
          salario: null, // Not available in colaboradores
          data_admissao: null, // Not available in colaboradores
          status: 'Ativo', // Default status
          tipo_contrato: colaborador.regime,
          regime_trabalho: colaborador.regime,
          local_alocacao: colaborador.local_alocacao,
          proficiencia_cargo: colaborador.proficiencia_cargo,
          disponivel_compartilhamento: colaborador.disponivel_compartilhamento,
          percentual_compartilhamento: colaborador.percentual_compartilhamento,
          tecnologias: {
            java: colaborador.java,
            javascript: colaborador.javascript,
            python: colaborador.python,
            typescript: colaborador.typescript,
            php: colaborador.php,
            dotnet: colaborador.dotnet,
            react: colaborador.react,
            angular: colaborador.angular,
            ionic: colaborador.ionic,
            flutter: colaborador.flutter,
            mysql: colaborador.mysql,
            postgres: colaborador.postgres,
            oracle_db: colaborador.oracle_db,
            sql_server: colaborador.sql_server,
            mongodb: colaborador.mongodb,
            aws: colaborador.aws,
            azure: colaborador.azure,
            gcp: colaborador.gcp,
            android: colaborador.android,
            cobol: colaborador.cobol,
            linguagem_r: colaborador.linguagem_r,
            linguagem_c: colaborador.linguagem_c,
            linguagem_cpp: colaborador.linguagem_cpp,
            windows: colaborador.windows,
            raspberry_pi: colaborador.raspberry_pi,
            arduino: colaborador.arduino,
            outras_tecnologias: colaborador.outras_tecnologias
          },
          observacoes: null, // Not available in colaboradores
          projeto_atual: null, // Not available in colaboradores
          data_inicio_projeto: null, // Not available in colaboradores
          data_fim_projeto: null, // Not available in colaboradores
          valor_hora: null, // Not available in colaboradores
          valor_mensal: null, // Not available in colaboradores
          origem: 'colaboradores'
        }))

        return createCorsResponse({ profissionais: mappedData })
      }
    } else {
      if (origem === 'profissionais') {
        const { data, error } = await supabase
          .from('profissionais')
          .select('*')
          .eq('id', action)
          .or('ativo.is.null,ativo.eq.true') // Verificar se está ativo
          .single()

        if (error) {
          console.error('Error getting professional', error, action)
          return createErrorResponse('Professional not found', 404)
        }

        return createCorsResponse({ profissional: data })
      } else {
        // Get specific collaborator by ID
        const { data, error } = await supabase
          .from('colaboradores')
          .select('*')
          .eq('id', action)
          .single()

        if (error) {
          console.error('Error getting collaborator', error, action)
          return createErrorResponse('Collaborator not found', 404)
        }

        // Map single colaborador to profissional structure
        const mappedData = {
          id: data.id,
          nome: data.nome_completo,
          email: data.email,
          telefone: null,
          departamento: data.area_atuacao,
          cargo: data.proficiencia_cargo,
          salario: null,
          data_admissao: null,
          status: 'Ativo',
          tipo_contrato: data.regime,
          regime_trabalho: data.regime,
          local_alocacao: data.local_alocacao,
          proficiencia_cargo: data.proficiencia_cargo,
          disponivel_compartilhamento: data.disponivel_compartilhamento,
          percentual_compartilhamento: data.percentual_compartilhamento,
          tecnologias: {
            java: data.java,
            javascript: data.javascript,
            python: data.python,
            typescript: data.typescript,
            php: data.php,
            dotnet: data.dotnet,
            react: data.react,
            angular: data.angular,
            ionic: data.ionic,
            flutter: data.flutter,
            mysql: data.mysql,
            postgres: data.postgres,
            oracle_db: data.oracle_db,
            sql_server: data.sql_server,
            mongodb: data.mongodb,
            aws: data.aws,
            azure: data.azure,
            gcp: data.gcp,
            android: data.android,
            cobol: data.cobol,
            linguagem_r: data.linguagem_r,
            linguagem_c: data.linguagem_c,
            linguagem_cpp: data.linguagem_cpp,
            windows: data.windows,
            raspberry_pi: data.raspberry_pi,
            arduino: data.arduino,
            outras_tecnologias: data.outras_tecnologias
          },
          observacoes: null,
          projeto_atual: null,
          data_inicio_projeto: null,
          data_fim_projeto: null,
          valor_hora: null,
          valor_mensal: null,
          origem: 'colaboradores'
        }

        return createCorsResponse({ profissional: mappedData })
      }
    }
  } catch (error) {
    console.error('Error in handleGet', { error: (error as any).message })
    return createErrorResponse('Internal server error', 500)
  }
}

async function handlePost(supabase: any, req: Request, user: any) {
  try {
    const profissional: Profissional = await req.json()

    // Validate required fields
    if (!profissional.nome || !profissional.email) {
      return createErrorResponse('Nome and email are required', 400)
    }

    // Add user_id and timestamps
    const profissionalData = {
      ...profissional,
      usuario_id: user?.id,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profissionais')
      .insert([profissionalData])
      .select()
      .single()

    if (error) {
      console.error('Error creating professional', error, profissionalData)
      if (error.code === '23505') {
        return createErrorResponse('Email already exists', 409)
      }
      return createErrorResponse('Error creating professional', 500)
    }

    console.log('Professional created successfully', { id: data.id })
    return createCorsResponse({ profissional: data }, 201)

  } catch (error) {
    console.error('Error in handlePost', { error: error.message })
    return createErrorResponse('Invalid request body', 400)
  }
}

async function handlePut(supabase: any, req: Request, id: string, user: any) {
  try {
    const profissional: Profissional = await req.json()

    // Validate required fields
    if (!profissional.nome || !profissional.email) {
      return createErrorResponse('Nome and email are required', 400)
    }

    // Helper: converter UUID em ID numérico como no frontend
    const uuidToNumericId = (uuid: string): number => {
      return Math.abs(uuid.split('').reduce((a: number, b: string) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0))
    }

    // Resolver ID: aceitar numérico e procurar o UUID correspondente
    let resolvedId = id
    if (/^\d+$/.test(id)) {
      const { data: profissionaisList, error: listError } = await supabase
        .from('profissionais')
        .select('id')
        .limit(2000)

      if (listError) {
        console.error('Error listing professionals for ID resolution', listError)
        return createErrorResponse('Error resolving professional ID', 500)
      }

      const match = (profissionaisList || []).find((p: any) => uuidToNumericId(p.id) === Number(id))
      if (!match) {
        return createErrorResponse('Professional not found', 404)
      }
      resolvedId = match.id
    }

    // Add updated timestamp
    const profissionalData = {
      ...profissional,
      atualizado_em: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profissionais')
      .update(profissionalData)
      .eq('id', resolvedId)
      .select()
      .single()

    if (error) {
      console.error('Error updating professional', error, resolvedId, profissionalData)
      if ((error as any).code === '23505') {
        return createErrorResponse('Email already exists', 409)
      }
      return createErrorResponse('Error updating professional', 500)
    }

    if (!data) {
      return createErrorResponse('Professional not found', 404)
    }

    console.log('Professional updated successfully', { id: resolvedId })
    return createCorsResponse({ profissional: data })

  } catch (error) {
    console.error('Error in handlePut', { error: (error as any).message })
    return createErrorResponse('Invalid request body', 400)
  }
}

async function handleDelete(supabase: any, id: string, user: any) {
  try {
    console.log('handleDelete called with ID:', id)
    
    if (!id) {
      console.error('handleDelete: ID is required')
      return createErrorResponse('ID is required', 400)
    }

    // Helper: converter UUID em ID numérico como no frontend
    const uuidToNumericId = (uuid: string): number => {
      return Math.abs(uuid.split('').reduce((a: number, b: string) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0))
    }

    // Resolver ID: aceitar numérico e procurar o UUID correspondente
    let resolvedId = id
    if (/^\d+$/.test(id)) {
      console.log('Resolving numeric ID to UUID:', id)
      
      const { data: profissionaisList, error: listError } = await supabase
        .from('profissionais')
        .select('id')
        .limit(2000)

      if (listError) {
        console.error('Error listing professionals for ID resolution:', listError)
        return createErrorResponse('Error resolving professional ID', 500)
      }

      const match = (profissionaisList || []).find((p: any) => uuidToNumericId(p.id) === Number(id))
      if (!match) {
        console.error('Professional not found for numeric ID:', id)
        return createErrorResponse('Professional not found', 404)
      }
      resolvedId = match.id
      console.log('Resolved ID:', resolvedId)
    }

    // Exclusão lógica: marcar como inativo em vez de deletar fisicamente
    console.log('Performing logical deletion for ID:', resolvedId)
    
    const { data, error } = await supabase
      .from('profissionais')
      .update({ 
        ativo: false,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', resolvedId)
      .select()
      .single()

    if (error) {
      console.error('Error deactivating professional:', error, 'ID:', resolvedId)
      return createErrorResponse(`Error deleting professional: ${error.message}`, 500)
    }

    if (!data) {
      console.error('No data returned after update for ID:', resolvedId)
      return createErrorResponse('Professional not found', 404)
    }

    console.log('Professional deactivated successfully:', { id: resolvedId, nome: data.nome })
    return createCorsResponse({ 
      success: true,
      message: 'Professional deactivated successfully',
      data: { id: resolvedId }
    })

  } catch (error) {
    console.error('Error in handleDelete:', error)
    return createErrorResponse(`Error deleting professional: ${(error as any).message}`, 500)
  }
}