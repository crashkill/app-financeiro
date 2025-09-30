const https = require('https');

// Configurações
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
const FILE_NAME = 'dre_hitss_1758743010309.xlsx';

async function callProcessDreUpload() {
  console.log('=== Chamando Edge Function process-dre-upload ===');
  console.log(`Arquivo: ${FILE_NAME}`);
  
  const payload = {
    record: {
      bucket_id: 'dre_reports',
      name: FILE_NAME
    }
  };
  
  const data = JSON.stringify(payload);
  
  const options = {
    hostname: 'oomhhhfahdvavnhlbioa.supabase.co',
    port: 443,
    path: '/functions/v1/process-dre-upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Resposta:', responseData);
        
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve(jsonResponse);
        } catch (error) {
          console.log('Resposta não é JSON válido:', responseData);
          resolve({ rawResponse: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Erro na requisição:', error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Executar
callProcessDreUpload()
  .then((response) => {
    console.log('\n=== Processamento concluído ===');
    if (response.message && response.message.includes('registros inseridos')) {
      console.log('✅ Dados inseridos com sucesso!');
    } else {
      console.log('⚠️ Resposta inesperada:', response);
    }
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });