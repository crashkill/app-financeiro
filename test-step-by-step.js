import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 TESTE PASSO A PASSO DO FLUXO DRE');
console.log('=' .repeat(50));
console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
console.log('');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Verificando configurações...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseKey ? 'Configurada' : 'NÃO CONFIGURADA'}`);
console.log(`Service Key: ${supabaseServiceKey ? 'Configurada' : 'NÃO CONFIGURADA'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

console.log('🔗 Criando clientes Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase;
console.log('✅ Clientes criados');
console.log('');

// Função para executar cada etapa
async function executeStep(stepName, stepFunction) {
  console.log(`🔄 Executando: ${stepName}`);
  try {
    const result = await stepFunction();
    console.log(`✅ ${stepName} - Concluído`);
    if (result) {
      console.log(`   📊 Resultado:`, JSON.stringify(result, null, 2));
    }
    console.log('');
    return result;
  } catch (error) {
    console.error(`❌ ${stepName} - Erro: ${error.message}`);
    console.log('');
    return null;
  }
}

// ETAPA 1: Teste de Conectividade
async function step1_connectivity() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  return { bucketsCount: buckets.length, buckets: buckets.map(b => b.name) };
}

// ETAPA 2: Verificar Tabelas
async function step2_tables() {
  const tables = ['vault', 'dre_reports', 'dre_items', 'system_logs'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      results[table] = error ? `Erro: ${error.message}` : `OK (${count || 0} registros)`;
    } catch (err) {
      results[table] = `Erro: ${err.message}`;
    }
  }
  
  return results;
}

// ETAPA 3: Verificar Vault
async function step3_vault() {
  const { data: vaultData, error } = await supabase
    .from('vault')
    .select('key')
    .in('key', ['HITSS_USERNAME', 'HITSS_PASSWORD', 'RESEND_API_KEY']);
  
  if (error) throw error;
  
  const foundKeys = vaultData?.map(item => item.key) || [];
  return {
    totalKeys: foundKeys.length,
    keys: foundKeys
  };
}

// ETAPA 4: Criar Dados de Teste
async function step4_createTestData() {
  const testData = {
    reportDate: new Date().toISOString().split('T')[0],
    companyCode: 'TEST001',
    reportType: 'DRE_TESTE',
    executionId: `test_${Date.now()}`
  };
  
  return testData;
}

// ETAPA 5: Inserir Relatório de Teste
async function step5_insertReport(testData) {
  const reportData = {
    company_code: testData.companyCode,
    report_date: testData.reportDate,
    report_type: testData.reportType,
    status: 'test',
    metadata: { test: true, executionId: testData.executionId },
    execution_id: testData.executionId
  };
  
  const { data, error } = await supabase
    .from('dre_reports')
    .insert(reportData)
    .select()
    .single();
  
  if (error) throw error;
  
  return { reportId: data.id, companyCode: data.company_code };
}

// ETAPA 6: Inserir Itens de Teste
async function step6_insertItems(reportData) {
  const items = [
    {
      report_id: reportData.reportId,
      category: 'RECEITAS',
      subcategory: 'VENDAS',
      description: 'Receitas de Vendas - Teste',
      value: 100000
    },
    {
      report_id: reportData.reportId,
      category: 'CUSTOS',
      subcategory: 'MATERIAIS',
      description: 'Custos de Materiais - Teste',
      value: -50000
    }
  ];
  
  const { data, error } = await supabase
    .from('dre_items')
    .insert(items)
    .select();
  
  if (error) throw error;
  
  return { itemsCount: data.length };
}

// ETAPA 7: Verificar Edge Functions
async function step7_edgeFunctions() {
  const functions = ['hitss-automation', 'process-dre-upload'];
  const results = {};
  
  for (const functionName of functions) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true, ping: true }
      });
      
      results[functionName] = error ? `Erro: ${error.message}` : 'Respondeu';
    } catch (err) {
      results[functionName] = `Não acessível: ${err.message}`;
    }
  }
  
  return results;
}

// ETAPA 8: Verificar Bucket dre-files
async function step8_bucket() {
  // Verificar se bucket existe
  const { data: buckets } = await supabase.storage.listBuckets();
  const dreFilesExists = buckets.some(b => b.name === 'dre-files');
  
  if (!dreFilesExists) {
    // Tentar criar
    const { error: createError } = await supabaseAdmin.storage.createBucket('dre-files', {
      public: false
    });
    
    if (createError) {
      return { status: 'Não existe e não pôde ser criado', error: createError.message };
    } else {
      return { status: 'Criado com sucesso' };
    }
  }
  
  // Testar upload
  const testFileName = `test_${Date.now()}.json`;
  const testContent = JSON.stringify({ test: true, timestamp: new Date().toISOString() });
  
  const { data, error } = await supabase.storage
    .from('dre-files')
    .upload(testFileName, testContent, {
      contentType: 'application/json'
    });
  
  if (error) {
    return { status: 'Existe mas upload falhou', error: error.message };
  }
  
  return { status: 'OK - Upload realizado', fileName: testFileName, path: data.path };
}

// Função principal
async function main() {
  console.log('🎯 Iniciando teste passo a passo...');
  console.log('');
  
  // Executar todas as etapas
  const connectivity = await executeStep('1. Teste de Conectividade', step1_connectivity);
  const tables = await executeStep('2. Verificação de Tabelas', step2_tables);
  const vault = await executeStep('3. Verificação do Vault', step3_vault);
  const testData = await executeStep('4. Criação de Dados de Teste', step4_createTestData);
  
  if (testData) {
    const reportData = await executeStep('5. Inserção de Relatório de Teste', () => step5_insertReport(testData));
    
    if (reportData) {
      await executeStep('6. Inserção de Itens de Teste', () => step6_insertItems(reportData));
    }
  }
  
  const edgeFunctions = await executeStep('7. Verificação de Edge Functions', step7_edgeFunctions);
  const bucket = await executeStep('8. Verificação do Bucket dre-files', step8_bucket);
  
  // Resumo final
  console.log('📊 RESUMO FINAL');
  console.log('=' .repeat(30));
  console.log(`✅ Conectividade: ${connectivity ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Tabelas: ${tables ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Vault: ${vault ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Dados de Teste: ${testData ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Edge Functions: ${edgeFunctions ? 'VERIFICADAS' : 'FALHOU'}`);
  console.log(`✅ Bucket: ${bucket ? 'OK' : 'FALHOU'}`);
  
  console.log('');
  console.log('🏁 Teste passo a passo concluído!');
  console.log(`⏰ Finalizado em: ${new Date().toLocaleString('pt-BR')}`);
}

// Executar
main().catch(error => {
  console.error('💥 Erro fatal:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});