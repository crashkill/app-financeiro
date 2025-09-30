const fetch = require('node-fetch');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testCorsDebug() {
  console.log('🔍 Testando CORS da Edge Function financial-data-unified...\n');
  
  const edgeUrl = `${SUPABASE_URL}/functions/v1/financial-data-unified`;
  
  try {
    // 1. Teste de requisição OPTIONS (preflight)
    console.log('1️⃣ Testando requisição OPTIONS (preflight)...');
    const optionsResponse = await fetch(edgeUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type'
      }
    });
    
    console.log(`Status OPTIONS: ${optionsResponse.status}`);
    console.log('Headers CORS recebidos:');
    console.log('  Access-Control-Allow-Origin:', optionsResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('  Access-Control-Allow-Methods:', optionsResponse.headers.get('Access-Control-Allow-Methods'));
    console.log('  Access-Control-Allow-Headers:', optionsResponse.headers.get('Access-Control-Allow-Headers'));
    console.log('  Access-Control-Max-Age:', optionsResponse.headers.get('Access-Control-Max-Age'));
    console.log();
    
    // 2. Teste de requisição POST real
    console.log('2️⃣ Testando requisição POST real...');
    const postResponse = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        type: 'projetos',
        filters: {}
      })
    });
    
    console.log(`Status POST: ${postResponse.status}`);
    console.log('Headers CORS na resposta POST:');
    console.log('  Access-Control-Allow-Origin:', postResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('  Access-Control-Allow-Headers:', postResponse.headers.get('Access-Control-Allow-Headers'));
    console.log();
    
    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log('✅ Resposta POST bem-sucedida');
      console.log(`Dados recebidos: ${data.data ? data.data.length : 0} itens`);
    } else {
      console.log('❌ Erro na resposta POST');
      const errorText = await postResponse.text();
      console.log('Erro:', errorText);
    }
    
    // 3. Teste de health check
    console.log('\n3️⃣ Testando health check...');
    const healthResponse = await fetch(`${edgeUrl}/health`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log(`Status Health: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check OK:', healthData.status);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste CORS:', error.message);
    
    // Verificar se é erro de rede
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Possíveis causas:');
      console.log('- Problema de conectividade de rede');
      console.log('- URL do Supabase incorreta');
      console.log('- Edge Function não está deployada');
    }
  }
}

// Executar teste
testCorsDebug().catch(console.error);