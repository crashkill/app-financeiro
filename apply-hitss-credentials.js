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

async function applyHITSSCredentials() {
  try {
    console.log('🔐 Aplicando credenciais HITSS no Vault...');
    
    // Credenciais HITSS conforme a migração
    const credentials = [
      {
        name: 'hitss_base_url',
        secret: 'https://hitsscontrol.globalhitss.com.br/',
        description: 'URL base da plataforma HITSS Control'
      },
      {
        name: 'hitss_username',
        secret: 'fabricio.lima',
        description: 'Username para login na HITSS'
      },
      {
        name: 'hitss_password',
        secret: 'F4br1c10FSW@2025@',
        description: 'Senha para login na HITSS'
      }
    ];
    
    console.log('📝 Inserindo credenciais no Vault...');
    
    for (const credential of credentials) {
      try {
        // Tentar criar o segredo usando a função vault.create_secret
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `SELECT vault.create_secret('${credential.secret}', '${credential.name}', '${credential.description}');`
        });
        
        if (error) {
          console.log(`⚠️ Erro ao inserir ${credential.name} (pode já existir):`, error.message);
          
          // Tentar atualizar se já existir
          const { data: updateData, error: updateError } = await supabase.rpc('exec_sql', {
            sql: `SELECT vault.update_secret('${credential.name}', '${credential.secret}');`
          });
          
          if (updateError) {
            console.log(`❌ Erro ao atualizar ${credential.name}:`, updateError.message);
          } else {
            console.log(`✅ Segredo ${credential.name} atualizado com sucesso`);
          }
        } else {
          console.log(`✅ Segredo ${credential.name} criado com sucesso`);
        }
      } catch (err) {
        console.log(`❌ Erro ao processar ${credential.name}:`, err.message);
      }
    }
    
    // Verificar se os segredos foram inseridos
    console.log('\n🔍 Verificando segredos no Vault...');
    
    try {
      const { data: secrets, error } = await supabase
        .from('vault.decrypted_secrets')
        .select('name, decrypted_secret')
        .in('name', ['hitss_base_url', 'hitss_username', 'hitss_password']);
      
      if (error) {
        console.log('⚠️ Erro ao verificar segredos:', error.message);
      } else if (secrets && secrets.length > 0) {
        console.log('📋 Segredos encontrados no Vault:');
        secrets.forEach(secret => {
          console.log(`  - ${secret.name}: ✅ Configurado`);
        });
        
        if (secrets.length === 3) {
          console.log('\n🎉 Todas as credenciais HITSS foram configuradas com sucesso!');
        } else {
          console.log(`\n⚠️ Apenas ${secrets.length} de 3 credenciais foram encontradas`);
        }
      } else {
        console.log('❌ Nenhum segredo encontrado no Vault');
      }
    } catch (err) {
      console.log('❌ Erro ao verificar segredos:', err.message);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

applyHITSSCredentials();