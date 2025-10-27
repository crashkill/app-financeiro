const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oomhhhfahdvavnhlbioa.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8'
);

async function checkProfissionais() {
  try {
    console.log('Verificando profissionais...');
    
    const { data, error } = await supabase
      .from('profissionais')
      .select('id, nome, email, ativo')
      .order('criado_em', { ascending: false });
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log('Total de profissionais:', data.length);
    console.log('Ativos:', data.filter(p => p.ativo).length);
    console.log('Inativos:', data.filter(p => !p.ativo).length);
    
    if (data.length > 0) {
      console.log('\nPrimeiros 5 profissionais:');
      data.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. ${p.nome} (${p.email}) - Ativo: ${p.ativo}`);
      });
    }
  } catch (err) {
    console.error('Erro na consulta:', err);
  }
}

checkProfissionais();