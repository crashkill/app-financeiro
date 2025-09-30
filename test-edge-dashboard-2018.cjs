const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboard2018() {
  try {
    console.log('🧪 Testando Edge Function com dados reais de 2018...\n');
    
    // Teste com dados que sabemos que existem
    const { data, error } = await supabase.functions.invoke('financial-data-unified', {
      body: {
        type: 'dashboard',
        filters: {
          projeto: 'NCPVIA068.1 - OGS - PORTAL 2017',
          ano: 2018
        }
      }
    });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      return;
    }

    console.log('✅ Resposta da Edge Function recebida');
    console.log('📊 Estrutura da resposta:');
    console.log('- Success:', data.success);
    console.log('- Data length:', data.data?.length || 0);
    console.log('- Metrics:', JSON.stringify(data.metrics, null, 2));
    
    if (data.data && data.data.length > 0) {
      console.log('\n📈 Dados mensais encontrados:');
      data.data.forEach((item, index) => {
        console.log(`  ${index + 1}. Mês ${item.mes}/${item.ano}:`);
        console.log(`     - Receita: R$ ${item.receita_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`     - Custo: R$ ${item.custo_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`     - Margem: R$ ${item.margem_bruta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`     - Registros: ${item.registros?.length || 0}`);
      });
    } else {
      console.log('⚠️  Nenhum dado encontrado');
      console.log('Resposta completa:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testDashboard2018().then(() => {
  console.log('\n✅ Teste concluído!');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});