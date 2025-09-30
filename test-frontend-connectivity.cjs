const fetch = require('node-fetch');

// Configurações do Supabase
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testFrontendConnectivity() {
  console.log('🔍 Testando conectividade do frontend com Edge Function...\n');
  
  // Simular exatamente como o frontend faz a chamada
  const baseUrl = `${SUPABASE_URL}/functions/v1`;
  const endpoint = 'financial-data-unified';
  const fullUrl = `${baseUrl}/${endpoint}`;
  
  console.log('📍 URL completa:', fullUrl);
  console.log('🔑 Chave anônima:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  try {
    // Teste 1: Verificar se a URL está acessível
    console.log('\n1️⃣ Testando conectividade básica...');
    const basicResponse = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ type: 'projetos' })
    });
    
    console.log('Status:', basicResponse.status);
    console.log('Status Text:', basicResponse.statusText);
    console.log('Headers:', Object.fromEntries(basicResponse.headers.entries()));
    
    if (!basicResponse.ok) {
      const errorText = await basicResponse.text();
      console.log('❌ Erro na resposta:', errorText);
      return;
    }
    
    const data = await basicResponse.json();
    console.log('✅ Resposta recebida:', {
      success: data.success,
      dataLength: Array.isArray(data.data) ? data.data.length : 'não é array',
      error: data.error
    });
    
    // Teste 2: Verificar CORS
    console.log('\n2️⃣ Testando headers CORS...');
    const corsHeaders = {
      'Access-Control-Allow-Origin': basicResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': basicResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': basicResponse.headers.get('Access-Control-Allow-Headers')
    };
    console.log('CORS Headers:', corsHeaders);
    
    // Teste 3: Simular requisição OPTIONS (preflight)
    console.log('\n3️⃣ Testando requisição OPTIONS (preflight)...');
    const optionsResponse = await fetch(fullUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    console.log('OPTIONS Status:', optionsResponse.status);
    console.log('OPTIONS Headers:', Object.fromEntries(optionsResponse.headers.entries()));
    
  } catch (error) {
    console.error('❌ Erro de conectividade:', error.message);
    console.error('Tipo do erro:', error.constructor.name);
    
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    
    if (error.cause) {
      console.error('Causa do erro:', error.cause);
    }
  }
}

// Executar teste
testFrontendConnectivity();