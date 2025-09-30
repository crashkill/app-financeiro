const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPagination() {
  try {
    console.log('🔍 Testando paginação para buscar todos os projetos únicos...');
    
    let allProjects = new Set();
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let totalRecords = 0;

    while (hasMore) {
      const start = page * pageSize;
      const end = start + pageSize - 1;
      
      console.log(`📄 Buscando página ${page + 1} (registros ${start} a ${end})...`);
      
      const { data, error } = await supabase
        .from('dre_hitss')
        .select('projeto')
        .eq('ativo', true)
        .order('projeto')
        .range(start, end);

      if (error) {
        console.error('❌ Erro na consulta:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Adicionar projetos únicos ao Set
      data.forEach(row => {
        if (row.projeto) {
          allProjects.add(row.projeto);
        }
      });

      totalRecords += data.length;
      console.log(`   📊 Registros nesta página: ${data.length}`);
      console.log(`   🎯 Projetos únicos até agora: ${allProjects.size}`);

      // Se retornou menos que o pageSize, chegamos ao fim
      if (data.length < pageSize) {
        hasMore = false;
      }

      page++;
      
      // Limite de segurança para evitar loop infinito
      if (page > 50) {
        console.log('⚠️ Limite de páginas atingido (50)');
        break;
      }
    }

    console.log('\n📊 Resultado final:');
    console.log(`   Total de registros processados: ${totalRecords}`);
    console.log(`   Total de projetos únicos: ${allProjects.size}`);
    
    // Listar os primeiros 10 projetos
    const projectsList = Array.from(allProjects).sort();
    console.log('\n🎯 Primeiros 10 projetos únicos:');
    projectsList.slice(0, 10).forEach((projeto, index) => {
      console.log(`   ${index + 1}. ${projeto}`);
    });
    
    if (projectsList.length > 10) {
      console.log(`   ... e mais ${projectsList.length - 10} projetos`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testPagination();