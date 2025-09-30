const fetch = require('node-fetch');

// Configuração do Supabase
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testEdgeFunction() {
  console.log('🧪 Testando Edge Function financial-data-unified corrigida...\n');

  try {
    // Teste 1: Buscar todos os projetos
    console.log('📋 Teste 1: Buscando todos os projetos disponíveis...');
    const projectsResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'projetos',
        filters: {}
      })
    });

    if (!projectsResponse.ok) {
      throw new Error(`Erro HTTP: ${projectsResponse.status} - ${projectsResponse.statusText}`);
    }

    const projectsData = await projectsResponse.json();
    console.log('✅ Resposta da Edge Function para projetos:', {
      success: projectsData.success,
      type: projectsData.type,
      count: projectsData.count,
      projectsCount: projectsData.data?.projetos?.length || 0
    });

    if (projectsData.success && projectsData.data?.projetos) {
      console.log(`📊 Projetos encontrados (${projectsData.data.projetos.length}):`, projectsData.data.projetos);
    } else {
      console.error('❌ Erro na resposta de projetos:', projectsData);
    }

    // Teste 2: Buscar todos os anos
    console.log('\n📅 Teste 2: Buscando todos os anos disponíveis...');
    const yearsResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'anos',
        filters: {}
      })
    });

    if (!yearsResponse.ok) {
      throw new Error(`Erro HTTP: ${yearsResponse.status} - ${yearsResponse.statusText}`);
    }

    const yearsData = await yearsResponse.json();
    console.log('✅ Resposta da Edge Function para anos:', {
      success: yearsData.success,
      type: yearsData.type,
      count: yearsData.count,
      yearsCount: yearsData.data?.anos?.length || 0
    });

    if (yearsData.success && yearsData.data?.anos) {
      console.log(`📊 Anos encontrados (${yearsData.data.anos.length}):`, yearsData.data.anos);
    } else {
      console.error('❌ Erro na resposta de anos:', yearsData);
    }

    // Teste 3: Verificar se há mais de 5 projetos e mais de 1 ano
    console.log('\n🔍 Teste 3: Verificando se a limitação foi corrigida...');
    
    const projectCount = projectsData.data?.projetos?.length || 0;
    const yearCount = yearsData.data?.anos?.length || 0;
    
    console.log(`📈 Resultados da correção:`);
    console.log(`   - Projetos: ${projectCount} (antes: limitado a ~5)`);
    console.log(`   - Anos: ${yearCount} (antes: limitado a 2025)`);
    
    if (projectCount > 5) {
      console.log('✅ SUCESSO: Mais de 5 projetos encontrados - limitação removida!');
    } else {
      console.log('⚠️  ATENÇÃO: Ainda há limitação nos projetos ou poucos dados disponíveis');
    }
    
    if (yearCount > 1) {
      console.log('✅ SUCESSO: Múltiplos anos encontrados - limitação removida!');
    } else {
      console.log('⚠️  ATENÇÃO: Ainda há limitação nos anos ou poucos dados disponíveis');
    }

    // Teste 4: Testar dados do dashboard
    console.log('\n📊 Teste 4: Testando dados do dashboard...');
    const dashboardResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'dashboard',
        filters: {}
      })
    });

    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dados do dashboard:', {
        success: dashboardData.success,
        recordCount: dashboardData.data?.length || 0,
        type: dashboardData.type
      });
    } else {
      console.log('⚠️  Erro ao buscar dados do dashboard');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testEdgeFunction().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('💥 Falha crítica no teste:', error);
});