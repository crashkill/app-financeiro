// Mock dos hooks personalizados
export const useFinancialData = jest.fn().mockImplementation(() => ({
  data: {
    receitas: [
      { mes: 'Janeiro', valor: 100000, tipo: 'RECEITA DEVENGADA' },
      { mes: 'Fevereiro', valor: 120000, tipo: 'RECEITA DEVENGADA' }
    ],
    desoneracao: [
      { mes: 'Janeiro', valor: 5000, tipo: 'DESONERAÇÃO DA FOLHA' },
      { mes: 'Fevereiro', valor: 6000, tipo: 'DESONERAÇÃO DA FOLHA' }
    ],
    custos: [
      { mes: 'Janeiro', valor: -80000, tipo: 'CLT' },
      { mes: 'Fevereiro', valor: -85000, tipo: 'CLT' }
    ]
  },
  isLoading: false,
  error: null,
  refetch: jest.fn()
}));

export const useForecastData = jest.fn().mockImplementation(() => ({
  data: {
    receitas: [
      { mes: 'Janeiro', valor: 150000 },
      { mes: 'Fevereiro', valor: 160000 }
    ],
    custos: [
      { mes: 'Janeiro', valor: -100000 },
      { mes: 'Fevereiro', valor: -105000 }
    ]
  },
  isLoading: false,
  error: null,
  updateForecast: jest.fn()
}));

export const useProfissionaisData = jest.fn().mockImplementation(() => ({
  data: {
    profissionais: [
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
    ],
    transacoes: [
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
    ]
  },
  isLoading: false,
  error: null,
  refetch: jest.fn()
}));
