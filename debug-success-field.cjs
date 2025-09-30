const https = require('https');

// Configuração da Edge Function
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'oomhhhfahdvavnhlbioa.supabase.co',
      port: 443,
      path: '/functions/v1/financial-data-unified',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Status HTTP:', res.statusCode);
        console.log('Headers de resposta:', res.headers);
        console.log('Resposta raw (primeiros 500 chars):', responseData.substring(0, 500));
        
        try {
          const jsonResponse = JSON.parse(responseData);
          console.log('JSON parseado com sucesso!');
          console.log('Chaves do objeto:', Object.keys(jsonResponse));
          console.log('Campo success:', jsonResponse.success);
          console.log('Tipo do campo success:', typeof jsonResponse.success);
          console.log('Objeto completo:', JSON.stringify(jsonResponse, null, 2));
          
          resolve({
            status: res.statusCode,
            data: jsonResponse
          });
        } catch (error) {
          console.error('Erro ao parsear JSON:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testSuccessField() {
  console.log('🔍 Testando se o campo success está sendo retornado...\n');
  
  try {
    const response = await makeRequest({
      type: 'projetos',
      filters: {}
    });

    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testSuccessField();