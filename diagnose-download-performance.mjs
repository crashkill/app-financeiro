// Script para diagnosticar problemas de performance no download
import fetch from 'node-fetch';
import https from 'https';
import { performance } from 'perf_hooks';

async function diagnoseDownloadPerformance() {
  console.log('🔍 DIAGNÓSTICO DE PERFORMANCE DO DOWNLOAD HITSS\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

  try {
    // 1. Buscar URL do Vault
    console.log('🔐 Buscando URL do Vault...');
    const supabase = {
      rpc: async (method, params) => {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${method}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify(params)
        });
        return response.json();
      }
    };

    const { data: downloadUrl, error } = await supabase.rpc('get_secret', {
      secret_name: 'HITSS_DOWNLOAD_URL'
    });

    if (error || !downloadUrl) {
      throw new Error(`Erro no Vault: ${error?.message || 'URL não encontrada'}`);
    }

    console.log('✅ URL obtida do Vault');
    console.log(`🔗 URL: ${downloadUrl}\n`);

    // 2. Teste de conectividade
    console.log('🌐 TESTE DE CONECTIVIDADE:');
    const startTime = performance.now();

    const agent = new https.Agent({
      rejectUnauthorized: false,
      timeout: 60000
    });

    try {
      const response = await fetch(downloadUrl, {
        method: 'HEAD',
        agent: agent,
        timeout: 60000
      });

      const connectTime = (performance.now() - startTime) / 1000;
      console.log(`✅ Conectividade OK em ${connectTime.toFixed(2)}s`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Headers:`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);
      console.log(`   Server: ${response.headers.get('server')}`);
      console.log(`   Last-Modified: ${response.headers.get('last-modified')}`);

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const expectedMB = (contentLength / (1024 * 1024)).toFixed(2);
      console.log(`📊 Tamanho esperado: ${expectedMB} MB\n`);

    } catch (error) {
      console.log(`❌ Erro de conectividade: ${error.message}`);
      return;
    }

    // 3. Teste de download real (limitado)
    console.log('📥 TESTE DE DOWNLOAD (LIMITADO A 1MB):');

    const downloadStart = performance.now();

    try {
      const response = await fetch(downloadUrl, {
        method: 'GET',
        agent: agent,
        timeout: 120000, // 2 minutos
        headers: {
          'Range': 'bytes=0-1048575' // Limitar a 1MB
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Mostrar progresso
        const downloadTime = (performance.now() - downloadStart) / 1000;
        const speedMbps = (receivedLength / (1024 * 1024)) / downloadTime * 8;
        console.log(`📈 Progresso: ${(receivedLength / (1024 * 1024)).toFixed(2)} MB em ${downloadTime.toFixed(2)}s (${speedMbps.toFixed(2)} Mbps)`);

        // Parar se demorar muito
        if (downloadTime > 60) {
          console.log('⏹️ Teste interrompido após 60s');
          break;
        }
      }

      const totalTime = (performance.now() - downloadStart) / 1000;
      const totalMB = receivedLength / (1024 * 1024);
      const avgSpeed = totalMB / totalTime * 8;

      console.log(`\n✅ Teste concluído:`);
      console.log(`⏱️ Tempo total: ${totalTime.toFixed(2)}s`);
      console.log(`📊 Dados baixados: ${totalMB.toFixed(2)} MB`);
      console.log(`⚡ Velocidade média: ${avgSpeed.toFixed(2)} Mbps`);

    } catch (error) {
      console.log(`❌ Erro no teste de download: ${error.message}`);
    }

    // 4. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');

    const totalTime = (performance.now() - startTime) / 1000;

    if (totalTime > 300) { // 5 minutos
      console.log('🚨 PROBLEMA: Download muito lento (>5min)');
      console.log('   • Verificar conexão com servidor HITSS');
      console.log('   • Considerar compressão do arquivo Excel');
      console.log('   • Implementar download incremental');
      console.log('   • Verificar se há proxy/firewall');
    } else if (totalTime > 180) { // 3 minutos
      console.log('⚠️ ATENÇÃO: Download lento (3-5min)');
      console.log('   • Implementar retry com backoff');
      console.log('   • Adicionar progress tracking');
      console.log('   • Considerar cache local');
      console.log('   • Otimizar configurações de rede');
    } else {
      console.log('✅ Performance aceitável (<3min)');
      console.log('   • Manter configurações atuais');
      console.log('   • Implementar apenas melhorias opcionais');
    }

    console.log('\n🔧 SUGESTÕES DE OTIMIZAÇÃO:');
    console.log('   • Usar Edge Functions (Deno) para download');
    console.log('   • Implementar streaming para arquivos grandes');
    console.log('   • Adicionar cache HTTP para arquivos iguais');
    console.log('   • Configurar timeout progressivo');
    console.log('   • Usar múltiplas threads se possível');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  }
}

diagnoseDownloadPerformance();
