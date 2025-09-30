const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Dados de teste para o DRE
const testData = {
  fileUrl: 'https://example.com/relatorio_dre_202509.xlsx',
  fileName: 'relatorio_dre_202509.xlsx',
  batchId: `batch_${Date.now()}`,
  data: [
    {
      anomes: '202509',
      projeto: 'PROJ001',
      cliente: 'Cliente A',
      conta: '4.1.1.001',
      recurso: 'REC001',
      filial: 'SP',
      valor: 15000.50,
      tipo: 'receita'
    },
    {
      anomes: '202509',
      projeto: 'PROJ002',
      cliente: 'Cliente B',
      conta: '3.1.1.001',
      recurso: 'REC002',
      filial: 'RJ',
      valor: 8500.75,
      tipo: 'despesa'
    },
    {
      anomes: '202509',
      projeto: 'PROJ001',
      cliente: 'Cliente A',
      conta: '4.1.2.001',
      recurso: 'REC003',
      filial: 'SP',
      valor: 12000.00,
      tipo: 'receita'
    }
  ]
};

async function testSupabaseDirectly() {
  console.log('🚀 Iniciando teste direto no Supabase...');
  console.log('📊 Dados de teste:', JSON.stringify(testData, null, 2));
  
  try {
    // Testar Edge Function dre-etl-dimensional
    console.log('\n📡 Chamando Edge Function dre-etl-dimensional...');
    
    const { data, error } = await supabase.functions.invoke('dre-etl-dimensional', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      return;
    }
    
    console.log('✅ Edge Function executada com sucesso!');
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    
    // Verificar se os dados foram inseridos nas tabelas
    console.log('\n🔍 Verificando dados inseridos...');
    
    // Verificar tabela fato_dre
    const { data: fatoData, error: fatoError } = await supabase
      .from('fato_dre')
      .select('*')
      .eq('batch_id', testData.batchId)
      .limit(10);
    
    if (fatoError) {
      console.error('❌ Erro ao consultar fato_dre:', fatoError);
    } else {
      console.log(`✅ Registros na fato_dre: ${fatoData?.length || 0}`);
      if (fatoData && fatoData.length > 0) {
        console.log('📊 Primeiro registro:', JSON.stringify(fatoData[0], null, 2));
      }
    }
    
    // Verificar dimensões
    const dimensoes = ['dim_recurso', 'dim_projeto', 'dim_cliente', 'dim_conta'];
    
    for (const dim of dimensoes) {
      const { data: dimData, error: dimError } = await supabase
        .from(dim)
        .select('*')
        .limit(5);
      
      if (dimError) {
        console.error(`❌ Erro ao consultar ${dim}:`, dimError);
      } else {
        console.log(`✅ Registros em ${dim}: ${dimData?.length || 0}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Função para testar conectividade básica
async function testConnectivity() {
  console.log('🔗 Testando conectividade básica...');
  
  try {
    // Testar uma consulta simples
    const { data, error } = await supabase
      .from('dim_recurso')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro de conectividade:', error);
      return false;
    }
    
    console.log('✅ Conectividade OK');
    return true;
  } catch (error) {
    console.error('❌ Erro de conectividade:', error);
    return false;
  }
}

// Função para limpar dados de teste
async function cleanupTestData() {
  console.log('🧹 Limpando dados de teste...');
  
  try {
    const { error } = await supabase
      .from('fato_dre')
      .delete()
      .eq('batch_id', testData.batchId);
    
    if (error) {
      console.error('❌ Erro ao limpar dados:', error);
    } else {
      console.log('✅ Dados de teste removidos');
    }
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
}

// Executar teste completo
async function runCompleteTest() {
  console.log('🎯 === TESTE DIRETO NO SUPABASE ===\n');
  
  // 1. Testar conectividade
  const isConnected = await testConnectivity();
  if (!isConnected) {
    console.log('❌ Falha na conectividade. Abortando teste.');
    return;
  }
  
  // 2. Executar teste principal
  await testSupabaseDirectly();
  
  // 3. Aguardar um pouco antes da limpeza
  console.log('\n⏳ Aguardando 3 segundos antes da limpeza...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 4. Limpar dados de teste
  await cleanupTestData();
  
  console.log('\n🎉 Teste completo finalizado!');
}

// Executar se chamado diretamente
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = {
  testSupabaseDirectly,
  testConnectivity,
  cleanupTestData,
  runCompleteTest
};