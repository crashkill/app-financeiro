import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Função auxiliar para resposta CORS
function corsResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Função para obter credenciais do Vault
async function getCredentialsFromVault(supabase: any) {
  console.log('🔐 Obtendo credenciais do Vault...')
  
  try {
    // Buscar todas as credenciais do Vault
    const { data: secrets, error } = await supabase
      .from('vault.decrypted_secrets')
      .select('name, decrypted_secret')
      .in('name', ['HITSS_USERNAME', 'HITSS_PASSWORD', 'HITSS_BASE_URL', 'HITSS_LINK_DOWNLOAD'])
    
    if (error) {
      console.error('Erro ao buscar segredos:', error)
      throw new Error(`Erro ao buscar credenciais: ${error.message}`)
    }
    
    if (!secrets || secrets.length === 0) {
      throw new Error('Nenhuma credencial encontrada no Vault')
    }
    
    // Organizar credenciais
    const credentials: any = {}
    secrets.forEach((secret: any) => {
      credentials[secret.name] = secret.decrypted_secret
    })

    // Verificar se todas as credenciais necessárias estão presentes
    const requiredKeys = ['HITSS_USERNAME', 'HITSS_PASSWORD', 'HITSS_BASE_URL', 'HITSS_LINK_DOWNLOAD']
    for (const key of requiredKeys) {
      if (!credentials[key]) {
        throw new Error(`Credencial ${key} não encontrada no Vault`)
      }
    }
    
    console.log(`✅ Credenciais obtidas para: ${credentials.username}`)
    return credentials
    
  } catch (error) {
    console.error('❌ Erro ao obter credenciais:', error)
    throw error
  }
}

// Função para registrar execução
async function registerExecution(supabase: any) {
  const { data, error } = await supabase
    .from('automation_executions')
    .insert({
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao registrar execução: ${error.message}`)
  return data
}

// Função para atualizar execução
async function updateExecution(supabase: any, executionId: string, updates: any) {
  const { error } = await supabase
    .from('automation_executions')
    .update(updates)
    .eq('id', executionId)

  if (error) throw new Error(`Erro ao atualizar execução: ${error.message}`)
}

// Função para processar HITSS com download real do Excel
async function processHITSS(credentials: any) {
  console.log('🤖 Iniciando processamento HITSS...')
  
  try {
    // Usar o link específico do Vault para download
    const downloadUrl = credentials.HITSS_LINK_DOWNLOAD
    
    console.log(`📥 Fazendo download do Excel de: ${downloadUrl}`)
    
    // Fazer requisição para download do Excel
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.HITSS_USERNAME}:${credentials.HITSS_PASSWORD}`)}`,
        'Accept': 'application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    console.log(`📊 Status da resposta: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro no download: ${response.status} - ${errorText}`)
    }
    
    // Verificar se é realmente um arquivo Excel
    const contentType = response.headers.get('content-type')
    console.log(`📋 Content-Type: ${contentType}`)
    
    if (!contentType || (!contentType.includes('excel') && !contentType.includes('spreadsheet') && !contentType.includes('application/octet-stream'))) {
      console.warn(`⚠️ Content-Type inesperado: ${contentType}`)
    }
    
    // Obter o arquivo como ArrayBuffer
    const fileBuffer = await response.arrayBuffer()
    const fileSize = fileBuffer.byteLength
    
    console.log(`📁 Arquivo baixado com sucesso! Tamanho: ${fileSize} bytes`)
    
    if (fileSize === 0) {
      throw new Error('Arquivo Excel está vazio')
    }
    
    // Aqui você pode processar o arquivo Excel se necessário
    // Por enquanto, vamos apenas retornar informações sobre o download
    
    return {
      success: true,
      message: 'Download do Excel HITSS concluído com sucesso',
      data: {
        fileSize: fileSize,
        contentType: contentType,
        downloadUrl: downloadUrl,
        timestamp: new Date().toISOString(),
        username: credentials.username
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no processamento HITSS:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando automação HITSS...')

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Registrar execução
    const execution = await registerExecution(supabase)
    console.log(`📝 Execução registrada: ${execution.id}`)

    // 2. Obter credenciais do Vault
    const credentials = await getCredentialsFromVault(supabase)
    console.log(`🔑 Credenciais obtidas para: ${credentials.username}`)

    // 3. Processar HITSS com download do Excel
    const result = await processHITSS(credentials)

    // 4. Atualizar execução com resultado
    await updateExecution(supabase, execution.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      records_processed: result.data?.fileSize || 0,
      records_failed: 0
    })

    console.log('✅ Automação HITSS concluída com sucesso!')

    return corsResponse({
      success: true,
      message: 'Automação HITSS executada com sucesso',
      executionId: execution.id,
      fileSize: result.data?.fileSize,
      contentType: result.data?.contentType,
      downloadUrl: result.data?.downloadUrl,
      username: result.data?.username,
      credentialsObtained: true
    })

  } catch (error) {
    console.error('❌ Erro na automação HITSS:', error)
    
    return corsResponse({
      success: false,
      error: 'Falha na automação HITSS',
      message: error.message
    }, 500)
  }
})