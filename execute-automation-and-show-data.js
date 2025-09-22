const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para executar a automação HITSS
async function executeAutomation() {
  console.log('🚀 Executando automação HITSS...');
  
  try {
    // Chamar a Edge Function
    const { data, error } = await supabase.functions.invoke('hitss-automation', {
      body: {
        trigger: 'manual',
        executionId: crypto.randomUUID()
      }
    });
    
    if (error) {
      console.error('❌ Erro na execução:', error);
      return false;
    }
    
    console.log('✅ Automação executada com sucesso!');
    console.log('📊 Resultado:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return false;
  }
}

// Função para mostrar dados em formato de tabela
async function showDataTable() {
  console.log('\n📋 DADOS REAIS DA AUTOMAÇÃO HITSS');
  console.log('=' .repeat(80));
  
  try {
    // Buscar dados dos projetos
    const { data: projects, error } = await supabase
      .from('hitss_projetos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }
    
    if (!projects || projects.length === 0) {
      console.log('⚠️  Nenhum dado encontrado na tabela hitss_projetos');
      return;
    }
    
    console.log(`\n📊 Total de projetos: ${projects.length}`);
    console.log('\n┌─────┬─────────────────────────┬─────────────────┬─────────────┬──────────────┬─────────────────────┐');
    console.log('│ #   │ Nome do Projeto         │ Cliente         │ Responsável │ Status       │ Data Criação        │');
    console.log('├─────┼─────────────────────────┼─────────────────┼─────────────┼──────────────┼─────────────────────┤');
    
    projects.forEach((project, index) => {
      const nome = (project.nome || 'N/A').padEnd(23).substring(0, 23);
      const cliente = (project.cliente || 'N/A').padEnd(15).substring(0, 15);
      const responsavel = (project.responsavel || 'N/A').padEnd(11).substring(0, 11);
      const status = (project.status || 'N/A').padEnd(12).substring(0, 12);
      const dataFormatada = project.created_at 
        ? new Date(project.created_at).toLocaleString('pt-BR').padEnd(19).substring(0, 19)
        : 'N/A'.padEnd(19);
      
      console.log(`│ ${(index + 1).toString().padStart(3)} │ ${nome} │ ${cliente} │ ${responsavel} │ ${status} │ ${dataFormatada} │`);
    });
    
    console.log('└─────┴─────────────────────────┴─────────────────┴─────────────┴──────────────┴─────────────────────┘');
    
    // Estatísticas
    const statusCount = projects.reduce((acc, project) => {
      const status = project.status || 'N/A';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Estatísticas por Status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    // Buscar logs recentes
    const { data: logs } = await supabase
      .from('hitss_automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logs && logs.length > 0) {
      console.log('\n📝 Últimos 5 logs da automação:');
      console.log('─'.repeat(60));
      
      logs.forEach((log, index) => {
        const icon = log.level === 'error' ? '❌' : log.level === 'warning' ? '⚠️' : '✅';
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        console.log(`${index + 1}. ${icon} [${log.level.toUpperCase()}] ${date}`);
        console.log(`   ${log.message}`);
        if (index < logs.length - 1) console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao exibir dados:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🎯 EXECUÇÃO DA AUTOMAÇÃO HITSS COM DADOS REAIS');
  console.log('=' .repeat(80));
  
  // Executar automação
  const success = await executeAutomation();
  
  if (success) {
    // Aguardar um pouco para os dados serem processados
    console.log('\n⏳ Aguardando processamento dos dados...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Mostrar dados independentemente do resultado da execução
  await showDataTable();
  
  console.log('\n✅ Execução concluída!');
  console.log('\n💡 Nota: Os dados mostrados são REAIS extraídos da automação HITSS.');
  console.log('   Estes não são dados mockados ou simulados.');
}

// Executar
main().catch(console.error);