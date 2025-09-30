const fetch = require('node-fetch');

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testProjectsSpecific() {
  console.log('🔍 Teste específico para projetos...\n');

  try {
    // Teste 1: Buscar projetos com limite baixo
    console.log('📊 Teste 1: Projetos com limite 10');
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'projetos',
        limit: 10
      })
    });

    const result1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log(`Projetos encontrados: ${result1.data?.length || 0}`);
    console.log(`Primeiros 10 projetos:`, result1.data?.slice(0, 10));
    console.log(`Count retornado:`, result1.count);
    console.log('---\n');

    // Teste 2: Buscar projetos com limite alto
    console.log('📊 Teste 2: Projetos com limite 5000');
    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'projetos',
        limit: 5000
      })
    });

    const result2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Projetos encontrados: ${result2.data?.length || 0}`);
    console.log(`Primeiros 10 projetos:`, result2.data?.slice(0, 10));
    console.log(`Count retornado:`, result2.count);
    console.log('---\n');

    // Teste 3: Buscar projetos sem limit explícito
    console.log('📊 Teste 3: Projetos sem limit explícito');
    const response3 = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'projetos'
      })
    });

    const result3 = await response3.json();
    console.log(`Status: ${response3.status}`);
    console.log(`Projetos encontrados: ${result3.data?.length || 0}`);
    console.log(`Primeiros 10 projetos:`, result3.data?.slice(0, 10));
    console.log(`Count retornado:`, result3.count);
    console.log('---\n');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testProjectsSpecific();