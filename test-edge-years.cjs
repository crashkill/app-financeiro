const fetch = require('node-fetch');

async function testEdgeYears() {
  try {
    console.log('🔍 Testando anos únicos na Edge Function...\n');
    
    const response = await fetch('https://oomhhhfahdvavnhlbioa.supabase.co/functions/v1/financial-data-unified?type=anos', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 Resposta completa da Edge Function:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.anos) {
      console.log('\n✅ Anos únicos encontrados:');
      console.log(`Total: ${data.data.count}`);
      console.log('Anos:', data.data.anos);
    } else {
      console.log('❌ Estrutura de dados inesperada');
    }

  } catch (error) {
    console.error('❌ Erro ao testar Edge Function:', error);
  }
}

testEdgeYears();