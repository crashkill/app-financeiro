import { AppDatabase } from '../db/database';

// Mock do banco de dados
export const db = {
  transacoes: {
    toArray: jest.fn().mockResolvedValue([
      {
        id: 1,
        periodo: '01/2024',
        valor: -8000,
        tipo: 'CLT',
        projeto: 'Projeto A',
        contaResumo: 'CLT',
        denominacaoConta: 'Salário João Silva',
        descricao: 'Salário Janeiro'
      },
      {
        id: 2,
        periodo: '01/2024',
        valor: -10000,
        tipo: 'PJ',
        projeto: 'Projeto B',
        contaResumo: 'SUBCONTRATADOS',
        denominacaoConta: 'Pagamento Maria Santos',
        descricao: 'Pagamento Janeiro'
      }
    ]),
    clear: jest.fn().mockResolvedValue(undefined),
    bulkAdd: jest.fn().mockResolvedValue(undefined),
    hook: jest.fn()
  },
  profissionais: {
    toArray: jest.fn().mockResolvedValue([
      {
        id: 1,
        nome: 'João Silva',
        cargo: 'Desenvolvedor',
        projeto: 'Projeto A',
        custo: 8000,
        tipo: 'CLT'
      },
      {
        id: 2,
        nome: 'Maria Santos',
        cargo: 'Analista',
        projeto: 'Projeto B',
        custo: 10000,
        tipo: 'PJ'
      }
    ]),
    clear: jest.fn().mockResolvedValue(undefined),
    bulkAdd: jest.fn().mockResolvedValue(undefined),
    hook: jest.fn()
  },
  transaction: jest.fn().mockImplementation((mode, tables, callback) => callback())
} as unknown as AppDatabase;
