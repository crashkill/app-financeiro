const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExactPayload() {
  console.log('🎯 Testando payload exato...\n');

  try {
    // Payload exato conforme esperado pela Edge Function
    const payload = {
      type: 'dashboard',
      filters: {
        projeto: 'NCPVIA068.1 - OGS - PORTAL 2017',
        ano: 2025,
        mes: 9
      }
    };

    console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));

    const { data, error } = await supabase.functions.invoke('financial-data-unified', {
      body: payload
    });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      console.error('   - Message:', error.message);
      console.error('   - Details:', error.details);
      console.error('   - Hint:', error.hint);
      console.error('   - Code:', error.code);
    } else {
      console.log('✅ Resposta recebida:');
      console.log('   - Success:', data?.success);
      console.log('   - Type:', data?.type);
      console.log('   - Count:', data?.count);
      console.log('   - Message:', data?.message);
      console.log('   - Source:', data?.source);
      console.log('   - ProcessedAt:', data?.processedAt);
      
      if (data?.data) {
        console.log('   - Data type:', typeof data.data);
        console.log('   - Data length:', Array.isArray(data.data) ? data.data.length : 'not array');
        
        if (Array.isArray(data.data) && data.data.length > 0) {
          console.log('   - First item:', JSON.stringify(data.data[0], null, 2));
        }
      }

      if (data?.rawData) {
        console.log('   - RawData length:', data.rawData.length);
        if (data.rawData.length > 0) {
          console.log('   - First rawData item:', JSON.stringify(data.rawData[0], null, 2));
        }
      }

      if (data?.aggregatedMetrics) {
        console.log('   - Aggregated metrics:', JSON.stringify(data.aggregatedMetrics, null, 2));
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste com health check
    console.log('🏥 Testando health check...');
    
    const healthResponse = await fetch(`${supabaseUrl}/functions/v1/financial-data-unified/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('❌ Health check failed:', healthResponse.status, healthResponse.statusText);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o teste
testExactPayload().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('💥 Erro na execução:', error);
});