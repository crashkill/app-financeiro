const https = require('https');

// Configuração do Supabase
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testProjectsEdgeFunction() {
  console.log('🔍 Testando Edge Function para projetos...');
  
  const url = `${SUPABASE_URL}/functions/v1/financial-data-unified`;
  const data = JSON.stringify({
    type: 'projetos'
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('✅ Resposta completa da Edge Function:');
          console.log(JSON.stringify(result, null, 2));
          
          if (result.data && Array.isArray(result.data)) {
            console.log(`\n📊 Total de projetos retornados: ${result.data.length}`);
            console.log('📋 Primeiros 10 projetos:');
            result.data.slice(0, 10).forEach((projeto, index) => {
              console.log(`  ${index + 1}. ${projeto}`);
            });
            
            if (result.data.length > 10) {
              console.log(`  ... e mais ${result.data.length - 10} projetos`);
            }
          }
          
          resolve(result);
        } catch (error) {
          console.error('❌ Erro ao parsear resposta:', error);
          console.log('📄 Resposta raw:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testYearsEdgeFunction() {
  console.log('\n📅 Testando Edge Function para anos...');
  
  const url = `${SUPABASE_URL}/functions/v1/financial-data-unified`;
  const data = JSON.stringify({
    type: 'anos'
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('✅ Resposta completa da Edge Function:');
          console.log(JSON.stringify(result, null, 2));
          
          if (result.data && Array.isArray(result.data)) {
            console.log(`\n📊 Total de anos retornados: ${result.data.length}`);
            console.log('📋 Anos encontrados:', result.data);
          }
          
          resolve(result);
        } catch (error) {
          console.error('❌ Erro ao parsear resposta:', error);
          console.log('📄 Resposta raw:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    await testProjectsEdgeFunction();
    await testYearsEdgeFunction();
    console.log('\n🏁 Teste concluído!');
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

main();