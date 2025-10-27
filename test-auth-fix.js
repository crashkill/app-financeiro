// Teste da correção de autenticação na Edge Function gestao-profissionais

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MzE1NzQsImV4cCI6MjA1MDIwNzU3NH0.Ej8Ej_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testEdgeFunction() {
  console.log('🧪 Testando Edge Function gestao-profissionais...\n');
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`;
    
    console.log('📡 Fazendo requisição para:', url);
    console.log('🔑 Usando chave anônima como Bearer token\n');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso! Dados recebidos:');
      console.log('📋 Número de colaboradores:', data.data?.length || 0);
      console.log('📋 Estrutura da resposta:', {
        success: data.success,
        message: data.message,
        dataLength: data.data?.length
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na resposta:');
      console.log('📋 Corpo da resposta:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }
}

testEdgeFunction();