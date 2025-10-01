/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configurações do Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Credenciais HITSS temporárias (para teste)
const HITSS_CREDENTIALS = {
  username: 'fabricio.lima',
  password: 'F4br1c10FSW@2025@',
  baseUrl: 'https://hitsscontrol.globalhitss.com.br'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando automação HITSS...')
    
    // Registrar execução
    const { data: execution, error: executionError } = await supabase
      .from('automation_executions')
      .insert({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (executionError) {
      console.error('❌ Erro ao registrar execução:', executionError)
      throw executionError
    }
    
    console.log('📝 Execução registrada:', execution.id)
    
    // Usar credenciais hardcoded
    console.log('🔑 Usando credenciais hardcoded para:', HITSS_CREDENTIALS.username)
    
    // Criar autenticação básica
    const authString = btoa(`${HITSS_CREDENTIALS.username}:${HITSS_CREDENTIALS.password}`);
    
    // Testar endpoint de exportação
    const exportUrl = `${HITSS_CREDENTIALS.baseUrl}/api/api/export/xls`;
    console.log('📥 Fazendo download do arquivo Excel...')
    
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro no download: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      console.log('✅ Arquivo Excel baixado com sucesso!');
      
      // Atualizar execução como concluída
      await supabase
        .from('automation_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_processed: 1
        })
        .eq('id', execution.id);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Automação executada com sucesso',
        execution_id: execution.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Resposta não é um arquivo Excel válido');
    }
    
  } catch (error) {
    console.error('❌ Erro na automação:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});