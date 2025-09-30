const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTotalRecords() {
  try {
    console.log('🔍 Verificando total de registros na tabela dre_hitss...');
    
    // Primeiro, contar total de registros
    const { count: totalCount, error: countError } = await supabase
      .from('dre_hitss')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }

    console.log(`📊 Total de registros ativos na tabela: ${totalCount}`);

    // Agora testar sem range para ver quantos retorna por padrão
    console.log('\n🔍 Testando consulta sem range...');
    const { data: dataWithoutRange, error: errorWithoutRange } = await supabase
      .from('dre_hitss')
      .select('projeto')
      .eq('ativo', true)
      .order('projeto');

    if (errorWithoutRange) {
      console.error('❌ Erro na consulta sem range:', errorWithoutRange);
      return;
    }

    console.log(`📊 Registros retornados sem range: ${dataWithoutRange.length}`);
    const uniqueProjectsWithoutRange = [...new Set(dataWithoutRange.map(row => row.projeto))];
    console.log(`🎯 Projetos únicos sem range: ${uniqueProjectsWithoutRange.length}`);

    // Testar com range maior
    console.log('\n🔍 Testando consulta com range(0, 49999)...');
    const { data: dataWithRange, error: errorWithRange } = await supabase
      .from('dre_hitss')
      .select('projeto')
      .eq('ativo', true)
      .order('projeto')
      .range(0, 49999);

    if (errorWithRange) {
      console.error('❌ Erro na consulta com range:', errorWithRange);
      return;
    }

    console.log(`📊 Registros retornados com range(0, 49999): ${dataWithRange.length}`);
    const uniqueProjectsWithRange = [...new Set(dataWithRange.map(row => row.projeto))];
    console.log(`🎯 Projetos únicos com range: ${uniqueProjectsWithRange.length}`);

    // Verificar se há diferença
    if (dataWithoutRange.length === dataWithRange.length) {
      console.log('✅ Mesmo número de registros com e sem range');
    } else {
      console.log('⚠️ Diferença no número de registros!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testTotalRecords();