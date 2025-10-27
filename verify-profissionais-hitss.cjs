const { createClient } = require('@supabase/supabase-js');

// Configurações do projeto Profissionais-HITSS
const PROFISSIONAIS_PROJECT = {
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc'
};

const supabase = createClient(PROFISSIONAIS_PROJECT.url, PROFISSIONAIS_PROJECT.key);

async function verifyProfissionaisProject() {
  try {
    console.log('🔍 Verificando projeto Profissionais-HITSS...');
    console.log(`📍 URL: ${PROFISSIONAIS_PROJECT.url}`);
    
    // 1. Listar todas as tabelas usando RPC ou tentativa direta
    console.log('\n📋 Listando tabelas disponíveis...');
    
    // Primeiro, vamos tentar acessar diretamente a tabela colaboradores
    console.log('🔍 Tentando acessar tabela colaboradores...');
    const { data: colaboradoresTest, error: colaboradoresTestError } = await supabase
      .from('colaboradores')
      .select('*', { count: 'exact', head: true });
    
    if (colaboradoresTestError) {
      console.log('❌ Tabela colaboradores não encontrada ou erro:', colaboradoresTestError.message);
    } else {
      console.log('✅ Tabela colaboradores encontrada!');
    }
    
    // Tentar outras tabelas comuns
    const tablesToTest = ['profissionais', 'funcionarios', 'employees', 'users', 'pessoas'];
    const foundTables = [];
    
    // Adicionar colaboradores se foi encontrada
    if (!colaboradoresTestError) {
      foundTables.push('colaboradores');
    }
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          foundTables.push(tableName);
          console.log(`✅ Tabela ${tableName} encontrada!`);
        }
      } catch (err) {
        // Tabela não existe, continuar
      }
    }
    
    const tables = foundTables.map(name => ({ table_name: name }));
    const tablesError = null;
    
    if (tablesError) {
      console.error('❌ Erro ao listar tabelas:', tablesError);
      return;
    }
    
    console.log(`✅ Encontradas ${tables.length} tabelas:`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // 2. Verificar se existe tabela colaboradores
    const hasColaboradores = tables.some(table => table.table_name === 'colaboradores');
    
    if (hasColaboradores) {
      console.log('\n👥 Verificando tabela colaboradores...');
      
      // Contar registros
      const { count, error: countError } = await supabase
        .from('colaboradores')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Erro ao contar colaboradores:', countError);
      } else {
        console.log(`📊 Total de colaboradores: ${count}`);
      }
      
      // Buscar alguns registros de exemplo
      const { data: colaboradores, error: colaboradoresError } = await supabase
        .from('colaboradores')
        .select('*')
        .limit(5);
      
      if (colaboradoresError) {
        console.error('❌ Erro ao buscar colaboradores:', colaboradoresError);
      } else {
        console.log('\n📋 Primeiros 5 colaboradores:');
        colaboradores.forEach((colaborador, index) => {
          console.log(`  ${index + 1}. ${colaborador.nome_completo || colaborador.nome} (${colaborador.email})`);
        });
        
        // Mostrar estrutura da primeira linha
        if (colaboradores.length > 0) {
          console.log('\n🏗️ Estrutura da tabela colaboradores:');
          const firstRecord = colaboradores[0];
          Object.keys(firstRecord).forEach(key => {
            const value = firstRecord[key];
            const type = typeof value;
            console.log(`  ${key}: ${type} = ${value}`);
          });
        }
      }
    } else {
      console.log('\n❌ Tabela colaboradores não encontrada!');
    }
    
    // 3. Verificar outras tabelas relacionadas a profissionais
    const profissionaisTables = tables.filter(table => 
      table.table_name.includes('profission') || 
      table.table_name.includes('colaborador') ||
      table.table_name.includes('funcionario') ||
      table.table_name.includes('employee')
    );
    
    if (profissionaisTables.length > 0) {
      console.log('\n🔍 Tabelas relacionadas a profissionais encontradas:');
      profissionaisTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verifyProfissionaisProject();