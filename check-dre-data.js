const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkDreData() {
  console.log('🔍 Verificando dados na tabela dre_hitss...');
  
  try {
    // Contar total de registros
    const { count, error: countError } = await supabase
      .from('dre_hitss')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }
    
    console.log(`📊 Total de registros na tabela dre_hitss: ${count}`);
    
    if (count > 0) {
      // Buscar os últimos 3 registros
      const { data, error } = await supabase
        .from('dre_hitss')
        .select('id, descricao, valor, data, tipo, natureza, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) {
        console.error('❌ Erro ao buscar registros:', error);
        return;
      }
      
      console.log('\n📋 Últimos 3 registros inseridos:');
      data.forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`);
        console.log(`   Descrição: ${record.descricao}`);
        console.log(`   Valor: R$ ${record.valor}`);
        console.log(`   Data: ${record.data}`);
        console.log(`   Tipo: ${record.tipo}`);
        console.log(`   Natureza: ${record.natureza}`);
        console.log(`   Criado em: ${record.created_at}`);
      });
    } else {
      console.log('⚠️ Nenhum registro encontrado na tabela dre_hitss');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkDreData();