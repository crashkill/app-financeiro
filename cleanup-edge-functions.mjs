// Script para verificar e limpar Edge Functions do Supabase
import fetch from 'node-fetch';

async function cleanupEdgeFunctions() {
  console.log('🧹 VERIFICANDO E LIMPANDO EDGE FUNCTIONS...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  // Lista de Edge Functions conhecidas para tentar deletar
  const knownFunctions = [
    'create-dim-projeto',
    'create-dim-cliente',
    'create-dim-conta',
    'create-dim-periodo',
    'process-dre-upload',
    'dre-etl-dimensional',
    'dre-orchestrator',
    'dre-ingest',
    'create-dim-recurso',
    'create-dim-fato',
    'test-function',
    'hello-world'
  ];

  console.log('📋 Tentando deletar Edge Functions conhecidas...\n');

  for (const functionName of knownFunctions) {
    try {
      console.log(`🗑️ Tentando deletar ${functionName}...`);

      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        }
      });

      if (response.ok) {
        console.log(`✅ ${functionName} deletada com sucesso`);
      } else if (response.status === 404) {
        console.log(`ℹ️ ${functionName} não encontrada (já deletada ou inexistente)`);
      } else {
        const errorText = await response.text();
        console.log(`⚠️ Erro ao deletar ${functionName}: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao tentar deletar ${functionName}: ${error.message}`);
    }

    // Pequena pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Tentativa de limpeza concluída!');
  console.log('🔄 Verifique no Supabase Dashboard se alguma função ainda existe.');
  console.log('💡 Se alguma função persistir, delete manualmente via Dashboard.');
  console.log('🚀 Agora você pode criar as novas Edge Functions do zero.');

  // Tentar listar funções restantes (se o endpoint existir)
  try {
    console.log('\n🔍 Tentando listar funções restantes...');
    const listResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_all_edge_functions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    });

    if (listResponse.ok) {
      const functions = await listResponse.json();
      console.log(`\n📋 Funções restantes encontradas: ${functions.length}`);
      functions.forEach(func => {
        console.log(`  - ${func.name} (ID: ${func.id})`);
      });
    } else {
      console.log('ℹ️ Não foi possível listar funções restantes (endpoint pode não existir).');
      console.log('🔄 Verifique manualmente no Supabase Dashboard.');
    }
  } catch (error) {
    console.log('ℹ️ Não foi possível listar funções restantes.');
  }
}

cleanupEdgeFunctions();
