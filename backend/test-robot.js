#!/usr/bin/env node
/**
 * Script de teste para o robô HITSS
 * Testa tanto a execução direta quanto via API
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function testDirectRobot() {
  console.log('🧪 Testando execução direta do robô...');
  
  try {
    const HITSSRobot = require('./hitss-robot');
    const robot = new HITSSRobot();
    
    const result = await robot.run();
    
    console.log('✅ Teste direto concluído:');
    console.log(JSON.stringify(result, null, 2));
    
    return result.success;
    
  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
    return false;
  }
}

async function testApiEndpoint() {
  console.log('🧪 Testando endpoint da API...');
  
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const apiKey = process.env.BACKEND_API_KEY || 'hitss-robot-key';
  
  try {
    // Teste de health check
    console.log('📡 Testando health check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check falhou: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Health check OK:', healthData);
    
    // Teste de execução do robô
    console.log('🤖 Testando execução via API...');
    const robotResponse = await fetch(`${baseUrl}/api/hitss-robot/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        trigger: 'test',
        timestamp: new Date().toISOString()
      })
    });
    
    if (!robotResponse.ok) {
      const errorText = await robotResponse.text();
      throw new Error(`API falhou: ${robotResponse.status} - ${errorText}`);
    }
    
    const robotData = await robotResponse.json();
    console.log('✅ Teste da API concluído:');
    console.log(JSON.stringify(robotData, null, 2));
    
    return robotData.success;
    
  } catch (error) {
    console.error('❌ Erro no teste da API:', error);
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('🧪 Testando conexão com Supabase...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste de conexão
    const { data, error } = await supabase
      .from('hitss_data')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Conexão com Supabase OK');
    console.log(`📊 Registros na tabela hitss_data: ${data?.length || 0}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando testes do robô HITSS...');
  console.log('=' .repeat(50));
  
  const results = {
    supabase: false,
    direct: false,
    api: false
  };
  
  // Teste 1: Conexão com Supabase
  results.supabase = await testSupabaseConnection();
  console.log('');
  
  // Teste 2: Execução direta (apenas se Supabase OK)
  if (results.supabase) {
    results.direct = await testDirectRobot();
  } else {
    console.log('⏭️ Pulando teste direto (Supabase não conectado)');
  }
  console.log('');
  
  // Teste 3: API endpoint (apenas se direto OK)
  if (results.direct) {
    results.api = await testApiEndpoint();
  } else {
    console.log('⏭️ Pulando teste da API (execução direta falhou)');
  }
  
  // Resultado final
  console.log('');
  console.log('=' .repeat(50));
  console.log('RESULTADO DOS TESTES:');
  console.log(`🔗 Supabase: ${results.supabase ? '✅' : '❌'}`);
  console.log(`🤖 Robô Direto: ${results.direct ? '✅' : '❌'}`);
  console.log(`📡 API Endpoint: ${results.api ? '✅' : '❌'}`);
  console.log('=' .repeat(50));
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('🎉 Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('💥 Alguns testes falharam!');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = {
  testDirectRobot,
  testApiEndpoint,
  testSupabaseConnection
};