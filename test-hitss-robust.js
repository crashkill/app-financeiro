const { createClient } = require('@supabase/supabase-js');
const https = require('https');
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

async function testHitssConnection() {
  console.log('🔍 Teste robusto de conexão com API HITSS...');
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
    
    // Testar diferentes endpoints
    const endpoints = [
      baseUrl,
      `${baseUrl}/`,
      `${baseUrl}/api`,
      `${baseUrl}/api/`,
      `${baseUrl}/api/export`,
      `${baseUrl}/api/export/xls`
    ];
    
    const authString = Buffer.from(`${username}:${password}`).toString('base64');
    
    for (const endpoint of endpoints) {
      console.log(`\n🔗 Testando endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Connection': 'keep-alive'
          },
          timeout: 15000
        });
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type') || 'N/A'}`);
        
        if (response.ok) {
          console.log('✅ Conexão bem-sucedida!');
          
          // Tentar ler uma pequena parte da resposta
          try {
            const text = await response.text();
            console.log(`📄 Tamanho da resposta: ${text.length} caracteres`);
            console.log(`📝 Primeiros 200 caracteres: ${text.substring(0, 200)}...`);
          } catch (readError) {
            console.log('⚠️ Não foi possível ler o conteúdo da resposta');
          }
          
          return true;
        } else {
          console.log(`⚠️ Status não OK: ${response.status}`);
        }
        
      } catch (fetchError) {
        console.log(`❌ Erro no fetch: ${fetchError.message}`);
      }
    }
    
    console.log('\n📊 Resultado final: Nenhum endpoint respondeu com sucesso');
    return false;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar teste
testHitssConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Teste concluído com sucesso!');
      process.exit(0);
    } else {
      console.log('\n❌ Teste falhou');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });