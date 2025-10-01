const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAutomationTable() {
  console.log('🧪 Testando tabela automation_executions...');
  
  try {
    // Verificar se a tabela existe tentando fazer uma consulta
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar tabela automation_executions:', error);
      
      // Tentar criar a tabela se não existir
      console.log('🔧 Tentando criar a tabela...');
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS automation_executions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          status TEXT NOT NULL DEFAULT 'pending',
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          records_processed INTEGER DEFAULT 0,
          records_failed INTEGER DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableQuery 
      });
      
      if (createError) {
        console.log('❌ Erro ao criar tabela:', createError);
      } else {
        console.log('✅ Tabela criada com sucesso');
      }
      
    } else {
      console.log('✅ Tabela automation_executions existe');
      console.log('📊 Dados encontrados:', data);
    }
    
    // Testar inserção
    console.log('\n🧪 Testando inserção...');
    const { data: insertData, error: insertError } = await supabase
      .from('automation_executions')
      .insert({
        status: 'test',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Erro ao inserir:', insertError);
    } else {
      console.log('✅ Inserção bem-sucedida:', insertData);
      
      // Limpar o teste
      await supabase
        .from('automation_executions')
        .delete()
        .eq('id', insertData.id);
      
      console.log('🧹 Registro de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAutomationTable();