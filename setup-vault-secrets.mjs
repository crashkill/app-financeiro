// Script para verificar e configurar segredos no Vault
import fetch from 'node-fetch';

async function setupVaultSecrets() {
  console.log('🔐 VERIFICANDO E CONFIGURANDO SEGREDOS DO VAULT...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  const requiredSecrets = {
    'HITSS_DOWNLOAD_URL': {
      description: 'URL para download do arquivo Excel HITSS',
      example: 'https://exemplo.hitss.com.br/relatorio/dre/export'
    },
    'RESEND_API_KEY': {
      description: 'Chave da API do Resend para notificações por email',
      example: 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  };

  try {
    console.log('📋 Verificando segredos existentes...\n');

    for (const [secretName, config] of Object.entries(requiredSecrets)) {
      try {
        console.log(`🔍 Verificando ${secretName}...`);

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_secret`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ secret_name: secretName })
        });

        if (response.ok) {
          const { data } = await response.json();
          if (data) {
            console.log(`✅ ${secretName}: Configurado`);
            // Não mostrar o valor por segurança
          } else {
            console.log(`⚠️ ${secretName}: Não encontrado`);
            console.log(`   💡 Descrição: ${config.description}`);
            console.log(`   📝 Exemplo: ${config.example}\n`);
          }
        } else {
          console.log(`❌ Erro ao verificar ${secretName}: ${response.status}`);
        }

      } catch (error) {
        console.log(`❌ Erro na verificação de ${secretName}: ${error.message}`);
      }
    }

    console.log('🔧 CONFIGURAÇÃO DO VAULT:');
    console.log('\nPara configurar os segredos, você tem duas opções:');
    console.log('\n1️⃣ Via Supabase Dashboard:');
    console.log('   • Acesse: https://supabase.com/dashboard/project/oomhhhfahdvavnhlbioa/settings/vault');
    console.log('   • Clique em "New Secret"');
    console.log('   • Adicione os segredos listados acima');
    console.log('   • Use nomes exatos: HITSS_DOWNLOAD_URL, RESEND_API_KEY');

    console.log('\n2️⃣ Via SQL (se você tiver acesso):');
    console.log('   -- Inserir segredos na tabela vault.secrets');
    console.log('   INSERT INTO vault.secrets (name, secret) VALUES');
    console.log('   (\'HITSS_DOWNLOAD_URL\', \'SUA_URL_AQUI\'),');
    console.log('   (\'RESEND_API_KEY\', \'SUA_CHAVE_AQUI\');');

    console.log('\n📋 PASSOS PARA CONFIGURAR HITSS_DOWNLOAD_URL:');
    console.log('   1. Entre em contato com a equipe HITSS');
    console.log('   2. Solicite a URL do relatório Excel DRE');
    console.log('   3. Configure a URL no Vault');
    console.log('   4. Teste o download com o script de diagnóstico');

    console.log('\n📋 PASSOS PARA CONFIGURAR RESEND_API_KEY:');
    console.log('   1. Acesse: https://resend.com/api-keys');
    console.log('   2. Crie uma nova API Key');
    console.log('   3. Configure domínio do remetente (ex: noreply@hitss.com.br)');
    console.log('   4. Adicione a chave no Vault');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

setupVaultSecrets();
