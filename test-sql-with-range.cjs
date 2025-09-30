const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSQLWithRange() {
  try {
    console.log('🔍 Testando consulta SQL com range(0, 49999)...');
    
    // Replicar a consulta da Edge Function com range
    const { data: rawData, error } = await supabase
      .from('dre_hitss')
      .select('projeto, ano, mes, receita_total, custo_total, desoneracao')
      .eq('ativo', true)
      .order('projeto, ano, mes')
      .range(0, 49999);

    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }

    console.log(`📊 Total de registros retornados: ${rawData.length}`);

    // Extrair projetos únicos
    const uniqueProjects = [...new Set(rawData.map(row => row.projeto))];
    
    console.log(`🎯 Projetos únicos encontrados: ${uniqueProjects.length}`);
    console.log('📋 Lista de projetos:');
    uniqueProjects.forEach((projeto, index) => {
      const projectRecords = rawData.filter(row => row.projeto === projeto);
      console.log(`  ${index + 1}. ${projeto} (${projectRecords.length} registros)`);
    });

    if (uniqueProjects.length !== 88) {
      console.log(`⚠️  Esperado: 88 projetos únicos, encontrado: ${uniqueProjects.length}`);
    } else {
      console.log('✅ Número correto de projetos únicos encontrado!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSQLWithRange();