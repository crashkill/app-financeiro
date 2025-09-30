const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableConstraints() {
  console.log('🔍 Verificando constraints da tabela automation_executions...');
  
  try {
    // Verificar a estrutura da tabela
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'automation_executions' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.log('❌ Erro ao consultar estrutura:', error);
    } else {
      console.log('📋 Estrutura da tabela:');
      console.table(data);
    }
    
    // Verificar constraints
    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname as constraint_name,
          consrc as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'automation_executions'::regclass
        AND contype = 'c';
      `
    });
    
    if (constraintError) {
      console.log('❌ Erro ao consultar constraints:', constraintError);
    } else {
      console.log('\n🔒 Constraints da tabela:');
      console.table(constraints);
    }
    
    // Testar valores válidos para status
    const statusValues = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    
    console.log('\n🧪 Testando valores de status válidos...');
    
    for (const status of statusValues) {
      try {
        const { data: testData, error: testError } = await supabase
          .from('automation_executions')
          .insert({
            status: status,
            started_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (testError) {
          console.log(`❌ Status '${status}': ${testError.message}`);
        } else {
          console.log(`✅ Status '${status}': OK`);
          
          // Limpar o teste
          await supabase
            .from('automation_executions')
            .delete()
            .eq('id', testData.id);
        }
      } catch (e) {
        console.log(`❌ Status '${status}': ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableConstraints();