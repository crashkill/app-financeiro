const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardFilters() {
  try {
    console.log('🔍 Testando filtros do Dashboard...\n');
    
    // 1. Simular o que acontece quando o Dashboard carrega
    console.log('1. Simulando carregamento inicial do Dashboard...');
    
    // Carregar projetos
    console.log('   📋 Carregando projetos...');
    const { data: projectsResponse, error: projectsError } = await supabase.functions.invoke('financial-data-unified', {
      body: { type: 'projetos' }
    });

    if (projectsError) {
      console.error('❌ Erro ao carregar projetos:', projectsError);
      return;
    }

    const projects = projectsResponse.data.projetos;
    console.log(`   ✅ ${projects.length} projetos carregados`);
    console.log(`   📋 Primeiro projeto: ${projects[0]}`);

    // Carregar anos
    console.log('   📅 Carregando anos...');
    const { data: yearsResponse, error: yearsError } = await supabase.functions.invoke('financial-data-unified', {
      body: { type: 'anos' }
    });

    if (yearsError) {
      console.error('❌ Erro ao carregar anos:', yearsError);
      return;
    }

    const years = yearsResponse.data.anos;
    console.log(`   ✅ ${years.length} anos carregados: [${years.join(', ')}]`);

    // 2. Simular estado inicial do Dashboard
    console.log('\n2. Simulando estado inicial do Dashboard...');
    const currentYear = new Date().getFullYear().toString(); // 2025
    const selectedProjects = []; // Inicialmente vazio
    const selectedYear = currentYear;

    console.log(`   📅 Ano selecionado: ${selectedYear}`);
    console.log(`   📋 Projetos selecionados: [${selectedProjects.join(', ')}] (${selectedProjects.length} projetos)`);

    // 3. Verificar se o Dashboard tentaria carregar dados
    console.log('\n3. Verificando se o Dashboard carregaria dados...');
    
    if (!selectedProjects.length || !selectedYear) {
      console.log('   ⚠️  PROBLEMA IDENTIFICADO: Dashboard não carregará dados!');
      console.log('   📋 Projetos selecionados:', selectedProjects.length);
      console.log('   📅 Ano selecionado:', selectedYear);
      console.log('   🔍 Condição: (!selectedProjects.length || !selectedYear)');
      console.log('   🔍 Resultado:', (!selectedProjects.length || !selectedYear));
      
      console.log('\n   💡 SOLUÇÃO: O Dashboard precisa ter projetos pré-selecionados ou permitir "todos os projetos"');
      return;
    }

    // 4. Se chegou aqui, simular chamada do Dashboard
    console.log('\n4. Simulando chamada do Dashboard...');
    const projeto = selectedProjects[0];
    const ano = parseInt(selectedYear);

    console.log(`   🎯 Chamando Edge Function com: projeto="${projeto}", ano=${ano}`);

    const { data: dashboardResponse, error: dashboardError } = await supabase.functions.invoke('financial-data-unified', {
      body: {
        type: 'dashboard',
        filters: {
          projeto: projeto,
          ano: ano
        }
      }
    });

    if (dashboardError) {
      console.error('❌ Erro na Edge Function:', dashboardError);
      return;
    }

    console.log('✅ Edge Function executada com sucesso');
    console.log('📊 Dados retornados:', dashboardResponse.data?.length || 0, 'registros');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

async function testWithProjectSelection() {
  try {
    console.log('\n\n🔧 Testando com projeto pré-selecionado...\n');
    
    // Carregar projetos
    const { data: projectsResponse } = await supabase.functions.invoke('financial-data-unified', {
      body: { type: 'projetos' }
    });

    const projects = projectsResponse.data.projetos;
    const selectedProjects = [projects[0]]; // Selecionar o primeiro projeto
    const selectedYear = '2017'; // Usar um ano que sabemos que tem dados

    console.log(`📋 Projeto selecionado: ${selectedProjects[0]}`);
    console.log(`📅 Ano selecionado: ${selectedYear}`);

    // Verificar condição
    if (!selectedProjects.length || !selectedYear) {
      console.log('❌ Ainda não passaria na condição');
      return;
    }

    console.log('✅ Passaria na condição do Dashboard');

    // Simular chamada
    const projeto = selectedProjects[0];
    const ano = parseInt(selectedYear);

    const { data: dashboardResponse, error: dashboardError } = await supabase.functions.invoke('financial-data-unified', {
      body: {
        type: 'dashboard',
        filters: {
          projeto: projeto,
          ano: ano
        }
      }
    });

    if (dashboardError) {
      console.error('❌ Erro na Edge Function:', dashboardError);
      return;
    }

    console.log('✅ Edge Function executada com sucesso');
    console.log('📊 Dados retornados:', dashboardResponse.data?.length || 0, 'registros');
    
    if (dashboardResponse.metrics) {
      console.log('💰 Métricas:');
      console.log(`   - Receita: R$ ${dashboardResponse.metrics.totalReceita?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   - Custo: R$ ${dashboardResponse.metrics.totalCusto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   - Margem: R$ ${dashboardResponse.metrics.totalMargem?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testDashboardFilters()
  .then(() => testWithProjectSelection())
  .then(() => {
    console.log('\n🏁 Teste de filtros concluído!');
    console.log('\n💡 CONCLUSÃO: O problema está na inicialização dos filtros.');
    console.log('   - O Dashboard inicia com selectedProjects = [] (vazio)');
    console.log('   - A condição (!selectedProjects.length) impede o carregamento');
    console.log('   - Solução: Pré-selecionar o primeiro projeto ou permitir "todos"');
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
  });