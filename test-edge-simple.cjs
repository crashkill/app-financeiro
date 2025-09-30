const fetch = require('node-fetch');

async function testSimpleQuery() {
  console.log('🔍 Testando consulta simples...');
  
  try {
    const response = await fetch('https://oomhhhfahdvavnhlbioa.supabase.co/functions/v1/financial-data-unified?type=projetos', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8',
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📊 Response Text:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Sucesso!');
      console.log('📊 Dados:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Erro HTTP:', response.status);
      console.log('📊 Erro detalhado:', JSON.parse(responseText));
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testSimpleQuery();