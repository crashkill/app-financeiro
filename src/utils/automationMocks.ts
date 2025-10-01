/**
 * Mocks para Edge Functions e dados de teste da automação HITSS
 */

export interface MockCompany {
  id: number;
  name: string;
  code: string;
  country: string;
  currency: string;
  timezone: string;
}

export interface MockProject {
  id: number;
  name: string;
  code: string;
  companyId: number;
  status: 'active' | 'inactive' | 'completed';
  startDate: string;
  endDate?: string;
  budget: number;
}

export interface MockFinancialRecord {
  id: number;
  projectId: number;
  type: 'revenue' | 'expense' | 'investment' | 'cost';
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface MockExecutionResult {
  success: boolean;
  executionId: string;
  recordsProcessed: number;
  duration: number;
  timestamp: string;
  data: {
    companies: MockCompany[];
    projects: MockProject[];
    financialRecords: MockFinancialRecord[];
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Dados mock para empresas HITSS
 */
export const mockCompanies: MockCompany[] = [
  {
    id: 1,
    name: 'HITSS Brasil',
    code: 'HITSS_BR',
    country: 'Brasil',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  },
  {
    id: 2,
    name: 'HITSS Mexico',
    code: 'HITSS_MX',
    country: 'México',
    currency: 'MXN',
    timezone: 'America/Mexico_City'
  },
  {
    id: 3,
    name: 'HITSS Colombia',
    code: 'HITSS_CO',
    country: 'Colômbia',
    currency: 'COP',
    timezone: 'America/Bogota'
  },
  {
    id: 4,
    name: 'HITSS Argentina',
    code: 'HITSS_AR',
    country: 'Argentina',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  {
    id: 5,
    name: 'HITSS Chile',
    code: 'HITSS_CL',
    country: 'Chile',
    currency: 'CLP',
    timezone: 'America/Santiago'
  }
];

/**
 * Dados mock para projetos
 */
export const mockProjects: MockProject[] = [
  {
    id: 1,
    name: 'Transformação Digital Bancária',
    code: 'TDB_2024',
    companyId: 1,
    status: 'active',
    startDate: '2024-01-15',
    budget: 2500000
  },
  {
    id: 2,
    name: 'Modernização SAP',
    code: 'SAP_MOD_2024',
    companyId: 1,
    status: 'active',
    startDate: '2024-02-01',
    budget: 1800000
  },
  {
    id: 3,
    name: 'Implementação Cloud AWS',
    code: 'AWS_IMPL_2024',
    companyId: 2,
    status: 'active',
    startDate: '2024-03-10',
    budget: 3200000
  },
  {
    id: 4,
    name: 'Automação RPA',
    code: 'RPA_AUTO_2024',
    companyId: 3,
    status: 'completed',
    startDate: '2023-11-01',
    endDate: '2024-01-31',
    budget: 950000
  },
  {
    id: 5,
    name: 'Migração Data Center',
    code: 'DC_MIG_2024',
    companyId: 4,
    status: 'active',
    startDate: '2024-01-20',
    budget: 1500000
  }
];

/**
 * Dados mock para registros financeiros
 */
export const mockFinancialRecords: MockFinancialRecord[] = [
  // Projeto 1 - Transformação Digital Bancária
  {
    id: 1,
    projectId: 1,
    type: 'revenue',
    category: 'Consultoria',
    amount: 450000,
    currency: 'BRL',
    date: '2024-01-31',
    description: 'Receita de consultoria - Janeiro 2024'
  },
  {
    id: 2,
    projectId: 1,
    type: 'expense',
    category: 'Recursos Humanos',
    amount: 280000,
    currency: 'BRL',
    date: '2024-01-31',
    description: 'Salários e encargos - Janeiro 2024'
  },
  {
    id: 3,
    projectId: 1,
    type: 'expense',
    category: 'Infraestrutura',
    amount: 85000,
    currency: 'BRL',
    date: '2024-01-31',
    description: 'Custos de infraestrutura cloud'
  },
  // Projeto 2 - Modernização SAP
  {
    id: 4,
    projectId: 2,
    type: 'revenue',
    category: 'Implementação',
    amount: 320000,
    currency: 'BRL',
    date: '2024-02-29',
    description: 'Receita de implementação SAP'
  },
  {
    id: 5,
    projectId: 2,
    type: 'expense',
    category: 'Licenças',
    amount: 150000,
    currency: 'BRL',
    date: '2024-02-29',
    description: 'Licenças SAP'
  },
  // Projeto 3 - Implementação Cloud AWS
  {
    id: 6,
    projectId: 3,
    type: 'revenue',
    category: 'Cloud Services',
    amount: 580000,
    currency: 'MXN',
    date: '2024-03-31',
    description: 'Receita serviços cloud'
  },
  {
    id: 7,
    projectId: 3,
    type: 'expense',
    category: 'AWS Costs',
    amount: 120000,
    currency: 'MXN',
    date: '2024-03-31',
    description: 'Custos AWS'
  },
  // Projeto 4 - Automação RPA
  {
    id: 8,
    projectId: 4,
    type: 'revenue',
    category: 'Automação',
    amount: 420000,
    currency: 'COP',
    date: '2024-01-31',
    description: 'Receita projeto RPA'
  },
  {
    id: 9,
    projectId: 4,
    type: 'expense',
    category: 'Desenvolvimento',
    amount: 180000,
    currency: 'COP',
    date: '2024-01-31',
    description: 'Custos de desenvolvimento'
  },
  // Projeto 5 - Migração Data Center
  {
    id: 10,
    projectId: 5,
    type: 'revenue',
    category: 'Migração',
    amount: 350000,
    currency: 'ARS',
    date: '2024-02-29',
    description: 'Receita migração DC'
  }
];

/**
 * Mock da Edge Function para processamento de automação
 */
export class MockEdgeFunction {
  /**
   * Simula o processamento da Edge Function
   */
  static async processAutomation(
    scenario: 'success' | 'error' | 'timeout' = 'success',
    delay: number = 2000
  ): Promise<MockExecutionResult> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const executionId = `mock-exec-${Date.now()}`;
        const timestamp = new Date().toISOString();
        
        switch (scenario) {
          case 'error':
            reject({
              success: false,
              executionId,
              timestamp,
              error: 'Simulação de erro na Edge Function',
              details: 'Falha na conexão com o banco de dados'
            });
            break;
            
          case 'timeout':
            // Simula timeout após 8 segundos
            setTimeout(() => {
              reject({
                success: false,
                executionId,
                timestamp,
                error: 'Timeout na execução',
                details: 'Processamento excedeu o limite de tempo'
              });
            }, 8000);
            break;
            
          default: // success
            const recordsProcessed = 150 + Math.floor(Math.random() * 50);
            resolve({
              success: true,
              executionId,
              recordsProcessed,
              duration: delay + Math.floor(Math.random() * 1000),
              timestamp,
              data: {
                companies: mockCompanies,
                projects: mockProjects,
                financialRecords: mockFinancialRecords
              },
              warnings: recordsProcessed > 180 ? ['Alto volume de registros processados'] : undefined
            });
        }
      }, delay);
    });
  }

  /**
   * Simula validação de dados
   */
  static async validateData(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary: Record<string, number>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Simular algumas validações
    const invalidProjects = mockProjects.filter(p => p.budget <= 0);
    const futureRecords = mockFinancialRecords.filter(r => new Date(r.date) > new Date());
    const missingDescriptions = mockFinancialRecords.filter(r => !r.description || r.description.trim() === '');
    
    if (invalidProjects.length > 0) {
      errors.push(`${invalidProjects.length} projetos com orçamento inválido`);
    }
    
    if (futureRecords.length > 0) {
      warnings.push(`${futureRecords.length} registros com data futura`);
    }
    
    if (missingDescriptions.length > 0) {
      warnings.push(`${missingDescriptions.length} registros sem descrição`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalCompanies: mockCompanies.length,
        totalProjects: mockProjects.length,
        totalRecords: mockFinancialRecords.length,
        activeProjects: mockProjects.filter(p => p.status === 'active').length,
        totalRevenue: mockFinancialRecords
          .filter(r => r.type === 'revenue')
          .reduce((sum, r) => sum + r.amount, 0),
        totalExpenses: mockFinancialRecords
          .filter(r => r.type === 'expense')
          .reduce((sum, r) => sum + r.amount, 0)
      }
    };
  }

  /**
   * Simula limpeza de dados
   */
  static async cleanupData(): Promise<{
    success: boolean;
    itemsRemoved: number;
    message: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const itemsRemoved = Math.floor(Math.random() * 50) + 10;
    
    return {
      success: true,
      itemsRemoved,
      message: `${itemsRemoved} registros de teste removidos com sucesso`
    };
  }
}

/**
 * Gerador de dados de teste aleatórios
 */
export class MockDataGenerator {
  /**
   * Gera registros financeiros aleatórios
   */
  static generateFinancialRecords(count: number, projectIds: number[]): MockFinancialRecord[] {
    const categories = {
      revenue: ['Consultoria', 'Implementação', 'Suporte', 'Licenciamento', 'Treinamento'],
      expense: ['Recursos Humanos', 'Infraestrutura', 'Licenças', 'Viagens', 'Equipamentos'],
      investment: ['Pesquisa', 'Desenvolvimento', 'Capacitação', 'Tecnologia'],
      cost: ['Operacional', 'Administrativo', 'Marketing', 'Vendas']
    };
    
    const types = Object.keys(categories) as Array<keyof typeof categories>;
    const currencies = ['BRL', 'USD', 'MXN', 'COP', 'ARS', 'CLP'];
    
    return Array.from({ length: count }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const category = categories[type][Math.floor(Math.random() * categories[type].length)];
      const projectId = projectIds[Math.floor(Math.random() * projectIds.length)];
      
      // Gerar data aleatória nos últimos 6 meses
      const date = new Date();
      date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
      
      return {
        id: 1000 + i,
        projectId,
        type,
        category,
        amount: Math.floor(Math.random() * 500000) + 10000,
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        date: date.toISOString().split('T')[0],
        description: `${category} - ${type} gerado automaticamente`,
        metadata: {
          generated: true,
          timestamp: new Date().toISOString()
        }
      };
    });
  }
  
  /**
   * Gera projetos aleatórios
   */
  static generateProjects(count: number, companyIds: number[]): MockProject[] {
    const projectNames = [
      'Transformação Digital',
      'Modernização Sistemas',
      'Implementação Cloud',
      'Automação Processos',
      'Migração Dados',
      'Integração APIs',
      'Desenvolvimento Mobile',
      'Analytics Avançado',
      'Segurança Cibernética',
      'IoT Industrial'
    ];
    
    const statuses: Array<'active' | 'inactive' | 'completed'> = ['active', 'active', 'active', 'completed', 'inactive'];
    
    return Array.from({ length: count }, (_, i) => {
      const name = projectNames[Math.floor(Math.random() * projectNames.length)];
      const year = new Date().getFullYear();
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Gerar data de início aleatória
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
      
      const project: MockProject = {
        id: 100 + i,
        name: `${name} ${year}`,
        code: `${name.replace(/\s+/g, '_').toUpperCase()}_${year}`,
        companyId: companyIds[Math.floor(Math.random() * companyIds.length)],
        status,
        startDate: startDate.toISOString().split('T')[0],
        budget: Math.floor(Math.random() * 5000000) + 500000
      };
      
      // Adicionar data de fim se o projeto estiver completo
      if (status === 'completed') {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 1);
        project.endDate = endDate.toISOString().split('T')[0];
      }
      
      return project;
    });
  }
}

/**
 * Utilitários para testes
 */
export const mockUtils = {
  /**
   * Simula delay de rede
   */
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Gera ID único para testes
   */
  generateId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * Simula erro de rede
   */
  simulateNetworkError: () => {
    throw new Error('Erro de conectividade simulado');
  },
  
  /**
   * Formata valores monetários para exibição
   */
  formatCurrency: (amount: number, currency: string) => {
    const formatters: Record<string, Intl.NumberFormat> = {
      BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      MXN: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }),
      COP: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }),
      ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }),
      CLP: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
    };
    
    return formatters[currency]?.format(amount) || `${currency} ${amount.toLocaleString()}`;
  }
};

export default {
  MockEdgeFunction,
  MockDataGenerator,
  mockCompanies,
  mockProjects,
  mockFinancialRecords,
  mockUtils
};