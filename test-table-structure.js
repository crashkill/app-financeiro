import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTableStructure() {
  console.log('🔍 TESTANDO ESTRUTURA DA TABELA dre_hitss');
  console.log('='.repeat(60));
  
  // Campos básicos mais comuns para testar
  const testFields = [
    { id: 'test1', execution_id: 'test_exec', account: 'TEST', description: 'Teste', value: 100.00, type: 'RECEITA' },
    { id: 'test2', execution_id: 'test_exec', account_code: 'TEST', account_name: 'Teste', amount: 100.00, category: 'RECEITA' },
    { id: 'test3', execution_id: 'test_exec', codigo: 'TEST', nome: 'Teste', valor: 100.00, tipo: 'RECEITA' },
    { id: 'test4', execution_id: 'test_exec', code: 'TEST', name: 'Teste', value: 100.00, type: 'RECEITA' }
  ];
  
  for (let i = 0; i < testFields.length; i++) {
    const testData = testFields[i];
    console.log(`\n🧪 Teste ${i + 1}: Tentando inserir com campos:`, Object.keys(testData));
    
    const { error } = await supabase
      .from('dre_hitss')
      .insert(testData);
    
    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      if (error.code === 'PGRST204') {
        console.log('📋 Campo não encontrado na tabela');
      }
    } else {
      console.log('✅ Inserção bem-sucedida! Estrutura encontrada:');
      console.log('Campos válidos:', Object.keys(testData));
      
      // Limpar o registro de teste
      await supabase
        .from('dre_hitss')
        .delete()
        .eq('id', testData.id);
      
      console.log('🗑️ Registro de teste removido');
      break;
    }
  }
  
  // Tentar descobrir estrutura fazendo select
  console.log('\n🔍 Tentando descobrir estrutura via SELECT...');
  const { data, error } = await supabase
    .from('dre_hitss')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Erro no SELECT:', error.message);
  } else {
    console.log('✅ SELECT bem-sucedido');
    if (data && data.length > 0) {
      console.log('📊 Colunas encontradas:', Object.keys(data[0]));
    } else {
      console.log('📭 Tabela vazia, mas SELECT funcionou');
    }
  }
  
  // Tentar inserção vazia para ver campos obrigatórios
  console.log('\n🧪 Testando inserção vazia para descobrir campos obrigatórios...');
  const { error: emptyError } = await supabase
    .from('dre_hitss')
    .insert({});
  
  if (emptyError) {
    console.log('📋 Erro de inserção vazia (mostra campos obrigatórios):');
    console.log(emptyError.message);
    console.log('Detalhes:', emptyError);
  }
}

// Executar teste
testTableStructure();