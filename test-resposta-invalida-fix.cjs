const https = require('https');

// Configuração da Edge Function
const SUPABASE_URL = 'https://app-financeiro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwcC1maW5hbmNlaXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyNzE5NzQsImV4cCI6MjA0Mjg0Nzk3NH0.Aw8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'app-financeiro.supabase.co',
      port: 443,
      path: path,
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
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonResponse
          });
        } catch (error) {
          console.error('Erro ao parsear JSON:', error);
          console.log('Resposta raw:', responseData);
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

async function testProjectsResponse() {
  console.log('\n=== TESTE: Validação da estrutura de resposta para projetos ===');
  
  try {
    const response = await makeRequest('/functions/v1/financial-data-unified', {
      type: 'projetos',
      filters: {}
    });

    console.log('Status:', response.status);
    console.log('Estrutura da resposta:', {
      success: response.data.success,
      type: response.data.type,
      dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
      dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
      count: response.data.count,
      hasFilters: !!response.data.filters
    });

    // Validar estrutura esperada pelo frontend
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ Estrutura válida para projetos');
      console.log('Primeiros 5 projetos:', response.data.data.slice(0, 5));
    } else {
      console.log('❌ Estrutura inválida para projetos');
      console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro no teste de projetos:', error.message);
  }
}

async function testYearsResponse() {
  console.log('\n=== TESTE: Validação da estrutura de resposta para anos ===');
  
  try {
    const response = await makeRequest('/functions/v1/financial-data-unified', {
      type: 'anos',
      filters: {}
    });

    console.log('Status:', response.status);
    console.log('Estrutura da resposta:', {
      success: response.data.success,
      type: response.data.type,
      dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
      dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
      count: response.data.count,
      hasFilters: !!response.data.filters
    });

    // Validar estrutura esperada pelo frontend
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ Estrutura válida para anos');
      console.log('Anos disponíveis:', response.data.data);
    } else {
      console.log('❌ Estrutura inválida para anos');
      console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro no teste de anos:', error.message);
  }
}

async function testDashboardResponse() {
  console.log('\n=== TESTE: Validação da estrutura de resposta para dashboard ===');
  
  try {
    const response = await makeRequest('/functions/v1/financial-data-unified', {
      type: 'dashboard',
      filters: {
        ano: 2024,
        projeto: 'NCPVIA068.1 - OGS - PORTAL 2017'
      }
    });

    console.log('Status:', response.status);
    console.log('Estrutura da resposta:', {
      success: response.data.success,
      type: response.data.type,
      dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
      dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
      count: response.data.count,
      hasFilters: !!response.data.filters
    });

    // Validar estrutura esperada pelo frontend
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ Estrutura válida para dashboard');
      console.log('Primeiro item:', response.data.data[0]);
    } else {
      console.log('❌ Estrutura inválida para dashboard');
      console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro no teste de dashboard:', error.message);
  }
}

async function runAllTests() {
  console.log('🔍 Iniciando testes de validação da estrutura de resposta...\n');
  
  await testProjectsResponse();
  await testYearsResponse();
  await testDashboardResponse();
  
  console.log('\n✅ Todos os testes concluídos!');
}

runAllTests().catch(console.error);