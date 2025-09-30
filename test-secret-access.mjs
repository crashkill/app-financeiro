// Script para testar múltiplas formas de acessar segredos
import fetch from 'node-fetch';
import https from 'https';

async function testMultipleSecretAccess() {
  console.log('🔐 TESTANDO MÚLTIPLOS MÉTODOS DE ACESSO A SEGREDOS...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  const methods = [
    {
      name: 'RPC get_secret',
      test: async () => {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_secret`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ secret_name: 'HITSS_DOWNLOAD_URL' })
        });
        return { status: response.status, data: await response.json() };
      }
    },
    {
      name: 'Tabela vault.secrets (service_role)',
      test: async () => {
        const response = await fetch(`${supabaseUrl}/rest/v1/vault.secrets?name=eq.HITSS_DOWNLOAD_URL`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          }
        });
        return { status: response.status, data: await response.json() };
      }
    },
    {
      name: 'Environment Variables',
      test: async () => {
        return {
          status: 200,
          data: {
            HITSS_DOWNLOAD_URL: process.env.HITSS_DOWNLOAD_URL,
            RESEND_API_KEY: process.env.RESEND_API_KEY
          }
        };
      }
    }
  ];

  console.log('📋 Testando métodos de acesso...\n');

  for (const method of methods) {
    try {
      console.log(`🔍 Testando: ${method.name}`);
      const result = await method.test();

      console.log(`📊 Status: ${result.status}`);

      if (result.status === 200) {
        console.log('✅ Método funcional!');
        console.log('📋 Dados:', JSON.stringify(result.data, null, 2));

        if (method.name === 'RPC get_secret' && result.data.data) {
          console.log('🎯 URL encontrada via RPC!');
          return result.data.data; // Retorna a URL
        } else if (method.name === 'Environment Variables' && result.data.HITSS_DOWNLOAD_URL) {
          console.log('🎯 URL encontrada via Environment!');
          return result.data.HITSS_DOWNLOAD_URL; // Retorna a URL
        }
      } else {
        console.log('❌ Método falhou');
        const errorText = JSON.stringify(result.data, null, 2);
        console.log('📋 Erro:', errorText);
      }

      console.log(''); // Linha em branco

    } catch (error) {
      console.log(`❌ Erro no método ${method.name}: ${error.message}\n`);
    }
  }

  console.log('💡 SUGESTÕES:');
  console.log('1. Configure HITSS_DOWNLOAD_URL nas variáveis de ambiente (.env)');
  console.log('2. Verifique se o RPC get_secret está implementado no banco');
  console.log('3. Configure a URL diretamente no código para teste');
  console.log('4. Use o Supabase Dashboard para verificar os segredos');

  return null;
}

// Teste de download com URL conhecida (fallback)
async function testWithKnownUrl() {
  console.log('\n🔄 TESTE COM URL CONHECIDA (FALLBACK)...\n');

  // URLs de teste comuns (substitua pela real quando souber)
  const testUrls = [
    'https://exemplo.hitss.com.br/relatorio.xlsx',
    'https://portal.hitss.com.br/api/dre/export',
    'https://sistema.hitss.com.br/reports/dre'
  ];

  for (const url of testUrls) {
    console.log(`🔍 Testando URL: ${url}`);

    try {
      const agent = new https.Agent({
        rejectUnauthorized: false,
        timeout: 30000 // 30 segundos para teste
      });

      const response = await fetch(url, {
        method: 'HEAD',
        agent: agent
      });

      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

      if (response.status === 200) {
        console.log('✅ URL funcional encontrada!');
        return url;
      }

    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }

  return null;
}

async function main() {
  console.log('🚀 INICIANDO TESTE COMPLETO DE ACESSO A SEGREDOS\n');

  // Tentar métodos de acesso aos segredos
  const secretUrl = await testMultipleSecretAccess();

  if (secretUrl) {
    console.log(`🎯 URL encontrada: ${secretUrl}`);
    console.log('✅ Pronto para otimizar o download!');
  } else {
    console.log('⚠️ Nenhuma URL encontrada nos métodos testados');

    // Tentar com URLs conhecidas
    const fallbackUrl = await testWithKnownUrl();

    if (fallbackUrl) {
      console.log(`🎯 URL de fallback encontrada: ${fallbackUrl}`);
    } else {
      console.log('❌ Nenhuma URL funcional encontrada');
      console.log('\n💡 CONFIGURAÇÃO NECESSÁRIA:');
      console.log('1. Configure HITSS_DOWNLOAD_URL no Vault ou .env');
      console.log('2. Entre em contato com a equipe HITSS para obter a URL correta');
      console.log('3. Use o script de configuração: setup-vault-secrets.mjs');
    }
  }
}

main();
