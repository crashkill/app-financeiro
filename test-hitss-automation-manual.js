const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testHitssAutomation() {
  try {
    // Configurar cliente Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🧪 Testando Edge Function da automação HITSS...');
    console.log('=' .repeat(60));
    
    // Testar chamada direta à Edge Function
    console.log('📡 Chamando Edge Function hitss-automation...');
    
    const { data, error } = await supabase.functions.invoke('hitss-automation', {
      body: { test: true }
    });
    
    if (error) {
      console.error('❌ Erro ao chamar Edge Function:', error.message);
      console.error('Detalhes:', error);
    } else {
      console.log('✅ Edge Function executada com sucesso!');
      console.log('📊 Resposta:', JSON.stringify(data, null, 2));
    }
    
    console.log('\n' + '=' .repeat(60));
    
    // Verificar se existem dados na tabela hitss_projetos
    console.log('📋 Verificando dados na tabela hitss_projetos...');
    
    const { data: projetos, error: projetosError } = await supabase
      .from('hitss_projetos')
      .select('*')
      .limit(5);
    
    if (projetosError) {
      console.error('❌ Erro ao buscar projetos:', projetosError.message);
    } else {
      console.log(`📊 Total de projetos encontrados: ${projetos?.length || 0}`);
      
      if (projetos && projetos.length > 0) {
        console.log('\n📝 Primeiros 5 projetos:');
        projetos.forEach((projeto, index) => {
          console.log(`\n${index + 1}. ${projeto.nome_projeto || 'N/A'}`);
          console.log(`   Cliente: ${projeto.cliente || 'N/A'}`);
          console.log(`   Status: ${projeto.status || 'N/A'}`);
          console.log(`   Criado em: ${new Date(projeto.created_at).toLocaleString('pt-BR')}`);
        });
      } else {
        console.log('⚠️  Nenhum projeto encontrado na tabela');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    
    // Verificar logs mais recentes
    console.log('📊 Verificando logs mais recentes...');
    
    const { data: logs, error: logsError } = await supabase
      .from('hitss_automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError.message);
    } else if (!logs || logs.length === 0) {
      console.log('⚠️  Nenhum log encontrado');
    } else {
      console.log('\n📝 Últimos 3 logs:');
      logs.forEach((log, index) => {
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        const level = log.level.toUpperCase();
        const icon = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
        
        console.log(`\n${index + 1}. ${icon} [${level}] ${date}`);
        console.log(`   ${log.message}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testHitssAutomation();