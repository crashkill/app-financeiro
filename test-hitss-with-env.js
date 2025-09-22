const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config();

// Desabilitar verificação SSL
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Credenciais HITSS (temporárias para teste)
const HITSS_CREDENTIALS = {
  username: 'fabricio.lima',
  password: 'F4br1c10FSW@2025@',
  baseUrl: 'https://hitsscontrol.globalhitss.com.br'
};

async function testHITSSConnection() {
  try {
    console.log('🔗 Testando conexão com HITSS...');
    console.log(`📍 URL: ${HITSS_CREDENTIALS.baseUrl}`);
    console.log(`👤 Usuário: ${HITSS_CREDENTIALS.username}`);
    
    // Criar autenticação básica
    const authString = Buffer.from(`${HITSS_CREDENTIALS.username}:${HITSS_CREDENTIALS.password}`).toString('base64');
    console.log(`🔐 Auth string criada: ${authString.substring(0, 10)}...`);
    
    // Testar diferentes endpoints
    const endpoints = [
      '/',
      '/api',
      '/api/export',
      '/api/export/xls',
      '/api/api/export/xls'
    ];
    
    for (const endpoint of endpoints) {
      const testUrl = `${HITSS_CREDENTIALS.baseUrl}${endpoint}`;
      console.log(`\n🌐 Testando endpoint: ${testUrl}`);
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*'
          },
          agent: new https.Agent({
            rejectUnauthorized: false
          })
        });
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 200) {
          const contentType = response.headers.get('content-type');
          console.log(`📋 Content-Type: ${contentType}`);
          
          if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
            console.log('✅ Endpoint de Excel encontrado!');
            return { success: true, endpoint: testUrl };
          } else {
            const responseText = await response.text();
            console.log(`📄 Resposta (primeiros 200 chars): ${responseText.substring(0, 200)}`);
          }
        } else if (response.status === 401) {
          console.log('🔐 Erro de autenticação - credenciais podem estar incorretas');
        } else if (response.status === 404) {
          console.log('❌ Endpoint não encontrado');
        } else {
          console.log(`⚠️ Status inesperado: ${response.status}`);
        }
        
      } catch (error) {
        console.log(`❌ Erro na requisição: ${error.message}`);
      }
    }
    
    return { success: false };
    
  } catch (error) {
    console.error('💥 Erro ao testar conexão HITSS:', error.message);
    return { success: false };
  }
}

async function updateEdgeFunctionWithCredentials() {
  try {
    console.log('\n🔧 Atualizando Edge Function com credenciais hardcoded...');
    
    // Ler o arquivo atual da Edge Function
    const fs = require('fs');
    const path = require('path');
    
    const edgeFunctionPath = path.join(__dirname, 'supabase', 'functions', 'hitss-automation', 'index.ts');
    
    if (!fs.existsSync(edgeFunctionPath)) {
      console.log('❌ Arquivo da Edge Function não encontrado');
      return;
    }
    
    // Criar versão temporária com credenciais hardcoded
    const tempEdgeFunctionContent = `/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configurações do Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Credenciais HITSS temporárias (para teste)
const HITSS_CREDENTIALS = {
  username: '${HITSS_CREDENTIALS.username}',
  password: '${HITSS_CREDENTIALS.password}',
  baseUrl: '${HITSS_CREDENTIALS.baseUrl}'
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
    const authString = btoa(\`\${HITSS_CREDENTIALS.username}:\${HITSS_CREDENTIALS.password}\`);
    
    // Testar endpoint de exportação
    const exportUrl = \`\${HITSS_CREDENTIALS.baseUrl}/api/api/export/xls\`;
    console.log('📥 Fazendo download do arquivo Excel...')
    
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'Authorization': \`Basic \${authString}\`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(\`Erro no download: \${response.status} \${response.statusText}\`);
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
});`;
    
    // Salvar versão temporária
    const tempPath = path.join(__dirname, 'supabase', 'functions', 'hitss-automation', 'index_temp.ts');
    fs.writeFileSync(tempPath, tempEdgeFunctionContent);
    
    console.log('✅ Edge Function temporária criada com credenciais hardcoded');
    console.log(`📁 Arquivo salvo em: ${tempPath}`);
    
  } catch (error) {
    console.error('💥 Erro ao atualizar Edge Function:', error.message);
  }
}

async function main() {
  const connectionResult = await testHITSSConnection();
  
  if (connectionResult.success) {
    console.log('\n🎉 Conexão HITSS bem-sucedida!');
    await updateEdgeFunctionWithCredentials();
  } else {
    console.log('\n⚠️ Conexão HITSS falhou, mas continuando com a configuração...');
    await updateEdgeFunctionWithCredentials();
  }
  
  console.log('\n🎯 Teste concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Testar a Edge Function com: npx supabase functions serve');
  console.log('2. Fazer uma requisição de teste para a função');
  console.log('3. Se funcionar, atualizar o Cron Job');
}

main();