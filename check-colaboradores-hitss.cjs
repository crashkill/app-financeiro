const { createClient } = require('@supabase/supabase-js');

// Configurações do projeto Profissionais-HITSS
const PROFISSIONAIS_PROJECT = {
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc'
};

const supabase = createClient(PROFISSIONAIS_PROJECT.url, PROFISSIONAIS_PROJECT.key);

async function checkColaboradores() {
  try {
    console.log('👥 Verificando tabela colaboradores no projeto Profissionais-HITSS...');
    
    // 1. Contar total de registros
    const { count, error: countError } = await supabase
      .from('colaboradores')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar colaboradores:', countError);
      return;
    }
    
    console.log(`📊 Total de colaboradores: ${count}`);
    
    // 2. Buscar todos os registros (limitando a 100 para não sobrecarregar)
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('*')
      .limit(100);
    
    if (colaboradoresError) {
      console.error('❌ Erro ao buscar colaboradores:', colaboradoresError);
      return;
    }
    
    console.log(`\n📋 Primeiros ${Math.min(colaboradores.length, 10)} colaboradores:`);
    colaboradores.slice(0, 10).forEach((colaborador, index) => {
      console.log(`  ${index + 1}. ${colaborador.nome_completo || colaborador.nome || colaborador.name} (${colaborador.email})`);
    });
    
    // 3. Mostrar estrutura da tabela
    if (colaboradores.length > 0) {
      console.log('\n🏗️ Estrutura da tabela colaboradores:');
      const firstRecord = colaboradores[0];
      Object.keys(firstRecord).forEach(key => {
        const value = firstRecord[key];
        const type = typeof value;
        const sample = value !== null ? String(value).substring(0, 50) : 'null';
        console.log(`  ${key}: ${type} = ${sample}${String(value).length > 50 ? '...' : ''}`);
      });
    }
    
    // 4. Verificar se há campos específicos importantes
    if (colaboradores.length > 0) {
      const firstRecord = colaboradores[0];
      const importantFields = ['id', 'nome', 'nome_completo', 'email', 'cargo', 'departamento', 'salario', 'data_admissao', 'ativo'];
      
      console.log('\n🔍 Campos importantes encontrados:');
      importantFields.forEach(field => {
        if (firstRecord.hasOwnProperty(field)) {
          console.log(`  ✅ ${field}`);
        } else {
          console.log(`  ❌ ${field} (não encontrado)`);
        }
      });
    }
    
    // 5. Verificar registros ativos
    const { data: ativos, error: ativosError } = await supabase
      .from('colaboradores')
      .select('*', { count: 'exact' })
      .eq('ativo', true);
    
    if (!ativosError && ativos) {
      console.log(`\n✅ Colaboradores ativos: ${ativos.length}`);
    }
    
    // 6. Verificar registros inativos
    const { data: inativos, error: inativosError } = await supabase
      .from('colaboradores')
      .select('*', { count: 'exact' })
      .eq('ativo', false);
    
    if (!inativosError && inativos) {
      console.log(`❌ Colaboradores inativos: ${inativos.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkColaboradores();