const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardIntegration() {
  try {
    console.log('🔍 Testando integração Dashboard <-> Edge Function...\n');
    
    // 1. Primeiro, vamos buscar um projeto que sabemos que tem dados
    console.log('1. Buscando projetos disponíveis...');
    const { data: projectsResponse, error: projectsError } = await supabase.functions.invoke('financial-data-unified', {
      body: { type: 'projetos' }
    });

    if (projectsError) {
      console.error('❌ Erro ao buscar projetos:', projectsError);
      return;
    }

    console.log('✅ Projetos encontrados:', projectsResponse.data.projetos.length);
    const projeto = projectsResponse.data.projetos[0]; // Pegar o primeiro projeto
    console.log('📋 Projeto selecionado:', projeto);

    // 2. Buscar anos disponíveis
    console.log('\n2. Buscando anos disponíveis...');
    const { data: yearsResponse, error: yearsError } = await supabase.functions.invoke('financial-data-unified', {
      body: { type: 'anos' }
    });

    if (yearsError) {
      console.error('❌ Erro ao buscar anos:', yearsError);
      return;
    }

    console.log('✅ Anos encontrados:', yearsResponse.data.anos);
    const ano = yearsResponse.data.anos[yearsResponse.data.anos.length - 2]; // Pegar o penúltimo ano (não 2025)
    console.log('📅 Ano selecionado:', ano);

    // 3. Buscar dados do dashboard para esse projeto e ano
    console.log('\n3. Buscando dados do dashboard...');
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
      console.error('❌ Erro ao buscar dados do dashboard:', dashboardError);
      return;
    }

    console.log('✅ Resposta da Edge Function recebida');
    console.log('📊 Estrutura da resposta:');
    console.log('- Success:', dashboardResponse.success);
    console.log('- Data type:', Array.isArray(dashboardResponse.data) ? 'Array' : typeof dashboardResponse.data);
    console.log('- Data length:', dashboardResponse.data?.length || 0);
    
    if (dashboardResponse.metrics) {
      console.log('- Metrics disponíveis:', Object.keys(dashboardResponse.metrics));
      console.log('- Total Receita:', dashboardResponse.metrics.totalReceita);
      console.log('- Total Custo:', dashboardResponse.metrics.totalCusto);
      console.log('- Total Margem:', dashboardResponse.metrics.totalMargem);
    }

    // 4. Simular o processamento que o Dashboard faz
    console.log('\n4. Simulando processamento do Dashboard...');
    
    if (dashboardResponse.data && Array.isArray(dashboardResponse.data)) {
      let totalReceita = 0;
      let totalCusto = 0;
      
      dashboardResponse.data.forEach((item) => {
        console.log(`📈 Mês ${item.mes}/${item.ano}:`);
        console.log(`   - Receita: R$ ${item.receita_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   - Custo: R$ ${item.custo_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   - Margem: R$ ${item.margem_bruta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        totalReceita += item.receita_total || 0;
        totalCusto += Math.abs(item.custo_total || 0);
      });
      
      console.log('\n💰 Totais calculados pelo frontend:');
      console.log(`- Total Receita: R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`- Total Custo: R$ ${totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`- Margem: R$ ${(totalReceita - totalCusto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      
      const margemPercentual = totalReceita > 0 && totalCusto > 0
        ? ((1 - (totalCusto / totalReceita)) * 100).toFixed(2)
        : '0,00';
      console.log(`- Margem %: ${margemPercentual}%`);
      
      if (totalReceita === 0 && totalCusto === 0) {
        console.log('\n⚠️  PROBLEMA IDENTIFICADO: Todos os valores estão zerados!');
        console.log('Isso explica por que o Dashboard mostra R$ 0,00');
      } else {
        console.log('\n✅ Dados financeiros encontrados e processados corretamente');
      }
    } else {
      console.log('⚠️  PROBLEMA: Edge Function não retornou array de dados');
      console.log('Resposta completa:', JSON.stringify(dashboardResponse, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testDashboardIntegration().then(() => {
  console.log('\n🏁 Teste de integração concluído!');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});