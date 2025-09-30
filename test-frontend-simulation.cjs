const https = require('https');

// Configuração da Edge Function
const SUPABASE_URL = 'https://app-financeiro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Simular exatamente como o frontend faz a chamada
async function callUnifiedFunction(type, filters = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ type, filters });
    
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
        try {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            return;
          }

          const jsonResponse = JSON.parse(responseData);
          
          console.log('Resposta recebida:', JSON.stringify(jsonResponse, null, 2));
          
          // Simular exatamente a validação do frontend
          if (!jsonResponse || !jsonResponse.success) {
            console.log('Validação falhou:', {
              hasResponse: !!jsonResponse,
              hasSuccess: jsonResponse ? !!jsonResponse.success : false,
              successValue: jsonResponse ? jsonResponse.success : undefined
            });
            reject(new Error('Edge Function retornou erro: Resposta inválida'));
            return;
          }

          resolve(jsonResponse);
        } catch (error) {
          console.error('Erro ao parsear JSON:', error);
          console.log('Resposta raw:', responseData);
          reject(new Error('Edge Function retornou erro: Resposta inválida'));
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

// Simular getAvailableProjects
async function testGetAvailableProjects() {
  console.log('\n=== TESTE: getAvailableProjects() ===');
  
  try {
    const response = await callUnifiedFunction('projetos', {});
    
    console.log('✅ Chamada bem-sucedida!');
    console.log('Estrutura da resposta:', {
      success: response.success,
      type: response.type,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });

    // Aplicar a lógica corrigida do frontend
    if (response && response.data && Array.isArray(response.data)) {
      const sortedProjects = response.data.sort();
      console.log('✅ Projetos processados com sucesso!');
      console.log(`Total de projetos: ${sortedProjects.length}`);
      console.log('Primeiros 5 projetos:', sortedProjects.slice(0, 5));
      return sortedProjects;
    } else {
      throw new Error('Resposta inválida da Edge Function');
    }

  } catch (error) {
    console.error('❌ Erro em getAvailableProjects:', error.message);
    return null;
  }
}

// Simular getAvailableYears
async function testGetAvailableYears() {
  console.log('\n=== TESTE: getAvailableYears() ===');
  
  try {
    const response = await callUnifiedFunction('anos', {});
    
    console.log('✅ Chamada bem-sucedida!');
    console.log('Estrutura da resposta:', {
      success: response.success,
      type: response.type,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });

    // Aplicar a lógica corrigida do frontend
    if (response && response.data && Array.isArray(response.data)) {
      const sortedYears = response.data.sort((a, b) => b - a);
      console.log('✅ Anos processados com sucesso!');
      console.log(`Total de anos: ${sortedYears.length}`);
      console.log('Anos disponíveis:', sortedYears);
      return sortedYears;
    } else {
      throw new Error('Resposta inválida da Edge Function');
    }

  } catch (error) {
    console.error('❌ Erro em getAvailableYears:', error.message);
    return null;
  }
}

// Simular getDashboardData
async function testGetDashboardData() {
  console.log('\n=== TESTE: getDashboardData() ===');
  
  try {
    const filters = {
      ano: 2024,
      projeto: 'NCPVIA068.1 - OGS - PORTAL 2017'
    };
    
    const response = await callUnifiedFunction('dashboard', filters);
    
    console.log('✅ Chamada bem-sucedida!');
    console.log('Estrutura da resposta:', {
      success: response.success,
      type: response.type,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });

    // Aplicar a lógica do frontend
    if (response && response.data && Array.isArray(response.data)) {
      console.log('✅ Dashboard processado com sucesso!');
      console.log(`Total de itens: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log('Primeiro item:', response.data[0]);
      }
      return response.data;
    } else {
      throw new Error('Resposta inválida da Edge Function');
    }

  } catch (error) {
    console.error('❌ Erro em getDashboardData:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🔍 Simulando exatamente como o frontend chama as Edge Functions...\n');
  
  const projects = await testGetAvailableProjects();
  const years = await testGetAvailableYears();
  const dashboard = await testGetDashboardData();
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log(`- Projetos: ${projects ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`- Anos: ${years ? '✅ Sucesso' : '❌ Falha'}`);
  console.log(`- Dashboard: ${dashboard ? '✅ Sucesso' : '❌ Falha'}`);
  
  if (projects && years && dashboard) {
    console.log('\n🎉 Todas as correções funcionaram! O problema de "Resposta inválida" foi resolvido.');
  } else {
    console.log('\n⚠️ Ainda há problemas que precisam ser investigados.');
  }
}

runAllTests().catch(console.error);