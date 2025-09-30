const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEdgeQuery() {
  console.log('🔍 Debugando consulta SQL da Edge Function...\n');
  
  try {
    // Replicar exatamente a consulta que a Edge Function faz
    const selectFields = [
      'id', 'projeto', 'ano', 'mes', 'receita_total', 
      'custo_total', 'desoneracao', 'ativo', 'valor', 'natureza', 'data_criacao', 'data_atualizacao'
    ].join(',');
    
    console.log('📋 Campos selecionados:', selectFields);
    
    let query = supabase
      .from('dre_hitss')
      .select(selectFields)
      .eq('ativo', true)
      .order('projeto, ano, mes');

    console.log('\n🔍 Executando consulta SQL...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }

    console.log(`✅ Consulta executada com sucesso!`);
    console.log(`📊 Total de registros retornados: ${data.length}`);
    
    // Extrair projetos únicos (igual à Edge Function)
    const uniqueProjects = [...new Set(data.map(item => item.projeto).filter(Boolean))];
    
    console.log(`🎯 Total de projetos únicos encontrados: ${uniqueProjects.length}`);
    
    console.log('\n📋 Primeiros 10 projetos únicos:');
    uniqueProjects.slice(0, 10).forEach((projeto, index) => {
      console.log(`  ${index + 1}. ${projeto}`);
    });
    
    if (uniqueProjects.length > 10) {
      console.log(`  ... e mais ${uniqueProjects.length - 10} projetos`);
    }
    
    // Verificar se há algum problema específico
    if (uniqueProjects.length === 88) {
      console.log('\n✅ PERFEITO: Encontrados todos os 88 projetos únicos esperados!');
      console.log('🤔 O problema pode estar na Edge Function ou no processamento dos dados.');
    } else {
      console.log(`\n⚠️  ATENÇÃO: Encontrados ${uniqueProjects.length} projetos, mas esperávamos 88.`);
    }
    
    // Verificar se há registros com projeto null/undefined
    const registrosComProjetoVazio = data.filter(item => !item.projeto);
    if (registrosComProjetoVazio.length > 0) {
      console.log(`\n⚠️  Encontrados ${registrosComProjetoVazio.length} registros com projeto vazio/null`);
    }
    
    // Mostrar estatísticas por projeto
    console.log('\n📈 Estatísticas por projeto (primeiros 5):');
    const projetoStats = {};
    data.forEach(item => {
      if (item.projeto) {
        if (!projetoStats[item.projeto]) {
          projetoStats[item.projeto] = 0;
        }
        projetoStats[item.projeto]++;
      }
    });
    
    const topProjetos = Object.entries(projetoStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
      
    topProjetos.forEach(([projeto, count], index) => {
      console.log(`  ${index + 1}. ${projeto}: ${count} registros`);
    });

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

// Executar o debug
debugEdgeQuery();