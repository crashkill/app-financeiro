const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentData() {
  console.log('=== Verificando dados atuais da tabela dre_hitss ===\n');
  
  // Verificar total de registros
  const { count, error: countError } = await supabase
    .from('dre_hitss')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Erro ao contar registros:', countError);
    return;
  }
  
  console.log(`Total de registros na tabela: ${count}`);
  
  // Verificar alguns projetos atuais
  const { data: projetos, error: projetosError } = await supabase
    .from('dre_hitss')
    .select('projeto')
    .limit(10);
    
  if (projetosError) {
    console.error('Erro ao buscar projetos:', projetosError);
    return;
  }
  
  console.log('\n=== Exemplos de projetos atuais ===');
  projetos.forEach((p, index) => {
    console.log(`${index + 1}. "${p.projeto}"`);
  });
  
  // Verificar projetos únicos
  const { data: projetosUnicos, error: unicosError } = await supabase
    .from('dre_hitss')
    .select('projeto')
    .group('projeto')
    .limit(20);
    
  if (!unicosError && projetosUnicos) {
    console.log(`\n=== Total de projetos únicos (primeiros 20) ===`);
    projetosUnicos.forEach((p, index) => {
      console.log(`${index + 1}. "${p.projeto}"`);
    });
  }
  
  // Verificar se há projetos com formato correto (código - descrição)
  const projetosComFormato = projetos.filter(p => p.projeto.includes(' - '));
  console.log(`\n=== Análise do formato ===`);
  console.log(`Projetos com formato "Código - Descrição": ${projetosComFormato.length}/10`);
  
  if (projetosComFormato.length > 0) {
    console.log('Exemplos com formato correto:');
    projetosComFormato.forEach(p => console.log(`  - "${p.projeto}"`));
  }
  
  // Verificar alguns dados completos
  const { data: dadosCompletos, error: completosError } = await supabase
    .from('dre_hitss')
    .select('projeto, ano, mes, natureza, valor')
    .limit(5);
    
  if (!completosError && dadosCompletos) {
    console.log('\n=== Exemplos de dados completos ===');
    dadosCompletos.forEach((d, index) => {
      console.log(`${index + 1}. Projeto: "${d.projeto}", Ano: ${d.ano}, Mês: ${d.mes}, Natureza: ${d.natureza}, Valor: ${d.valor}`);
    });
  }
}

checkCurrentData().catch(console.error);