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

// Teste dos segredos HITSS
async function testHitssVaultSecrets() {
  try {
    console.log('🔐 Testando acesso aos segredos HITSS no Vault...');
    console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
    
    // Lista de segredos necessários
    const requiredSecrets = ['hitss_username', 'hitss_password', 'hitss_base_url'];
    const secrets = {};
    
    // Buscar cada segredo
    for (const secretName of requiredSecrets) {
      console.log(`\n🔍 Buscando segredo: ${secretName}`);
      
      const secretValue = await getVaultSecret(secretName);
      
      if (secretValue) {
        secrets[secretName] = secretValue;
        console.log(`✅ ${secretName}: ENCONTRADO`);
        
        // Mostrar apenas os primeiros caracteres para segurança
        if (secretName === 'hitss_base_url') {
          console.log(`   Valor: ${secretValue}`);
        } else {
          const maskedValue = secretValue.substring(0, 4) + '...';
          console.log(`   Valor: ${maskedValue}`);
        }
      } else {
        console.log(`❌ ${secretName}: NÃO ENCONTRADO`);
        return false;
      }
    }
    
    console.log('\n🎉 Todos os segredos HITSS foram encontrados no Vault!');
    
    // Teste de construção da URL
    console.log('\n🔗 Testando construção da URL de download...');
    const downloadUrl = `${secrets.hitss_base_url}/api/api/export/xls?startDate=2025-01-01&endDate=2025-01-31&projectIds=all&includeSubprojects=true`;
    console.log(`📋 URL construída: ${downloadUrl}`);
    
    // Teste de autenticação básica
    console.log('\n🔑 Testando geração de autenticação básica...');
    const authString = Buffer.from(`${secrets.hitss_username}:${secrets.hitss_password}`).toString('base64');
    const maskedAuth = authString.substring(0, 8) + '...';
    console.log(`🔐 Auth string gerada: ${maskedAuth}`);
    
    console.log('\n✅ Teste do Vault HITSS concluído com sucesso!');
    console.log('🚀 O script de automação está pronto para usar os segredos do Vault.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Erro no teste do Vault HITSS:', error.message);
    return false;
  }
}

// Executar teste
if (require.main === module) {
  testHitssVaultSecrets().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testHitssVaultSecrets, getVaultSecret };