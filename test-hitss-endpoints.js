const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Desabilitar verificação SSL globalmente para Node.js
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Função para buscar segredos do Vault
async function getVaultSecret(secretName) {
  try {
    const { data, error } = await supabase.rpc('get_secret', { secret_name: secretName });
    
    if (error) {
      console.error(`❌ Erro ao buscar segredo ${secretName}:`, error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error(`❌ Erro ao acessar Vault para ${secretName}:`, err);
    return null;
  }
}

async function testHitssEndpoints() {
  console.log('🔍 Testando endpoints da API HITSS...');
  console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
  
  try {
    console.log('\n🔐 Buscando credenciais do Vault...');
    
    // Buscar credenciais do Vault
    const username = await getVaultSecret('hitss_username');
    const password = await getVaultSecret('hitss_password');
    const baseUrl = await getVaultSecret('hitss_base_url');
    
    if (!username || !password || !baseUrl) {
      console.error('❌ Erro: Não foi possível obter todas as credenciais do Vault');
      return false;
    }
    
    console.log('✅ Credenciais obtidas do Vault');
    console.log('📋 Base URL:', baseUrl);
    
    // Testar diferentes endpoints de exportação
    const exportEndpoints = [
      '/api/export/xls',
      '/api/api/export/xls',
      '/export/xls',
      '/api/export',
      '/api/reports/export',
      '/api/data/export',
      '/api/v1/export/xls',
      '/api/v2/export/xls'
    ];
    
    const authString = Buffer.from(`${username}:${password}`).toString('base64');
    
    for (const endpoint of exportEndpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      console.log(`\n🔗 Testando: ${fullUrl}`);
      
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
          },
          timeout: 10000
        });
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type') || 'N/A'}`);
        console.log(`📏 Content-Length: ${response.headers.get('content-length') || 'N/A'}`);
        
        if (response.status === 200) {
          console.log('✅ Endpoint funcionando!');
          
          // Verificar se é realmente um arquivo Excel
          const contentType = response.headers.get('content-type');
          if (contentType && (contentType.includes('excel') || contentType.includes('spreadsheet'))) {
            console.log('🎯 Arquivo Excel detectado!');
          }
          
        } else if (response.status === 400) {
          console.log('⚠️ Bad Request - pode precisar de parâmetros');
        } else if (response.status === 401) {
          console.log('🔒 Unauthorized - problema de autenticação');
        } else if (response.status === 404) {
          console.log('❌ Not Found - endpoint não existe');
        } else {
          console.log(`⚠️ Status: ${response.status}`);
        }
        
      } catch (fetchError) {
        console.log(`❌ Erro: ${fetchError.message}`);
      }
    }
    
    // Testar com parâmetros de data
    console.log('\n🗓️ Testando endpoints com parâmetros de data...');
    
    const endpointsWithParams = [
      '/api/export/xls?startDate=2025-01-01&endDate=2025-01-31',
      '/api/api/export/xls?startDate=2025-01-01&endDate=2025-01-31',
      '/api/export/xls?from=2025-01-01&to=2025-01-31',
      '/api/export?format=xls&startDate=2025-01-01&endDate=2025-01-31'
    ];
    
    for (const endpoint of endpointsWithParams) {
      const fullUrl = `${baseUrl}${endpoint}`;
      console.log(`\n🔗 Testando com parâmetros: ${fullUrl}`);
      
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
          },
          timeout: 15000
        });
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 200) {
          console.log('✅ Endpoint com parâmetros funcionando!');
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            console.log(`📏 Tamanho do arquivo: ${contentLength} bytes`);
          }
        }
        
      } catch (fetchError) {
        console.log(`❌ Erro: ${fetchError.message}`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar teste
testHitssEndpoints()
  .then(() => {
    console.log('\n🎉 Teste de endpoints concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });