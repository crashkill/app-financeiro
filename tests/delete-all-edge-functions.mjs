// Script para deletar todas as Edge Functions do Supabase
import fetch from 'node-fetch';

async function deleteAllEdgeFunctions() {
  console.log('🗑️ DELETANDO TODAS AS EDGE FUNCTIONS...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  try {
    // 1. Listar todas as Edge Functions
    console.log('📋 Listando Edge Functions existentes...');
    const listResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_all_edge_functions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    });

    if (!listResponse.ok) {
      console.log('❌ Erro ao listar Edge Functions. Tentando método alternativo...\n');

      // Método alternativo: tentar deletar funções conhecidas
      const knownFunctions = [
        'create-dim-projeto',
        'create-dim-cliente',
        'create-dim-conta',
        'create-dim-periodo',
        'process-dre-upload',
        'dre-etl-dimensional',
        'dre-orchestrator',
        'dre-ingest',
        'process-dre-upload'
      ];

      console.log('🔄 Tentando deletar funções conhecidas...\n');

      for (const functionName of knownFunctions) {
        try {
          console.log(`🗑️ Deletando ${functionName}...`);

          const deleteResponse = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey
            }
          });

          if (deleteResponse.ok) {
            console.log(`✅ ${functionName} deletada com sucesso`);
          } else {
            console.log(`⚠️ ${functionName} não encontrada ou erro: ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Erro ao deletar ${functionName}: ${error.message}`);
        }
      }
    } else {
      const functions = await listResponse.json();
      console.log(`📊 Encontradas ${functions.length} Edge Functions\n`);

      for (const func of functions) {
        try {
          console.log(`🗑️ Deletando ${func.name} (ID: ${func.id})...`);

          const deleteResponse = await fetch(`${supabaseUrl}/functions/v1/${func.slug}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey
            }
          });

          if (deleteResponse.ok) {
            console.log(`✅ ${func.name} deletada com sucesso`);
          } else {
            console.log(`⚠️ Erro ao deletar ${func.name}: ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Erro ao deletar ${func.name}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 PROCESSO DE LIMPEZA CONCLUÍDO!');
    console.log('📝 Todas as Edge Functions foram removidas ou tentadas para remoção.');
    console.log('🔄 Você pode verificar no Supabase Dashboard se alguma função ainda existe.');
    console.log('🚀 Agora podemos criar as novas Edge Functions do zero.');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n📝 Algumas funções podem não ter sido deletadas.');
    console.log('🔄 Verifique no Supabase Dashboard e delete manualmente se necessário.');
  }
}

deleteAllEdgeFunctions();
