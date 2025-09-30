const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectsList() {
  console.log('🔍 Testando busca de projetos únicos via Edge Function...\n');
  
  try {
    // Payload para buscar projetos disponíveis
    const payload = {
      type: 'projetos'
    };

    console.log('📤 Payload enviado:', JSON.stringify(payload, null, 2));
    
    // Chamada para a Edge Function
    const { data, error } = await supabase.functions.invoke('financial-data-unified', {
      body: payload
    });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      if (error.context && error.context.body) {
        try {
          const errorBody = await error.context.json();
          console.error('Detalhes do erro:', JSON.stringify(errorBody, null, 2));
        } catch (e) {
          console.error('Não foi possível parsear o corpo do erro como JSON.');
        }
      }
      return;
    }

    console.log('\n📥 Resposta da Edge Function:');
    console.log('- Success:', data.success);
    console.log('- Count:', data.count);
    console.log('- Type:', data.type);
    console.log('- Source:', data.source);
    
    if (data.data && Array.isArray(data.data)) {
      console.log('- Total de projetos retornados:', data.data.length);
      console.log('\n📋 Primeiros 10 projetos:');
      data.data.slice(0, 10).forEach((projeto, index) => {
        console.log(`  ${index + 1}. ${projeto}`);
      });
      
      if (data.data.length > 10) {
        console.log(`  ... e mais ${data.data.length - 10} projetos`);
      }
      
      // Verificar se temos todos os 88 projetos esperados
      if (data.data.length === 88) {
        console.log('\n✅ SUCESSO: Edge Function retornou todos os 88 projetos únicos!');
      } else {
        console.log(`\n⚠️  ATENÇÃO: Edge Function retornou ${data.data.length} projetos, mas esperávamos 88.`);
      }
    } else {
      console.log('⚠️  Dados não estão no formato de array esperado');
      console.log('Dados recebidos:', JSON.stringify(data.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testProjectsList();