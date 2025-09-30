const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVaultAccess() {
  console.log('🔐 Testando acesso ao Vault...');
  
  try {
    // Testar a função get_secret
    console.log('\n📋 Testando função get_secret...');
    
    const secretNames = ['hitss_username', 'hitss_password', 'hitss_base_url'];
    
    for (const secretName of secretNames) {
      console.log(`\n🔍 Buscando segredo: ${secretName}`);
      
      const { data, error } = await supabase
        .rpc('get_secret', { secret_name: secretName });
      
      if (error) {
        console.error(`❌ Erro ao buscar ${secretName}:`, error);
      } else {
        console.log(`✅ ${secretName}: ${data ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
        if (data) {
          console.log(`   Valor: ${data.substring(0, 5)}...`);
        }
      }
    }
    
    // Testar acesso direto à view vault.decrypted_secrets
    console.log('\n📋 Testando acesso direto à view vault.decrypted_secrets...');
    
    const { data: secrets, error: viewError } = await supabase
      .from('vault.decrypted_secrets')
      .select('name, decrypted_secret')
      .in('name', secretNames);
    
    if (viewError) {
      console.error('❌ Erro ao acessar view vault.decrypted_secrets:', viewError);
    } else {
      console.log('✅ Acesso à view bem-sucedido');
      console.log('📊 Segredos encontrados:', secrets?.length || 0);
      secrets?.forEach(secret => {
        console.log(`   - ${secret.name}: ${secret.decrypted_secret?.substring(0, 5)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testVaultAccess();