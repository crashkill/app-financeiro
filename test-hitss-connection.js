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

// Agente HTTPS para ignorar certificados SSL
const agent = new https.Agent({
  rejectUnauthorized: false
});

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

// Teste detalhado de conexão
async function testHitssConnection() {
  try {
    console.log('🔍 Testando conexão com API HITSS...');
    console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
    
    // 1. Buscar credenciais do Vault
    console.log('\n🔐 Buscando credenciais do Vault...');
    const username = await getVaultSecret('hitss_username');
    const password = await getVaultSecret('hitss_password');
    const baseUrl = await getVaultSecret('hitss_base_url');
    
    if (!username || !password || !baseUrl) {
      throw new Error('Credenciais não encontradas no Vault');
    }
    
    console.log('✅ Credenciais obtidas do Vault');
    console.log(`📋 Base URL: ${baseUrl}`);
    
    // 2. Testar conectividade básica
    console.log('\n🌐 Testando conectividade básica...');
    
    try {
      const testUrl = new URL(baseUrl);
      console.log(`🔗 Host: ${testUrl.hostname}`);
      console.log(`🔗 Protocolo: ${testUrl.protocol}`);
      console.log(`🔗 Porta: ${testUrl.port || (testUrl.protocol === 'https:' ? '443' : '80')}`);
    } catch (urlError) {
      console.error('❌ URL inválida:', urlError.message);
      return false;
    }
    
    // 3. Teste de ping/conectividade
    console.log('\n📡 Testando conectividade HTTP...');
    
    const authString = Buffer.from(`${username}:${password}`).toString('base64');
    
    // Criar agent HTTPS personalizado para ignorar certificados auto-assinados
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    });
    
    // Primeiro, testar apenas a página principal
    try {
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        agent: httpsAgent
      });
      
      console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
      console.log(`📋 Headers de resposta:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('✅ Conectividade básica funcionando');
      } else {
        console.log('⚠️ Resposta não OK, mas conexão estabelecida');
      }
      
    } catch (fetchError) {
      console.error('❌ Erro na conectividade HTTP:', fetchError.message);
      console.error('📋 Detalhes do erro:', fetchError);
      
      // Verificar tipos específicos de erro
      if (fetchError.code === 'ENOTFOUND') {
        console.error('🔍 DNS não resolveu o hostname');
      } else if (fetchError.code === 'ECONNREFUSED') {
        console.error('🔍 Conexão recusada pelo servidor');
      } else if (fetchError.code === 'ETIMEDOUT') {
        console.error('🔍 Timeout na conexão');
      } else if (fetchError.code === 'CERT_HAS_EXPIRED') {
        console.error('🔍 Certificado SSL expirado');
      }
      
      return false;
    }
    
    // 4. Testar endpoint específico de export
    console.log('\n📥 Testando endpoint de export...');
    
    const exportUrl = `${baseUrl}/api/api/export/xls?startDate=2025-01-01&endDate=2025-01-31&projectIds=all&includeSubprojects=true`;
    console.log(`🔗 URL de export: ${exportUrl}`);
    
    try {
      const exportResponse = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
        },
        agent: agent,
        timeout: 30000
      });
      
      console.log(`📊 Status do export: ${exportResponse.status} ${exportResponse.statusText}`);
      console.log(`📋 Content-Type: ${exportResponse.headers.get('content-type')}`);
      console.log(`📋 Content-Length: ${exportResponse.headers.get('content-length')}`);
      
      if (exportResponse.ok) {
        console.log('✅ Endpoint de export acessível');
        
        // Verificar se é realmente um arquivo Excel
        const contentType = exportResponse.headers.get('content-type');
        if (contentType && (contentType.includes('excel') || contentType.includes('spreadsheet'))) {
          console.log('✅ Resposta parece ser um arquivo Excel válido');
        } else {
          console.log(`⚠️ Content-Type inesperado: ${contentType}`);
        }
        
      } else {
        console.log('❌ Endpoint de export retornou erro');
        
        // Tentar ler o corpo da resposta para mais detalhes
        try {
          const errorText = await exportResponse.text();
          console.log('📋 Corpo da resposta de erro:', errorText.substring(0, 500));
        } catch (readError) {
          console.log('❌ Não foi possível ler o corpo da resposta de erro');
        }
      }
      
    } catch (exportError) {
      console.error('❌ Erro no endpoint de export:', exportError.message);
      return false;
    }
    
    console.log('\n🎉 Teste de conexão concluído!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Erro geral no teste:', error.message);
    return false;
  }
}

// Executar teste
if (require.main === module) {
  testHitssConnection().then(success => {
    console.log(`\n📊 Resultado final: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testHitssConnection };