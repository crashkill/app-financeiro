#!/usr/bin/env node

/**
 * Script de Teste Simples do Fluxo DRE
 * Versão simplificada para debug
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

console.log('🚀 INICIANDO TESTE SIMPLES DO FLUXO DRE');
console.log('=' .repeat(50));

const supabase = createClient(supabaseUrl, supabaseKey);

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const testResults = {};

// 1. Teste de Conectividade
async function testConnectivity() {
  log('\n🔍 Testando Conectividade Supabase...', 'bold');
  
  try {
    const { data, error } = await supabase.from('dados_dre').select('count').limit(1);
    
    if (error) {
      log(`❌ Erro Supabase: ${error.message}`, 'red');
      testResults.connectivity = { status: 'error', details: error.message };
      return false;
    }
    
    log('✅ Conectividade Supabase: OK', 'green');
    testResults.connectivity = { status: 'success', details: 'Conexão estabelecida' };
    return true;
    
  } catch (error) {
    log(`❌ Erro de conectividade: ${error.message}`, 'red');
    testResults.connectivity = { status: 'error', details: error.message };
    return false;
  }
}

// 2. Teste de Tabelas DRE
async function testDreTables() {
  log('\n📊 Testando Tabelas DRE...', 'bold');
  
  try {
    // Verificar tabela dados_dre
    const { data: dreData, error: dreError } = await supabase
      .from('dados_dre')
      .select('*')
      .limit(5);
    
    if (dreError) {
      log(`❌ Erro tabela dados_dre: ${dreError.message}`, 'red');
      testResults.dreTables = { status: 'error', details: dreError.message };
      return false;
    }
    
    log(`✅ Tabela dados_dre: ${dreData?.length || 0} registros encontrados`, 'green');
    
    // Verificar tabela automation_executions
    const { data: execData, error: execError } = await supabase
      .from('automation_executions')
      .select('*')
      .limit(5);
    
    if (execError) {
      log(`⚠️  Tabela automation_executions: ${execError.message}`, 'yellow');
    } else {
      log(`✅ Tabela automation_executions: ${execData?.length || 0} registros`, 'green');
    }
    
    testResults.dreTables = { status: 'success', details: `${dreData?.length || 0} registros DRE` };
    return true;
    
  } catch (error) {
    log(`❌ Erro ao testar tabelas: ${error.message}`, 'red');
    testResults.dreTables = { status: 'error', details: error.message };
    return false;
  }
}

// 3. Teste de Storage
async function testStorage() {
  log('\n☁️ Testando Storage...', 'bold');
  
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      log(`❌ Erro ao listar buckets: ${bucketsError.message}`, 'red');
      testResults.storage = { status: 'error', details: bucketsError.message };
      return false;
    }
    
    const dreBucket = buckets?.find(bucket => bucket.name === 'dre-files');
    if (!dreBucket) {
      log('⚠️  Bucket dre-files não encontrado', 'yellow');
      log(`📋 Buckets disponíveis: ${buckets?.map(b => b.name).join(', ')}`, 'cyan');
      testResults.storage = { status: 'warning', details: 'Bucket dre-files não encontrado' };
      return false;
    }
    
    log('✅ Storage: Bucket dre-files encontrado', 'green');
    testResults.storage = { status: 'success', details: 'Bucket dre-files ativo' };
    return true;
    
  } catch (error) {
    log(`❌ Erro ao testar storage: ${error.message}`, 'red');
    testResults.storage = { status: 'error', details: error.message };
    return false;
  }
}

// 4. Teste de Edge Functions
async function testEdgeFunctions() {
  log('\n⚡ Testando Edge Functions...', 'bold');
  
  try {
    // Teste básico de ping para process-dre-upload
    const { data, error } = await supabase.functions.invoke('process-dre-upload', {
      body: { test: true, ping: true }
    });
    
    if (error) {
      log(`⚠️  Edge Function process-dre-upload: ${error.message}`, 'yellow');
      testResults.edgeFunctions = { status: 'warning', details: error.message };
    } else {
      log('✅ Edge Function process-dre-upload: Respondendo', 'green');
      testResults.edgeFunctions = { status: 'success', details: 'Function ativa' };
    }
    
    return true;
    
  } catch (error) {
    log(`⚠️  Edge Functions não testáveis: ${error.message}`, 'yellow');
    testResults.edgeFunctions = { status: 'warning', details: 'Não testável localmente' };
    return false;
  }
}

// 5. Teste de Logs HITSS
async function testHitssLogs() {
  log('\n📋 Testando Logs HITSS...', 'bold');
  
  try {
    const { data: hitssLogs, error: hitssError } = await supabase
      .from('hitss_automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (hitssError) {
      log(`⚠️  Tabela hitss_automation_logs: ${hitssError.message}`, 'yellow');
      testResults.hitssLogs = { status: 'warning', details: hitssError.message };
      return false;
    }
    
    log(`✅ Logs HITSS: ${hitssLogs?.length || 0} registros encontrados`, 'green');
    testResults.hitssLogs = { status: 'success', details: `${hitssLogs?.length || 0} logs` };
    return true;
    
  } catch (error) {
    log(`❌ Erro ao testar logs HITSS: ${error.message}`, 'red');
    testResults.hitssLogs = { status: 'error', details: error.message };
    return false;
  }
}

// Função para gerar relatório
function generateReport() {
  log('\n📊 RELATÓRIO FINAL', 'bold');
  log('=' .repeat(50), 'cyan');
  
  const totalTests = Object.keys(testResults).length;
  const successfulTests = Object.values(testResults).filter(result => result.status === 'success').length;
  const failedTests = Object.values(testResults).filter(result => result.status === 'error').length;
  const warningTests = Object.values(testResults).filter(result => result.status === 'warning').length;
  
  log(`\n📈 RESUMO:`);
  log(`   Total: ${totalTests}`);
  log(`   ✅ Sucessos: ${successfulTests}`, 'green');
  log(`   ❌ Falhas: ${failedTests}`, 'red');
  log(`   ⚠️  Avisos: ${warningTests}`, 'yellow');
  log(`   📊 Taxa de Sucesso: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
  
  log(`\n🔍 DETALHES:`);
  Object.entries(testResults).forEach(([testName, result]) => {
    const statusIcon = result.status === 'success' ? '✅' : 
                      result.status === 'error' ? '❌' : '⚠️';
    log(`   ${statusIcon} ${testName}: ${result.details}`);
  });
  
  // Salvar relatório
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      successful: successfulTests,
      failed: failedTests,
      warnings: warningTests,
      successRate: ((successfulTests / totalTests) * 100).toFixed(1)
    },
    results: testResults
  };
  
  const reportPath = path.join(__dirname, 'RELATORIO_TESTE_DRE_SIMPLES.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`\n💾 Relatório salvo: RELATORIO_TESTE_DRE_SIMPLES.json`, 'cyan');
  
  if (successfulTests === totalTests) {
    log(`\n🎉 Sistema funcionando perfeitamente!`, 'green');
  } else {
    log(`\n📈 Sistema ${((successfulTests / totalTests) * 100).toFixed(1)}% funcional`);
  }
  
  log('\n' + '=' .repeat(50), 'cyan');
}

// Função principal
async function runSimpleTest() {
  const startTime = Date.now();
  
  console.log(`\n🔧 Configuração:`);
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
  
  // Executar testes
  await testConnectivity();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testDreTables();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testStorage();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testEdgeFunctions();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testHitssLogs();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log(`\n⏱️  Tempo de execução: ${duration}s`, 'cyan');
  
  generateReport();
}

// Executar teste
runSimpleTest().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});