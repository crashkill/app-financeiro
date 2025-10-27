const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oomhhhfahdvavnhlbioa.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8'
);

async function createTestData() {
  console.log('🔧 Criando dados de teste para profissionais...\n');

  const profissionaisTest = [
    {
      nome: 'João Silva Teste',
      email: 'joao.teste@exemplo.com',
      telefone: '(11) 99999-0001',
      departamento: 'TI',
      cargo: 'Desenvolvedor',
      regime_trabalho: 'CLT',
      local_alocacao: 'Remoto',
      ativo: true
    },
    {
      nome: 'Maria Santos Teste',
      email: 'maria.teste@exemplo.com',
      telefone: '(11) 99999-0002',
      departamento: 'TI',
      cargo: 'Analista',
      regime_trabalho: 'PJ',
      local_alocacao: 'Presencial',
      ativo: true
    },
    {
      nome: 'Pedro Costa Teste',
      email: 'pedro.teste@exemplo.com',
      telefone: '(11) 99999-0003',
      departamento: 'TI',
      cargo: 'Tech Lead',
      regime_trabalho: 'CLT',
      local_alocacao: 'Híbrido',
      ativo: true
    },
    {
      nome: 'Ana Oliveira Teste',
      email: 'ana.teste@exemplo.com',
      telefone: '(11) 99999-0004',
      departamento: 'Design',
      cargo: 'UX Designer',
      regime_trabalho: 'PJ',
      local_alocacao: 'Remoto',
      ativo: true
    },
    {
      nome: 'Carlos Ferreira Teste',
      email: 'carlos.teste@exemplo.com',
      telefone: '(11) 99999-0005',
      departamento: 'TI',
      cargo: 'DevOps',
      regime_trabalho: 'CLT',
      local_alocacao: 'Presencial',
      ativo: true
    }
  ];

  console.log(`Inserindo ${profissionaisTest.length} profissionais de teste...`);

  for (const prof of profissionaisTest) {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .insert([prof])
        .select();

      if (error) {
        console.error(`❌ Erro ao criar ${prof.nome}:`, error.message);
      } else {
        console.log(`✅ Criado: ${prof.nome} - ID: ${data[0].id}`);
      }
    } catch (err) {
      console.error(`❌ Erro inesperado ao criar ${prof.nome}:`, err.message);
    }
  }

  // Verificar dados criados
  console.log('\n📊 Verificando dados criados...');
  const { data: allProfs, error: listError } = await supabase
    .from('profissionais')
    .select('id, nome, email, ativo')
    .order('criado_em', { ascending: false });

  if (listError) {
    console.error('❌ Erro ao listar profissionais:', listError);
    return;
  }

  console.log(`Total de profissionais: ${allProfs.length}`);
  console.log(`Ativos: ${allProfs.filter(p => p.ativo).length}`);
  console.log(`Inativos: ${allProfs.filter(p => !p.ativo).length}`);

  console.log('\n✅ Dados de teste criados com sucesso!');
}

createTestData().catch(console.error);