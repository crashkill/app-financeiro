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

async function analyzeHitssError() {
  console.log('🔍 Analisando erro do endpoint HITSS...');
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
    
    const authString = Buffer.from(`${username}:${password}`).toString('base64');
    const endpoint = `${baseUrl}/api/api/export/xls`;
    
    console.log(`\n🔗 Analisando endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*'
        },
        timeout: 10000
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type') || 'N/A'}`);
      console.log(`📏 Content-Length: ${response.headers.get('content-length') || 'N/A'}`);
      
      // Ler a resposta como texto
      const responseText = await response.text();
      console.log(`📄 Resposta: ${responseText}`);
      
      // Tentar parsear como JSON
      try {
        const responseJson = JSON.parse(responseText);
        console.log('📋 JSON parseado:', JSON.stringify(responseJson, null, 2));
      } catch (jsonError) {
        console.log('⚠️ Resposta não é JSON válido');
      }
      
    } catch (fetchError) {
      console.log(`❌ Erro no fetch: ${fetchError.message}`);
    }
    
    // Testar diferentes combinações de parâmetros
    console.log('\n🧪 Testando diferentes parâmetros...');
    
    const paramCombinations = [
      '',
      '?startDate=2025-01-01&endDate=2025-01-31',
      '?from=2025-01-01&to=2025-01-31',
      '?dateStart=2025-01-01&dateEnd=2025-01-31',
      '?start=2025-01-01&end=2025-01-31',
      '?projectIds=all',
      '?projectIds=all&startDate=2025-01-01&endDate=2025-01-31',
      '?projectIds=all&startDate=2025-01-01&endDate=2025-01-31&includeSubprojects=true',
      '?projectIds=all&startDate=2025-01-01&endDate=2025-01-31&includeSubprojects=false',
      '?format=xls&startDate=2025-01-01&endDate=2025-01-31'
    ];
    
    for (const params of paramCombinations) {
      const testUrl = `${endpoint}${params}`;
      console.log(`\n🔗 Testando: ${testUrl}`);
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,*/*'
          },
          timeout: 15000
        });
        
        console.log(`📊 Status: ${response.status}`);
        
        if (response.status === 200) {
          console.log('✅ Sucesso!');
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          console.log(`📋 Content-Type: ${contentType}`);
          console.log(`📏 Content-Length: ${contentLength} bytes`);
          
          if (contentType && contentType.includes('spreadsheet')) {
            console.log('🎯 Arquivo Excel detectado!');
          }
          
          break; // Parar no primeiro sucesso
        } else if (response.status !== 400) {
          console.log(`⚠️ Status diferente: ${response.status}`);
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
analyzeHitssError()
  .then(() => {
    console.log('\n🎉 Análise concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });