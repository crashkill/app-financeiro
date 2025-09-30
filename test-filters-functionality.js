import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilters() {
  console.log('🧪 Testando funcionalidade dos filtros...\n');

  try {
    // 1. Testar se há dados na tabela
    console.log('1️⃣ Verificando dados na tabela dre_hitss...');
    const { data: countData, error: countError } = await supabase
      .from('dre_hitss')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }

    console.log(`✅ Total de registros: ${countData?.length || 0}\n`);

    // 2. Testar filtro por projetos
    console.log('2️⃣ Testando filtro de projetos...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('dre_hitss')
      .select('projeto')
      .eq('ativo', true);

    if (projectsError) {
      console.error('❌ Erro ao buscar projetos:', projectsError);
      return;
    }

    const uniqueProjects = [...new Set(projectsData?.map(p => p.projeto) || [])];
    console.log(`✅ Projetos únicos encontrados: ${uniqueProjects.length}`);
    console.log('📋 Primeiros 5 projetos:', uniqueProjects.slice(0, 5));
    console.log('');

    // 3. Testar filtro por anos
    console.log('3️⃣ Testando filtro de anos...');
    const { data: yearsData, error: yearsError } = await supabase
      .from('dre_hitss')
      .select('ano')
      .eq('ativo', true);

    if (yearsError) {
      console.error('❌ Erro ao buscar anos:', yearsError);
      return;
    }

    const uniqueYears = [...new Set(yearsData?.map(y => y.ano) || [])].sort();
    console.log(`✅ Anos únicos encontrados: ${uniqueYears.length}`);
    console.log('📅 Anos disponíveis:', uniqueYears);
    console.log('');

    // 4. Testar dados de dashboard para um projeto específico
    console.log('4️⃣ Testando dados de dashboard...');
    if (uniqueProjects.length > 0 && uniqueYears.length > 0) {
      const testProject = uniqueProjects[0];
      const testYear = uniqueYears[0];

      console.log(`🎯 Testando projeto: "${testProject}" - Ano: ${testYear}`);

      const { data: dashboardData, error: dashboardError } = await supabase
        .from('dre_hitss')
        .select('projeto, ano, mes, receita_total, custo_total, desoneracao, valor, natureza')
        .eq('ativo', true)
        .eq('projeto', testProject)
        .eq('ano', testYear)
        .order('mes');

      if (dashboardError) {
        console.error('❌ Erro ao buscar dados do dashboard:', dashboardError);
        return;
      }

      console.log(`✅ Registros encontrados para o projeto: ${dashboardData?.length || 0}`);
      
      if (dashboardData && dashboardData.length > 0) {
        // Calcular totais
        let totalReceita = 0;
        let totalCusto = 0;
        let totalDesoneracao = 0;

        dashboardData.forEach(item => {
          if (item.natureza === 'RECEITA') {
            totalReceita += Number(item.valor || 0);
          } else if (item.natureza === 'DESPESA') {
            totalCusto += Math.abs(Number(item.valor || 0));
          }
          totalDesoneracao += Number(item.desoneracao || 0);
        });

        console.log('💰 Totais calculados:');
        console.log(`   Receita: R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Custo: R$ ${totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Desoneração: R$ ${totalDesoneracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Margem Bruta: R$ ${(totalReceita - totalCusto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        const margemPercentual = totalReceita > 0 ? ((totalReceita - totalCusto) / totalReceita * 100) : 0;
        console.log(`   Margem %: ${margemPercentual.toFixed(2)}%`);
      }
    }

    console.log('\n🎉 Teste de filtros concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testFilters();