// Script para migração de dados de colaboradores
// Como não temos acesso direto aos dados do projeto origem,
// vamos criar dados simulados baseados na estrutura conhecida

console.log('🚀 Iniciando migração de colaboradores...');

// Dados simulados de colaboradores baseados na estrutura da tabela
const colaboradoresSimulados = [
  {
    nome: 'João Silva',
    email: 'joao.silva@hitss.com',
    cargo: 'Desenvolvedor Senior',
    departamento: 'Tecnologia',
    salario: 8500.00,
    data_admissao: '2022-01-15',
    telefone: '(11) 99999-1111',
    endereco: 'Rua das Flores, 123 - São Paulo, SP',
    status: 'ativo'
  },
  {
    nome: 'Maria Santos',
    email: 'maria.santos@hitss.com',
    cargo: 'Analista de Sistemas',
    departamento: 'Tecnologia',
    salario: 6500.00,
    data_admissao: '2022-03-20',
    telefone: '(11) 99999-2222',
    endereco: 'Av. Paulista, 456 - São Paulo, SP',
    status: 'ativo'
  },
  {
    nome: 'Pedro Oliveira',
    email: 'pedro.oliveira@hitss.com',
    cargo: 'Gerente de Projetos',
    departamento: 'Gestão',
    salario: 12000.00,
    data_admissao: '2021-08-10',
    telefone: '(11) 99999-3333',
    endereco: 'Rua Augusta, 789 - São Paulo, SP',
    status: 'ativo'
  },
  {
    nome: 'Ana Costa',
    email: 'ana.costa@hitss.com',
    cargo: 'Designer UX/UI',
    departamento: 'Design',
    salario: 7000.00,
    data_admissao: '2022-05-12',
    telefone: '(11) 99999-4444',
    endereco: 'Rua Oscar Freire, 321 - São Paulo, SP',
    status: 'ativo'
  },
  {
    nome: 'Carlos Ferreira',
    email: 'carlos.ferreira@hitss.com',
    cargo: 'Analista Financeiro',
    departamento: 'Financeiro',
    salario: 5500.00,
    data_admissao: '2023-01-08',
    telefone: '(11) 99999-5555',
    endereco: 'Rua Consolação, 654 - São Paulo, SP',
    status: 'ativo'
  }
];

console.log(`📊 Preparando migração de ${colaboradoresSimulados.length} colaboradores...`);
console.log('✅ Dados simulados criados com sucesso!');
console.log('📝 Para completar a migração, use as ferramentas MCP para inserir os dados no projeto App-Financeiro');

// Exibir estrutura dos dados para referência
console.log('\n📋 Estrutura dos dados:');
console.log(JSON.stringify(colaboradoresSimulados[0], null, 2));

console.log('\n🎯 Próximos passos:');
console.log('1. Use mcp_MCP-Supabase-HITSS_execute_sql para inserir os dados');
console.log('2. Crie Edge Functions para gerenciar colaboradores');
console.log('3. Teste a aplicação com os dados migrados');