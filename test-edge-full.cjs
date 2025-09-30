const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullResponse() {
  console.log('📊 Testando resposta completa da Edge Function...\n');

  try {
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
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Resposta completa:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o teste
testFullResponse().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('💥 Erro na execução:', error);
});