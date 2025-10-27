const { createClient } = require('@supabase/supabase-js');

// Configurações do projeto Profissionais-HITSS
const PROFISSIONAIS_PROJECT = {
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc'
};

const supabase = createClient(PROFISSIONAIS_PROJECT.url, PROFISSIONAIS_PROJECT.key);

async function checkEdgeFunctions() {
  try {
    console.log('🔧 Verificando Edge Functions no projeto Profissionais-HITSS...');
    
    // Tentar chamar algumas Edge Functions comuns relacionadas a profissionais
    const functionsToTest = [
      'listar-profissionais',
      'buscar-profissional',
      'atualizar-profissional',
      'criar-profissional',
      'profissionais',
      'colaboradores',
      'get-profissionais',
      'list-profissionais'
    ];
    
    const workingFunctions = [];
    
    for (const functionName of functionsToTest) {
      try {
        console.log(`🔍 Testando função: ${functionName}`);
        
        // Fazer uma chamada de teste (GET sem parâmetros)
        const { data, error } = await supabase.functions.invoke(functionName, {
          method: 'GET'
        });
        
        if (!error) {
          workingFunctions.push(functionName);
          console.log(`✅ Função ${functionName} está funcionando`);
          console.log(`   Resposta: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          console.log(`❌ Função ${functionName} retornou erro: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ Função ${functionName} não encontrada ou erro: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Resumo: ${workingFunctions.length} Edge Functions encontradas:`);
    workingFunctions.forEach((func, index) => {
      console.log(`  ${index + 1}. ${func}`);
    });
    
    // Tentar uma chamada específica para listar profissionais
    if (workingFunctions.includes('listar-profissionais')) {
      console.log('\n🔍 Testando função listar-profissionais com mais detalhes...');
      
      const { data, error } = await supabase.functions.invoke('listar-profissionais', {
        method: 'GET'
      });
      
      if (!error && data) {
        console.log('✅ Dados retornados pela função listar-profissionais:');
        console.log(`   Tipo: ${typeof data}`);
        console.log(`   Conteúdo: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkEdgeFunctions();