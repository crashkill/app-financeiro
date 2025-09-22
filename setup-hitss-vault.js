const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupHITSSCredentials() {
  try {
    console.log('Iniciando a configuração das credenciais HITSS no Vault...');

    const credentials = [
      {
        name: 'hitss_username',
        secret: 'testuser'
      },
      {
        name: 'hitss_password',
        secret: 'testpassword'
      },
      {
        name: 'hitss_base_url',
        secret: 'https://hitss.example.com'
      }
    ];

    for (const credential of credentials) {
      const { data, error } = await supabase.rpc('insert_secret', {
        secret_name: credential.name,
        secret_value: credential.secret
      });

      if (error) {
        console.error(`❌ Erro ao inserir ${credential.name}:`, error);
      } else {
        console.log(`✅ Segredo ${credential.name} inserido com sucesso`);
      }
    }

    // Verificar se os segredos foram inseridos
    console.log('\n🔍 Verificando segredos inseridos...');
    const secretNames = credentials.map(c => c.name);
    const secrets = [];

    for (const secretName of secretNames) {
      const { data: secretValue, error: getError } = await supabase
        .rpc('get_secret', {
          secret_name: secretName
        });

      if (!getError && secretValue) {
        secrets.push({ name: secretName, decrypted_secret: secretValue });
      }
    }

    console.log('📋 Segredos encontrados:');
    if (secrets.length > 0) {
      secrets.forEach(secret => {
        console.log(`  - ${secret.name}: ${secret.decrypted_secret ? '✅ Configurado' : '❌ Não encontrado'}`);
      });
    } else {
      console.log('  ❌ Nenhum segredo encontrado');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

setupHITSSCredentials();