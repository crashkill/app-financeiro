const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  console.log('🧪 Testando conexão básica com Supabase...');
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Configurada' : 'Não configurada');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste 1: Verificar se a tabela hitss_data existe
    console.log('📊 Testando tabela hitss_data...');
    const { data: hitssDataResult, error: hitssDataError } = await supabase
      .from('hitss_data')
      .select('count(*)', { count: 'exact', head: true });
    
    if (hitssDataError) {
      console.log('❌ Erro na tabela hitss_data:', hitssDataError);
    } else {
      console.log('✅ Tabela hitss_data acessível');
    }
    
    // Teste 2: Verificar se a tabela automation_executions existe
    console.log('📊 Testando tabela automation_executions...');
    const { data: autoData, error: autoError } = await supabase
      .from('automation_executions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (autoError) {
      console.log('❌ Erro na tabela automation_executions:', autoError);
      console.log('💡 Esta tabela pode não existir ainda');
    } else {
      console.log('✅ Tabela automation_executions acessível');
    }
    
    // Teste 3: Verificar se a tabela hitss_automation_executions existe
    console.log('📊 Testando tabela hitss_automation_executions...');
    const { data: hitssData, error: hitssError } = await supabase
      .from('hitss_automation_executions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (hitssError) {
      console.log('❌ Erro na tabela hitss_automation_executions:', hitssError);
    } else {
      console.log('✅ Tabela hitss_automation_executions acessível');
    }
    
    console.log('✅ Conexão com Supabase OK');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
}

testConnection();