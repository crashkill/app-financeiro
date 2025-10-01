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

async function discoverTableFields() {
  console.log('🔍 DESCOBRINDO CAMPOS DA TABELA dre_hitss');
  console.log('='.repeat(60));
  
  // Baseado no erro, sabemos que upload_batch_id é obrigatório
  // Vamos tentar com campos básicos + upload_batch_id
  const testData = {
    upload_batch_id: 'test_batch_123',
    execution_id: 'test_exec_123'
  };
  
  console.log('🧪 Testando inserção com campos mínimos:');
  console.log('Dados:', testData);
  
  const { data, error } = await supabase
    .from('dre_hitss')
    .insert(testData)
    .select();
  
  if (error) {
    console.log('❌ Erro:', error.message);
    console.log('📋 Detalhes:', error);
    
    // Se ainda há erro, vamos tentar descobrir mais campos
    if (error.code === '23502') {
      console.log('\n🔍 Há mais campos obrigatórios. Analisando erro...');
      const errorDetails = error.details || '';
      console.log('Detalhes do erro:', errorDetails);
    }
  } else {
    console.log('✅ Inserção bem-sucedida!');
    console.log('📊 Dados inseridos:', data);
    
    if (data && data.length > 0) {
      console.log('\n📋 ESTRUTURA DA TABELA DESCOBERTA:');
      console.log('Campos disponíveis:', Object.keys(data[0]));
      
      // Limpar o registro de teste
      const { error: deleteError } = await supabase
        .from('dre_hitss')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.log('⚠️ Erro ao limpar registro de teste:', deleteError.message);
      } else {
        console.log('🗑️ Registro de teste removido');
      }
    }
  }
  
  // Tentar também com mais campos baseados no padrão DRE
  console.log('\n🧪 Testando com campos DRE típicos...');
  const dreTestData = {
    upload_batch_id: 'test_batch_456',
    execution_id: 'test_exec_456',
    account_code: '1.01.001',
    account_name: 'Receita de Vendas',
    amount: 1000.00,
    account_type: 'RECEITA',
    period: '2024-01',
    company_name: 'HITSS LTDA'
  };
  
  const { data: dreData, error: dreError } = await supabase
    .from('dre_hitss')
    .insert(dreTestData)
    .select();
  
  if (dreError) {
    console.log('❌ Erro com campos DRE:', dreError.message);
    
    // Tentar campos em português
    console.log('\n🧪 Testando com campos em português...');
    const ptTestData = {
      upload_batch_id: 'test_batch_789',
      execution_id: 'test_exec_789',
      codigo_conta: '1.01.001',
      nome_conta: 'Receita de Vendas',
      valor: 1000.00,
      tipo_conta: 'RECEITA',
      periodo: '2024-01',
      empresa: 'HITSS LTDA'
    };
    
    const { data: ptData, error: ptError } = await supabase
      .from('dre_hitss')
      .insert(ptTestData)
      .select();
    
    if (ptError) {
      console.log('❌ Erro com campos em português:', ptError.message);
    } else {
      console.log('✅ Sucesso com campos em português!');
      console.log('📊 Estrutura encontrada:', Object.keys(ptData[0]));
      
      // Limpar
      await supabase.from('dre_hitss').delete().eq('id', ptData[0].id);
      console.log('🗑️ Registro de teste removido');
    }
  } else {
    console.log('✅ Sucesso com campos DRE!');
    console.log('📊 Estrutura encontrada:', Object.keys(dreData[0]));
    
    // Limpar
    await supabase.from('dre_hitss').delete().eq('id', dreData[0].id);
    console.log('🗑️ Registro de teste removido');
  }
}

// Executar descoberta
discoverTableFields();