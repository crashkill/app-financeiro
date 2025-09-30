const fetch = require('node-fetch');

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function debugRespostaInvalida() {
  console.log('🔍 Debugando erro "Resposta inválida" da Edge Function...\n');

  try {
    // Teste 1: Verificar resposta da Edge Function
    console.log('📡 Teste 1: Chamando Edge Function financial-data-unified...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'projetos',
        filters: {},
        limit: 10
      })
    });

    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    // Verificar se a resposta é válida
    if (!response.ok) {
      console.log('❌ Resposta não OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Erro:', errorText);
      return;
    }

    // Tentar ler como texto primeiro
    const responseText = await response.text();
    console.log(`\n📄 Resposta como texto (primeiros 500 chars):`);
    console.log(responseText.substring(0, 500));

    // Tentar fazer parse do JSON
    try {
      const responseData = JSON.parse(responseText);
      console.log(`\n✅ JSON válido!`);
      console.log(`Tipo da resposta:`, typeof responseData);
      console.log(`Estrutura:`, Object.keys(responseData));
      
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log(`Total de projetos: ${responseData.data.length}`);
        console.log(`Primeiro projeto:`, responseData.data[0]);
      }
    } catch (parseError) {
      console.log(`❌ Erro ao fazer parse do JSON:`, parseError.message);
      console.log(`Resposta completa:`, responseText);
    }

  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    console.log('Stack:', error.stack);
  }

  // Teste 2: Verificar resposta da GraphQL
  console.log('\n📡 Teste 2: Chamando Edge Function graphql-financial-data...');
  try {
    const graphqlResponse = await fetch(`${SUPABASE_URL}/functions/v1/graphql-financial-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetProjects {
            projects {
              id
              name
            }
          }
        `
      })
    });

    console.log(`Status: ${graphqlResponse.status}`);
    const graphqlText = await graphqlResponse.text();
    console.log(`Resposta GraphQL (primeiros 300 chars):`, graphqlText.substring(0, 300));

    try {
      const graphqlData = JSON.parse(graphqlText);
      console.log(`✅ GraphQL JSON válido!`);
      console.log(`Estrutura:`, Object.keys(graphqlData));
    } catch (parseError) {
      console.log(`❌ Erro ao fazer parse do GraphQL JSON:`, parseError.message);
    }

  } catch (error) {
    console.log('❌ Erro na requisição GraphQL:', error.message);
  }

  // Teste 3: Simular chamada do frontend
  console.log('\n📡 Teste 3: Simulando chamada do frontend...');
  try {
    const frontendResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
      },
      body: JSON.stringify({
        type: 'dashboard'
      })
    });

    console.log(`Status: ${frontendResponse.status}`);
    const frontendText = await frontendResponse.text();
    
    if (frontendText.length === 0) {
      console.log('❌ Resposta vazia!');
    } else {
      console.log(`Resposta frontend (primeiros 300 chars):`, frontendText.substring(0, 300));
      
      try {
        const frontendData = JSON.parse(frontendText);
        console.log(`✅ Frontend JSON válido!`);
        console.log(`Estrutura:`, Object.keys(frontendData));
      } catch (parseError) {
        console.log(`❌ Erro ao fazer parse do frontend JSON:`, parseError.message);
        console.log(`Resposta completa:`, frontendText);
      }
    }

  } catch (error) {
    console.log('❌ Erro na simulação do frontend:', error.message);
  }
}

debugRespostaInvalida().catch(console.error);