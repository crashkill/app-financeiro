// Script para testar os filtros de projeto e ano
import fetch from 'node-fetch';

async function testFilters() {
  console.log('🔍 Testando Filtros de Projeto e Ano...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  try {
    // 1. Testar projetos da tabela dim_projeto
    console.log('📊 1. Projetos da tabela dim_projeto:');
    const dimProjetosResponse = await fetch(`${supabaseUrl}/rest/v1/dim_projeto?limit=20`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const dimProjetos = await dimProjetosResponse.json();
    console.log(`✅ Encontrados ${dimProjetos.length} projetos na dim_projeto:`);
    dimProjetos.forEach(p => console.log(`   - ${p.codigo}: ${p.nome}`));

    // 2. Testar projetos da tabela dre_hitss
    console.log('\n📋 2. Projetos da tabela dre_hitss:');
    const dreHitssResponse = await fetch(`${supabaseUrl}/rest/v1/dre_hitss?limit=20`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const dreHitss = await dreHitssResponse.json();
    console.log(`✅ Encontrados ${dreHitss.length} registros na dre_hitss`);

    const uniqueProjects = [...new Set(dreHitss.map(d => d.projeto).filter(Boolean))];
    console.log(`✅ Projetos únicos na dre_hitss: ${uniqueProjects.length}`);
    uniqueProjects.forEach(p => console.log(`   - ${p}`));

    // 3. Testar anos da tabela dre_hitss
    console.log('\n📅 3. Anos da tabela dre_hitss:');
    const uniqueYears = [...new Set(dreHitss.map(d => d.ano).filter(Boolean))];
    console.log(`✅ Anos únicos na dre_hitss: ${uniqueYears.length}`);
    uniqueYears.sort((a, b) => b - a).forEach(year => console.log(`   - ${year}`));

    // 4. Testar anos da tabela transacoes_financeiras
    console.log('\n💰 4. Anos da tabela transacoes_financeiras:');
    const transacoesResponse = await fetch(`${supabaseUrl}/rest/v1/transacoes_financeiras?limit=20`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const transacoes = await transacoesResponse.json();
    console.log(`✅ Encontrados ${transacoes.length} registros nas transacoes_financeiras`);

    const uniqueTransYears = [...new Set(transacoes.map(t => new Date(t.data_transacao).getFullYear()).filter(Boolean))];
    console.log(`✅ Anos únicos nas transacoes_financeiras: ${uniqueTransYears.length}`);
    uniqueTransYears.sort((a, b) => b - a).forEach(year => console.log(`   - ${year}`));

    // 5. Testar anos da tabela fact_dre_lancamentos
    console.log('\n📈 5. Anos da tabela fact_dre_lancamentos:');
    const factResponse = await fetch(`${supabaseUrl}/rest/v1/fact_dre_lancamentos?limit=20`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const factData = await factResponse.json();
    console.log(`✅ Encontrados ${factData.length} registros na fact_dre_lancamentos`);

    const uniqueFactYears = [...new Set(factData.map(f => new Date(f.data_transacao).getFullYear()).filter(Boolean))];
    console.log(`✅ Anos únicos na fact_dre_lancamentos: ${uniqueFactYears.length}`);
    uniqueFactYears.sort((a, b) => b - a).forEach(year => console.log(`   - ${year}`));

    // 6. Resumo total
    console.log('\n🎯 === RESUMO TOTAL ===');
    console.log(`📊 Total de projetos únicos: ${uniqueProjects.length + dimProjetos.length}`);
    console.log(`📅 Total de anos únicos: ${new Set([...uniqueYears, ...uniqueTransYears, ...uniqueFactYears]).size}`);

    const allProjects = new Set([...uniqueProjects, ...dimProjetos.map(p => p.codigo), ...dimProjetos.map(p => p.nome)]);
    const allYears = new Set([...uniqueYears, ...uniqueTransYears, ...uniqueFactYears]);

    console.log('\n📋 === PROJETOS DISPONÍVEIS ===');
    Array.from(allProjects).sort().forEach(project => console.log(`   ✅ ${project}`));

    console.log('\n📅 === ANOS DISPONÍVEIS ===');
    Array.from(allYears).sort((a, b) => b - a).forEach(year => console.log(`   ✅ ${year}`));

  } catch (error) {
    console.error('❌ Erro ao testar filtros:', error.message);
  }
}

testFilters();
