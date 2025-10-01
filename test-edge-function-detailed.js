const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunctionDetailed() {
  console.log('🧪 Testando Edge Function hitss-automation com detalhes...');
  
  try {
    // Primeiro, vamos testar com um payload simples
    console.log('\n📋 Testando com payload básico...');
    
    const { data, error } = await supabase.functions.invoke('hitss-automation', {
      body: {
        action: 'test',
        debug: true
      }
    });
    
    console.log('📊 Resultado da invocação:');
    console.log('  - Data:', JSON.stringify(data, null, 2));
    console.log('  - Error:', error);
    
    if (error) {
      console.log('\n❌ Erro detalhado:');
      console.log('  - Message:', error.message);
      console.log('  - Details:', error.details);
      console.log('  - Hint:', error.hint);
      console.log('  - Code:', error.code);
    }
    
    // Testar se a função está respondendo
    console.log('\n📋 Testando resposta HTTP direta...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/hitss-automation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'test',
        debug: true
      })
    });
    
    console.log('📊 Status HTTP:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response Body:', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('📄 Response JSON:', JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log('⚠️ Response não é JSON válido');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testEdgeFunctionDetailed();