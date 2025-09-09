// Script para verificar dados da automação HITSS
// Usando fetch nativo do Node.js para consultar Supabase

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Função para fazer requisições ao Supabase
async function supabaseQuery(table, options = {}) {
  const { select = '*', limit, order } = options;
  let url = `${supabaseUrl}/rest/v1/${table}?select=${select}`;
  
  if (limit) url += `&limit=${limit}`;
  if (order) url += `&order=${order}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erro na consulta: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function checkHitssData() {
  try {
    console.log('🔍 Verificando dados da automação HITSS...');
    
    // Consultar dados da tabela hitss_projetos
    const data = await supabaseQuery('hitss_projetos', {
      select: '*',
      limit: 10,
      order: 'created_at.desc'
    });

    console.log(`\n📊 Registros encontrados: ${data.length}`);
    
    if (data && data.length > 0) {
      console.log('\n✅ Automação funcionando! Dados encontrados:');
      console.log('\n📋 Últimos 10 registros:');
      
      data.forEach((projeto, index) => {
        console.log(`\n${index + 1}. ${projeto.projeto}`);
        console.log(`   Cliente: ${projeto.cliente}`);
        console.log(`   Responsável: ${projeto.responsavel}`);
        console.log(`   Status: ${projeto.status}`);
        console.log(`   Data Início: ${projeto.data_inicio || 'N/A'}`);
        console.log(`   Data Fim: ${projeto.data_fim || 'N/A'}`);
        console.log(`   Criado em: ${new Date(projeto.created_at).toLocaleString('pt-BR')}`);
      });
      
      // Estatísticas por status
      const statusStats = data.reduce((acc, projeto) => {
        acc[projeto.status] = (acc[projeto.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Estatísticas por Status (últimos 10):');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
    } else {
      console.log('\n⚠️  Nenhum dado encontrado na tabela hitss_projetos');
      console.log('A automação pode não ter sido executada ainda ou pode haver um problema.');
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

// Executar verificação
checkHitssData();