import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunction() {
  console.log('🚀 TESTANDO EDGE FUNCTION PROCESS-DRE-UPLOAD');
  console.log('==================================================');
  
  try {
    // Testar se a Edge Function está deployada
    console.log('🔍 Testando conectividade da Edge Function...');
    
    const testPayload = {
      record: {
        bucket_id: 'dre_reports',
        name: 'test-file.xlsx'
      }
    };
    
    const { data, error } = await supabase.functions.invoke('process-dre-upload', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error.message);
      console.error('📋 Detalhes:', error);
      return false;
    }
    
    console.log('✅ Edge Function respondeu com sucesso!');
    console.log('📊 Resposta:', data);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return false;
  }
}

async function testEdgeFunctionsList() {
  console.log('\n🔍 LISTANDO EDGE FUNCTIONS DISPONÍVEIS');
  console.log('==================================================');
  
  try {
    // Testar uma função simples para verificar se o serviço está funcionando
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { test: true }
    });
    
    if (error) {
      console.log('⚠️  Edge Functions podem não estar deployadas ou acessíveis');
      console.log('📋 Erro:', error.message);
    } else {
      console.log('✅ Serviço de Edge Functions está funcionando');
    }
    
  } catch (error) {
    console.log('⚠️  Erro ao testar Edge Functions:', error.message);
  }
}

async function checkSupabaseStatus() {
  console.log('\n🔍 VERIFICANDO STATUS DO SUPABASE');
  console.log('==================================================');
  
  try {
    // Testar conectividade básica
    const { data, error } = await supabase
      .from('automation_executions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro de conectividade:', error.message);
      return false;
    }
    
    console.log('✅ Conectividade com Supabase: OK');
    return true;
    
  } catch (error) {
    console.error('❌ Erro de conectividade:', error.message);
    return false;
  }
}

// Executar testes
async function runTests() {
  const startTime = Date.now();
  
  const connectivityOk = await checkSupabaseStatus();
  if (!connectivityOk) {
    console.log('❌ Falha na conectividade básica. Abortando testes.');
    return;
  }
  
  await testEdgeFunctionsList();
  const edgeFunctionOk = await testEdgeFunction();
  
  const executionTime = (Date.now() - startTime) / 1000;
  
  console.log('\n📊 RELATÓRIO FINAL');
  console.log('==================================================');
  console.log(`⏱️  Tempo de execução: ${executionTime.toFixed(2)}s`);
  console.log(`🔗 Conectividade: ${connectivityOk ? '✅ OK' : '❌ FALHA'}`);
  console.log(`⚡ Edge Function: ${edgeFunctionOk ? '✅ OK' : '❌ FALHA'}`);
  
  if (edgeFunctionOk) {
    console.log('\n🎉 Edge Function process-dre-upload está funcionando!');
  } else {
    console.log('\n⚠️  Edge Function process-dre-upload precisa ser deployada ou corrigida.');
    console.log('💡 Sugestões:');
    console.log('   1. Verificar se a função está deployada no Supabase Dashboard');
    console.log('   2. Verificar logs de erro no Supabase Dashboard > Edge Functions');
    console.log('   3. Redeploy da função se necessário');
  }
}

runTests().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});