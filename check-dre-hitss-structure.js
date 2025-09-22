import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA dre_hitss');
  console.log('=' .repeat(60));
  
  try {
    // Método 1: Tentar consultar informações do schema
    console.log('\n📋 Método 1: Consultando information_schema...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'dre_hitss' })
      .select();
    
    if (schemaError) {
      console.log('❌ Erro ao consultar schema:', schemaError.message);
    } else {
      console.log('✅ Colunas encontradas:', columns);
    }
    
    // Método 2: Tentar uma consulta SQL direta
    console.log('\n📋 Método 2: Consulta SQL direta...');
    const { data: sqlResult, error: sqlError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'dre_hitss')
      .eq('table_schema', 'public');
    
    if (sqlError) {
      console.log('❌ Erro na consulta SQL:', sqlError.message);
    } else {
      console.log('✅ Estrutura da tabela:');
      if (sqlResult && sqlResult.length > 0) {
        sqlResult.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      } else {
        console.log('   ⚠️ Nenhuma coluna encontrada');
      }
    }
    
    // Método 3: Tentar SELECT * LIMIT 0 para descobrir colunas
    console.log('\n📋 Método 3: SELECT com LIMIT 0...');
    const { data: emptyResult, error: emptyError } = await supabase
      .from('dre_hitss')
      .select('*')
      .limit(0);
    
    if (emptyError) {
      console.log('❌ Erro no SELECT:', emptyError.message);
    } else {
      console.log('✅ Tabela acessível, estrutura descoberta via SELECT');
    }
    
    // Método 4: Tentar inserção com dados mínimos para descobrir campos obrigatórios
    console.log('\n📋 Método 4: Teste de inserção para descobrir campos...');
    const testData = {
      id: '00000000-0000-0000-0000-000000000001',
      upload_batch_id: 'test-batch-001',
      execution_id: 'test-exec-001'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('dre_hitss')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção de teste:', insertError.message);
      console.log('   Detalhes:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção de teste bem-sucedida:', insertResult);
      
      // Limpar o registro de teste
      await supabase.from('dre_hitss').delete().eq('id', testData.id);
      console.log('🧹 Registro de teste removido');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkTableStructure();