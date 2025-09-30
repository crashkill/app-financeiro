const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunction() {
  console.log('🚀 Testando Edge Function financial-data-unified...\n');

  try {
    // Teste 1: Buscar dados para um projeto específico
    console.log('📊 Teste 1: Buscando dados do dashboard para projeto específico...');
    const { data: dashboardData, error: dashboardError } = await supabase.functions.invoke('financial-data-unified', {
      body: {
        type: 'dashboard',
        filters: {
          projeto: 'NCPVIA068.1 - OGS - PORTAL 2017',
          ano: 2025,
          mes: 9
        }
      }
    });

    if (dashboardError) {
      console.error('❌ Erro no dashboard:', dashboardError);
    } else {
      console.log('✅ Dashboard data recebida:');
      console.log('- Dados brutos:', dashboardData?.rawData?.length || 0, 'registros');
      console.log('- Métricas agregadas:', JSON.stringify(dashboardData?.aggregatedMetrics, null, 2));
      
      if (dashboardData?.rawData?.length > 0) {
        const firstRecord = dashboardData.rawData[0];
        console.log('- Primeiro registro:', JSON.stringify(firstRecord, null, 2));
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 2: Verificar dados para todos os meses
    console.log('📅 Teste 2: Verificando dados para todos os meses de 2025...');
    
    for (let mes = 1; mes <= 12; mes++) {
      const { data: monthData, error: monthError } = await supabase.functions.invoke('financial-data-unified', {
        body: {
          type: 'dashboard',
          filters: {
            projeto: 'NCPVIA068.1 - OGS - PORTAL 2017',
            ano: 2025,
            mes: mes
          }
        }
      });

      if (monthError) {
        console.log(`❌ Mês ${mes}: Erro - ${monthError.message}`);
      } else {
        const recordCount = monthData?.rawData?.length || 0;
        const metrics = monthData?.aggregatedMetrics;
        
        if (recordCount > 0) {
          console.log(`✅ Mês ${mes}: ${recordCount} registros`);
          if (metrics) {
            console.log(`   - Receita: R$ ${metrics.totalReceita || 0}`);
            console.log(`   - Custo: R$ ${metrics.totalCusto || 0}`);
            console.log(`   - Margem: R$ ${metrics.totalMargem || 0}`);
          }
        } else {
          console.log(`⚪ Mês ${mes}: Sem dados`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o teste
testEdgeFunction().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('💥 Erro na execução:', error);
});