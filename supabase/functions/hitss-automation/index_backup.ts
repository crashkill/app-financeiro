/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HITSSAutomationService } from './hitss-automation-service.ts';
import { HITSSConfig } from './types.ts';

// Configurações do Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função para obter credenciais do Vault
async function getHITSSCredentials() {
  try {
    const { data: secrets, error } = await supabase
      .from('vault.decrypted_secrets')
      .select('name, decrypted_secret')
      .in('name', ['hitss_username', 'hitss_password', 'hitss_base_url']);
    
    if (error) {
      console.error('Erro ao buscar credenciais do Vault:', error);
      throw new Error('Falha ao acessar credenciais do Vault');
    }
    
    const credentials: { [key: string]: string } = {};
    secrets?.forEach(secret => {
      credentials[secret.name] = secret.decrypted_secret;
    });
    
    if (!credentials.hitss_username || !credentials.hitss_password || !credentials.hitss_base_url) {
      throw new Error('Credenciais HITSS incompletas no Vault');
    }
    
    return {
      username: credentials.hitss_username,
      password: credentials.hitss_password,
      baseUrl: credentials.hitss_base_url
    };
  } catch (error) {
    console.error('Erro ao obter credenciais HITSS:', error);
    throw error;
  }
}

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
    
    // Obter credenciais do Vault
    const credentials = await getHITSSCredentials();
    console.log('🔑 Credenciais obtidas do Vault para:', credentials.username)
    
    // Configurar o serviço de automação
    const config: HITSSConfig = {
      username: credentials.username,
      password: credentials.password,
      baseUrl: credentials.baseUrl,
      loginUrl: `${credentials.baseUrl}/api/auth/login`,
      downloadUrl: 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls?clienteFiltro=&servicoFiltro=-1&tipoFiltro=-1&projetoFiltro=&projetoAtivoFiltro=true&projetoParalisadoFiltro=true&projetoEncerradoFiltro=true&projetoCanceladoFiltro=true&responsavelareaFiltro=&idResponsavelareaFiltro=&responsavelprojetoFiltro=FABRICIO%20CARDOSO%20DE%20LIMA&idresponsavelprojetoFiltro=78&filtroDeFiltro=09-2016&filtroAteFiltro=08-2025&visaoFiltro=PROJ&usuarioFiltro=fabricio.lima&idusuarioFiltro=78&perfilFiltro=RESPONSAVEL_DELIVERY%7CRESPONSAVEL_LANCAMENTO%7CVISITANTE&telaFiltro=painel_projetos',
      supabaseClient: supabase,
      executionId: execution.id,
      timeout: 300000 // 5 minutos
    };
    
    // Executar automação com download direto
    const automationService = new HITSSAutomationService(config);
    const result = await automationService.execute();
    
    if (!result.success) {
      throw new Error(result.error || 'Falha na automação HITSS');
    }
    
    console.log(`✅ Automação concluída com sucesso: ${result.recordsProcessed} registros processados`);
    
    // Atualizar status da execução
    await supabase
      .from('automation_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_processed: result.recordsProcessed,
        records_failed: result.recordsFailed || 0,
        error_message: null
      })
      .eq('id', execution.id);
    
    return createCorsResponse({
      success: true,
      message: 'Automação HITSS executada com sucesso',
      data: {
        executionId: execution.id,
        recordsProcessed: result.recordsProcessed,
        recordsFailed: result.recordsFailed || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na automação HITSS:', error)
    
    // Atualizar status da execução com erro
    try {
      await supabase
        .from('automation_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message || 'Erro desconhecido'
        })
        .eq('id', execution?.id);
    } catch (updateError) {
      console.error('❌ Erro ao atualizar status de falha:', updateError)
    }
    
    return createErrorResponse(error.message || 'Erro na automação HITSS', 500);
  }
});