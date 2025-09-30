// Script para testar acesso direto ao Vault
import fetch from 'node-fetch';

async function testVaultDirect() {
  console.log('🔐 TESTANDO ACESSO DIRETO AO VAULT...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  try {
    // 1. Testar se o RPC get_secret existe
    console.log('🔍 Testando RPC get_secret...');
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_secret`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ secret_name: 'HITSS_DOWNLOAD_URL' })
    });

    console.log(`📊 Status RPC: ${rpcResponse.status}`);
    const rpcResult = await rpcResponse.json();
    console.log('📋 Resposta RPC:', rpcResult);

    // 2. Verificar se a tabela vault.secrets existe
    console.log('\n🔍 Verificando tabela vault.secrets...');
    const tableResponse = await fetch(`${supabaseUrl}/rest/v1/vault.secrets?select=name`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    });

    console.log(`📊 Status Tabela: ${tableResponse.status}`);

    if (tableResponse.ok) {
      const secrets = await tableResponse.json();
      console.log('📋 Segredos disponíveis:');
      secrets.forEach(secret => {
        console.log(`   - ${secret.name}`);
      });
    } else {
      const errorText = await tableResponse.text();
      console.log('❌ Erro na tabela:', errorText);
    }

    // 3. Tentar buscar segredo diretamente da tabela
    console.log('\n🔍 Buscando segredo diretamente...');
    const directResponse = await fetch(`${supabaseUrl}/rest/v1/vault.secrets?name=eq.HITSS_DOWNLOAD_URL`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    });

    console.log(`📊 Status Direto: ${directResponse.status}`);

    if (directResponse.ok) {
      const directResult = await directResponse.json();
      console.log('📋 Resultado direto:', directResult);

      if (directResult && directResult.length > 0) {
        console.log('✅ Segredo encontrado!');
        console.log('🔗 URL encontrada:', directResult[0].secret ? '[CONFIGURADO]' : '[VAZIO]');
      } else {
        console.log('❌ Segredo HITSS_DOWNLOAD_URL não encontrado na tabela');
      }
    } else {
      const errorText = await directResponse.text();
      console.log('❌ Erro na busca direta:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testVaultDirect();
