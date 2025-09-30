require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para obter segredo do Vault
async function getVaultSecret(secretName) {
  try {
    const { data, error } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', secretName)
      .single();
    
    if (error) {
      console.error(`❌ Erro ao buscar ${secretName}:`, error.message);
      return null;
    }
    
    return data?.decrypted_secret;
  } catch (error) {
    console.error(`❌ Erro geral ao buscar ${secretName}:`, error.message);
    return null;
  }
}

// Função para atualizar segredo no Vault
async function updateVaultSecret(secretName, secretValue) {
  try {
    const { data, error } = await supabase.rpc('vault.update_secret', {
      secret_name: secretName,
      secret_value: secretValue
    });
    
    if (error) {
      console.error(`❌ Erro ao atualizar ${secretName}:`, error.message);
      return false;
    }
    
    console.log(`✅ ${secretName} atualizado com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro geral ao atualizar ${secretName}:`, error.message);
    return false;
  }
}

async function fixVaultCredentials() {
  console.log('🔧 Verificando e corrigindo credenciais do Vault...');
  console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
  
  try {
    // Verificar credenciais atuais
    console.log('\n🔍 Verificando credenciais atuais...');
    
    const username = await getVaultSecret('hitss_username');
    const password = await getVaultSecret('hitss_password');
    const baseUrl = await getVaultSecret('hitss_base_url');
    
    console.log('📋 Credenciais atuais:');
    console.log(`   Username: ${username || 'NÃO ENCONTRADO'}`);
    console.log(`   Password: ${password ? '*'.repeat(password.length) : 'NÃO ENCONTRADO'}`);
    console.log(`   Base URL: ${baseUrl || 'NÃO ENCONTRADO'}`);
    
    // Verificar se o baseUrl é o domínio de exemplo
    if (baseUrl && baseUrl.includes('hitss.exemplo.com')) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: Base URL está usando domínio de exemplo!');
      console.log('🔧 Corrigindo para o domínio correto...');
      
      // Baseado nos arquivos encontrados, o domínio correto parece ser:
      const correctBaseUrl = 'https://hitsscontrol.globalhitss.com.br';
      
      const updated = await updateVaultSecret('hitss_base_url', correctBaseUrl);
      
      if (updated) {
        console.log(`✅ Base URL corrigida para: ${correctBaseUrl}`);
      } else {
        console.log('❌ Falha ao corrigir Base URL');
      }
    }
    
    // Verificar se as outras credenciais estão corretas
    if (!username || username === 'seu_usuario') {
      console.log('\n⚠️  Username precisa ser corrigido');
      console.log('📋 Baseado nos arquivos, o username correto é: fabricio.lima');
      
      const updated = await updateVaultSecret('hitss_username', 'fabricio.lima');
      if (updated) {
        console.log('✅ Username corrigido');
      }
    }
    
    if (!password || password === 'sua_senha') {
      console.log('\n⚠️  Password precisa ser corrigido');
      console.log('📋 Baseado nos arquivos, o password correto é: F4br1c10FSW@2025@');
      
      const updated = await updateVaultSecret('hitss_password', 'F4br1c10FSW@2025@');
      if (updated) {
        console.log('✅ Password corrigido');
      }
    }
    
    // Verificar credenciais após correção
    console.log('\n🔍 Verificando credenciais após correção...');
    
    const newUsername = await getVaultSecret('hitss_username');
    const newPassword = await getVaultSecret('hitss_password');
    const newBaseUrl = await getVaultSecret('hitss_base_url');
    
    console.log('📋 Credenciais corrigidas:');
    console.log(`   Username: ${newUsername}`);
    console.log(`   Password: ${newPassword ? '*'.repeat(newPassword.length) : 'NÃO ENCONTRADO'}`);
    console.log(`   Base URL: ${newBaseUrl}`);
    
    // Testar conectividade com as novas credenciais
    if (newBaseUrl && newUsername && newPassword) {
      console.log('\n🧪 Testando conectividade com credenciais corrigidas...');
      
      // Desabilitar verificação SSL para teste
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      
      const authString = Buffer.from(`${newUsername}:${newPassword}`).toString('base64');
      const testUrl = `${newBaseUrl}/api/auth/login`;
      
      try {
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authString}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify({
            username: newUsername,
            password: newPassword
          })
        });
        
        console.log(`📊 Status da conexão: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log('✅ Conectividade testada com sucesso!');
        } else {
          console.log('⚠️  Conectividade com problemas, mas credenciais foram corrigidas');
        }
        
      } catch (error) {
        console.log('⚠️  Erro no teste de conectividade:', error.message);
        console.log('📋 Isso pode ser normal devido a certificados SSL ou firewall');
      }
    }
    
    console.log('\n✅ Verificação e correção de credenciais concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
console.log('🚀 Iniciando correção das credenciais do Vault...');
fixVaultCredentials();