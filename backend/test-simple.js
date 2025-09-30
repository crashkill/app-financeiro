const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSimple() {
  console.log('🧪 Teste simples do Supabase...');
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Configurada' : 'Não configurada');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste com automation_executions
    console.log('📊 Testando tabela automation_executions...');
    const { data: autoData, error: autoError } = await supabase
      .from('automation_executions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (autoError) {
      console.log('❌ Erro na tabela automation_executions:', autoError);
    } else {
      console.log('✅ Tabela automation_executions acessível');
    }
    
    // Teste com hitss_automation_executions
    console.log('📊 Testando tabela hitss_automation_executions...');
    const { data: hitssData, error: hitssError } = await supabase
      .from('hitss_automation_executions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (hitssError) {
      console.log('❌ Erro na tabela hitss_automation_executions:', hitssError);
    } else {
      console.log('✅ Tabela hitss_automation_executions acessível');
    }
    
    // Teste com hitss_projetos
    console.log('📊 Testando tabela hitss_projetos...');
    const { data: projetosResult, error: projetosError } = await supabase
      .from('hitss_projetos')
      .select('count(*)', { count: 'exact', head: true });
    
    if (projetosError) {
      console.log('❌ Erro na tabela hitss_projetos:', projetosError);
    } else {
      console.log('✅ Tabela hitss_projetos acessível');
    }

    // Teste com hitss_data
    console.log('📊 Testando tabela hitss_data...');
    const { data: dataResult, error: dataError } = await supabase
      .from('hitss_data')
      .select('count(*)', { count: 'exact', head: true });
    
    if (dataError) {
      console.log('❌ Erro na tabela hitss_data:', dataError);
    } else {
      console.log('✅ Tabela hitss_data acessível');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

testSimple();