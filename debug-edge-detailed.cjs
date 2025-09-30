const fetch = require('node-fetch');

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testEdgeFunction() {
  console.log('🔍 Testando Edge Function com debug detalhado...\n');

  try {
    // Teste 1: Projetos sem filtros
    console.log('📊 Teste 1: Buscando projetos sem filtros');
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'projetos'
        // Sem filtros
      })
    });

    const result1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log(`Projetos encontrados: ${result1.data?.length || 0}`);
    console.log(`Primeiros 10 projetos:`, result1.data?.slice(0, 10));
    console.log(`Filtros aplicados:`, result1.filters);
    console.log('---\n');

    // Teste 2: Anos sem filtros
    console.log('📅 Teste 2: Buscando anos sem filtros');
    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'anos'
        // Sem filtros
      })
    });

    const result2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Anos encontrados: ${result2.data?.length || 0}`);
    console.log(`Anos:`, result2.data);
    console.log(`Filtros aplicados:`, result2.filters);
    console.log('---\n');

    // Teste 3: Dashboard com limite específico
    console.log('📈 Teste 3: Buscando dados do dashboard');
    const response3 = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'dashboard',
        limit: 10
      })
    });

    const result3 = await response3.json();
    console.log(`Status: ${response3.status}`);
    console.log(`Registros dashboard: ${result3.data?.length || 0}`);
    console.log(`Total count: ${result3.count || 'N/A'}`);
    console.log(`Filtros aplicados:`, result3.filters);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testEdgeFunction();