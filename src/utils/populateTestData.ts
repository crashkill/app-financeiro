import { db } from '../db/database';

export const populateTestData = async () => {
  try {
    console.log('Iniciando população de dados de teste...');
    
    // Verificar se já existem dados
    const count = await db.transacoes.count();
    if (count > 0) {
      console.log(`Banco já possui ${count} transações. Pulando população.`);
      return;
    }
    
    // Dados de teste
    const testTransactions = [
      {
        tipo: 'receita' as const,
        natureza: 'RECEITA' as const,
        descricao: 'Projeto Alpha',
        valor: 50000,
        data: '2024-01-15',
        categoria: 'Desenvolvimento',
        lancamento: 1001,
        projeto: 'Projeto Alpha',
        periodo: '1/2024',
        denominacaoConta: 'Receita de Serviços',
        contaResumo: 'Receita'
      },
      {
        tipo: 'despesa' as const,
        natureza: 'CUSTO' as const,
        descricao: 'Projeto Alpha',
        valor: 15000,
        data: '2024-01-20',
        categoria: 'Pessoal',
        lancamento: 1002,
        projeto: 'Projeto Alpha',
        periodo: '1/2024',
        denominacaoConta: 'Salários',
        contaResumo: 'Custo'
      },
      {
        tipo: 'receita' as const,
        natureza: 'RECEITA' as const,
        descricao: 'Projeto Beta',
        valor: 75000,
        data: '2024-02-10',
        categoria: 'Consultoria',
        lancamento: 1003,
        projeto: 'Projeto Beta',
        periodo: '2/2024',
        denominacaoConta: 'Receita de Consultoria',
        contaResumo: 'Receita'
      },
      {
        tipo: 'despesa' as const,
        natureza: 'CUSTO' as const,
        descricao: 'Projeto Beta',
        valor: 25000,
        data: '2024-02-15',
        categoria: 'Infraestrutura',
        lancamento: 1004,
        projeto: 'Projeto Beta',
        periodo: '2/2024',
        denominacaoConta: 'Custos de Infraestrutura',
        contaResumo: 'Custo'
      },
      {
        tipo: 'receita' as const,
        natureza: 'RECEITA' as const,
        descricao: 'Projeto Gamma',
        valor: 100000,
        data: '2024-03-05',
        categoria: 'Desenvolvimento',
        lancamento: 1005,
        projeto: 'Projeto Gamma',
        periodo: '3/2024',
        denominacaoConta: 'Receita de Desenvolvimento',
        contaResumo: 'Receita'
      }
    ];
    
    // Inserir dados de teste
    await db.transacoes.bulkAdd(testTransactions);
    
    const newCount = await db.transacoes.count();
    console.log(`Dados de teste inseridos com sucesso! Total de transações: ${newCount}`);
    
    return newCount;
    
  } catch (error) {
    console.error('Erro ao popular dados de teste:', error);
    throw error;
  }
};