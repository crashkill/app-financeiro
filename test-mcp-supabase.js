// Script de verificação do MCP-Supabase-HITSS
// Testa a conexão e acesso às tabelas do projeto HITSS

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Tabelas para verificar
const tablesToCheck = [
  'hitss_projetos',
  'dre_hitss',
  'hitss_automation_logs'
];

async function testMCPSupabaseConnection() {
  console.log('🔍 Testando conexão MCP-Supabase-HITSS...');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`🔑 Token configurado: ${supabaseKey ? 'Sim' : 'Não'}`);
  console.log('');

  try {
    // Testar conexão básica
    console.log('1. Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('hitss_projetos')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message);
      return false;
    }
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');

    // Verificar cada tabela
    console.log('2. Verificando acesso às tabelas...');
    for (const table of tablesToCheck) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Erro ao acessar tabela '${table}':`, error.message);
        } else {
          console.log(`✅ Tabela '${table}': ${count || 0} registros`);
        }
      } catch (err) {
        console.error(`❌ Erro inesperado na tabela '${table}':`, err.message);
      }
    }
    console.log('');

    // Testar inserção de log de teste
    console.log('3. Testando inserção de log de teste...');
    const testLog = {
      level: 'info',
      message: 'Teste de conexão MCP-Supabase-HITSS',
      context: { test: true, timestamp: new Date().toISOString() }
    };

    const { data: logData, error: logError } = await supabase
      .from('hitss_automation_logs')
      .insert([testLog])
      .select();

    if (logError) {
      console.error('❌ Erro ao inserir log de teste:', logError.message);
    } else {
      console.log('✅ Log de teste inserido com sucesso!');
      console.log('📝 ID do log:', logData[0]?.id);
    }
    console.log('');

    // Verificar dados DRE HITSS
    console.log('4. Verificando dados DRE HITSS...');
    const { data: dreData, error: dreError, count: dreCount } = await supabase
      .from('dre_hitss')
      .select('upload_batch_id, tipo, valor', { count: 'exact' })
      .limit(5);

    if (dreError) {
      console.error('❌ Erro ao consultar DRE HITSS:', dreError.message);
    } else {
      console.log(`✅ DRE HITSS: ${dreCount || 0} registros encontrados`);
      if (dreData && dreData.length > 0) {
        console.log('📊 Últimos registros:');
        dreData.forEach((record, index) => {
          console.log(`   ${index + 1}. Batch: ${record.upload_batch_id}, Tipo: ${record.tipo}, Valor: ${record.valor}`);
        });
      }
    }
    console.log('');

    console.log('🎉 Verificação do MCP-Supabase-HITSS concluída!');
    return true;

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return false;
  }
}

// Executar teste
if (require.main === module) {
  testMCPSupabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testMCPSupabaseConnection };