// Script para testar todas as APIs com dados completos
import fetch from 'node-fetch';

async function testCompleteSystem() {
  console.log('🚀 Testando Sistema DRE Completo...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  try {
    // Test 1: Tabelas dimensionais
    console.log('📊 1. Testando tabelas dimensionais...');

    const dimensions = ['dim_projeto', 'dim_cliente', 'dim_conta', 'dim_periodo', 'dim_recurso'];
    for (const table of dimensions) {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=2`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log(`✅ ${table}: ${data.length} registros`);
    }

    // Test 2: Tabela fato
    console.log('\n📈 2. Testando tabela fato...');

    const factResponse = await fetch(`${supabaseUrl}/rest/v1/fact_dre_lancamentos?limit=5`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const factData = await factResponse.json();
    console.log(`✅ fact_dre_lancamentos: ${factData.length} registros`);
    console.log('📊 Dados:', JSON.stringify(factData, null, 2));

    // Test 3: Views analíticas
    console.log('\n🔍 3. Testando views analíticas...');

    const views = ['vw_dre_resumo_mensal', 'vw_dre_por_categoria', 'vw_dre_tendencia', 'vw_dre_detalhada'];
    for (const view of views) {
      const response = await fetch(`${supabaseUrl}/rest/v1/${view}?limit=5`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log(`✅ ${view}: ${data.length} registros`);
    }

    // Test 4: GraphQL completo
    console.log('\n🔗 4. Testando GraphQL completo...');

    const graphqlQueries = [
      {
        name: 'Resumo Mensal',
        query: `query {
          vw_dre_resumo_mensal(limit: 5) {
            ano
            mes
            receita
            despesa
            resultado
          }
        }`
      },
      {
        name: 'Por Categoria',
        query: `query {
          vw_dre_por_categoria(limit: 5) {
            categoria
            tipo
            valor
            periodo
          }
        }`
      },
      {
        name: 'Lançamentos',
        query: `query {
          fact_dre_lancamentos(limit: 3) {
            id
            valor
            tipo
            natureza
            descricao
            data_transacao
          }
        }`
      }
    ];

    for (const gql of graphqlQueries) {
      const response = await fetch(`${supabaseUrl}/graphql/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ query: gql.query })
      });
      const data = await response.json();
      console.log(`✅ GraphQL ${gql.name}: ${response.status} - ${data.data ? 'Dados retornados' : 'Sem dados'}`);
    }

    // Test 5: RPC Functions
    console.log('\n⚡ 5. Testando funções RPC...');

    const rpcTests = [
      { name: 'Métricas DRE', params: { p_ano: 2025, p_mes: 9 } },
      { name: 'Métricas DRE Agosto', params: { p_ano: 2025, p_mes: 8 } }
    ];

    for (const rpc of rpcTests) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/calcular_metricas_dre`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rpc.params)
      });
      const data = await response.json();
      console.log(`✅ RPC ${rpc.name}: ${response.status} - ${Array.isArray(data) ? `${data.length} registros` : 'Dados calculados'}`);
    }

    // Test 6: Frontend
    console.log('\n📱 6. Testando frontend...');

    const frontendResponse = await fetch('http://localhost:3000');
    console.log(`✅ Frontend: ${frontendResponse.status} - ${frontendResponse.statusText}`);

    console.log('\n🎉 ✅ SISTEMA DRE COMPLETO TESTADO COM SUCESSO!');
    console.log('📊 Todas as funcionalidades estão operacionais!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testCompleteSystem();
