/**
 * DEBUG DA EDGE FUNCTION
 * Script para debugar problemas na Edge Function de gestão de profissionais
 */

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function debugEdgeFunction() {
  console.log('🔍 DEBUGANDO EDGE FUNCTION');
  console.log('=' .repeat(50));

  // 1. Testar GET (listagem)
  console.log('\n📋 1. Testando GET (listagem)...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Text:', responseText);

    try {
      const data = JSON.parse(responseText);
      console.log('Parsed Data:', data);
      console.log('É array?', Array.isArray(data));
      console.log('Quantidade:', Array.isArray(data) ? data.length : 'N/A');
    } catch (e) {
      console.log('Erro ao fazer parse do JSON:', e.message);
    }

  } catch (error) {
    console.error('Erro na requisição GET:', error.message);
  }

  // 2. Testar POST (criação)
  console.log('\n📝 2. Testando POST (criação)...');
  const profissionalTeste = {
    nome: `Debug Test ${Date.now()}`,
    email: `debug.test.${Date.now()}@teste.com`,
    regime: 'CLT',
    origem: 'cadastro',
    local_alocacao: 'Debug Test',
    proficiencia: 'Pleno'
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profissionalTeste)
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Text:', responseText);

    try {
      const data = JSON.parse(responseText);
      console.log('Parsed Data:', data);
      
      if (data.success && data.data && data.data.id) {
        const profissionalId = data.data.id;
        console.log('✅ Profissional criado com ID:', profissionalId);

        // 3. Testar DELETE
        console.log('\n🗑️ 3. Testando DELETE...');
        const deleteResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: profissionalId })
        });

        console.log('Delete Status:', deleteResponse.status);
        console.log('Delete Status Text:', deleteResponse.statusText);

        const deleteResponseText = await deleteResponse.text();
        console.log('Delete Response Text:', deleteResponseText);

        try {
          const deleteData = JSON.parse(deleteResponseText);
          console.log('Delete Parsed Data:', deleteData);
        } catch (e) {
          console.log('Erro ao fazer parse do JSON de delete:', e.message);
        }

      } else {
        console.log('❌ Falha na criação do profissional');
      }

    } catch (e) {
      console.log('Erro ao fazer parse do JSON de criação:', e.message);
    }

  } catch (error) {
    console.error('Erro na requisição POST:', error.message);
  }

  console.log('\n🎯 Debug concluído!');
}

debugEdgeFunction().catch(console.error)