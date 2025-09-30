// Removendo imports de módulos Node.js que não são compatíveis com o navegador
import axios from 'axios';
import { DOMParser } from 'xmldom';

interface SAPServer {
  name: string;
  systemId: string;
  server: string;
  mode: number;
}

interface SAPCredentials {
  username: string;
  password: string;
}

interface SAPTransactionResult {
  status: string;
  data: any;
}

// URL base para o servidor local que se comunica com o SAP GUI
const SAP_BRIDGE_API = 'http://localhost:3030/api/sap';

export class SAPGuiService {
  private servers: SAPServer[] = [];
  private credentials: SAPCredentials | null = null;
  private currentServer: SAPServer | null = null;
  private isConnected: boolean = false;
  private useMock: boolean = false; // Flag para usar mock ou conexão real

  constructor() {
    // Carrega as configurações do SAP ao inicializar o serviço
    this.loadSAPGUIConfigFromXML();
  }

  /**
   * Carrega as configurações do SAP
   */
  private loadSAPGUIConfigFromXML(): void {
    try {
      // No ambiente do navegador, não podemos ler arquivos do sistema de arquivos
      // Carregamos diretamente os servidores padrão
      this.loadDefaultServers();
      
      // Em uma implementação real, poderíamos buscar a configuração de uma API
      // Por exemplo:
      // axios.get('/api/sap-config').then(response => {
      //   const xmlContent = response.data;
      //   // Processar o XML...
      // });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      this.loadDefaultServers();
    }
  }

  /**
   * Carrega servidores SAP padrão (fallback)
   */
  private loadDefaultServers(): void {
    this.servers = [
      {
        name: "ECQ Projeto",
        systemId: "ECQ",
        server: "brux1463:3200",
        mode: 1
      },
      {
        name: "PROD - VPN",
        systemId: "PRH",
        server: "10.177.23.202:3200",
        mode: 1
      },
      {
        name: "QA - MPLS",
        systemId: "QAH",
        server: "10.230.22.74:3200",
        mode: 1
      },
      {
        name: "PRODUÇÃO CLARO",
        systemId: "ECP",
        server: "brux1500:3200",
        mode: 1
      },
      {
        name: "PROD-MPLS",
        systemId: "PRH",
        server: "10.230.22.72:3200",
        mode: 1
      }
    ];
    console.log('Usando servidores SAP padrão');
  }

  /**
   * Verifica se o servidor de ponte SAP está disponível
   */
  private async checkSAPBridgeAvailability(): Promise<boolean> {
    try {
      const response = await axios.get(`${SAP_BRIDGE_API}/status`);
      return response.data.status === 'available';
    } catch (error) {
      console.warn('Servidor de ponte SAP não disponível, usando modo simulação:', error);
      this.useMock = true;
      return false;
    }
  }

  /**
   * Lê as informações do arquivo de configuração do SAP GUI
   * Isto permite sincronizar com as configurações do SAP GUI do Windows
   */
  public async loadSAPGUIConfig(): Promise<void> {
    try {
      // Verifica se o servidor de ponte está disponível
      const bridgeAvailable = await this.checkSAPBridgeAvailability();
      
      if (bridgeAvailable) {
        // Carrega servidores do SAP GUI real
        const response = await axios.get(`${SAP_BRIDGE_API}/servers`);
        if (response.data && response.data.servers) {
          this.servers = response.data.servers;
          console.log('Servidores SAP carregados com sucesso:', this.servers.length);
        }
      } else {
        console.log('Usando servidores SAP do arquivo de configuração (modo simulação)');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do SAP GUI:', error);
    }
  }

  /**
   * Conecta ao servidor SAP
   */
  public async connect(serverId: string, credentials: SAPCredentials): Promise<boolean> {
    try {
      const server = this.servers.find(s => s.systemId === serverId);
      if (!server) {
        throw new Error('Servidor SAP não encontrado');
      }

      this.currentServer = server;
      this.credentials = credentials;
      
      console.log(`Conectando ao servidor ${server.name} (${server.server}) com o usuário ${credentials.username}`);

      // Verifica se deve usar mock ou conexão real
      if (!this.useMock) {
        try {
          // Tenta conexão real via API de ponte
          const response = await axios.post(`${SAP_BRIDGE_API}/connect`, {
            server: server.server,
            systemId: server.systemId,
            username: credentials.username,
            password: credentials.password
          });
          
          if (response.data && response.data.status === 'success') {
            this.isConnected = true;
            console.log('Conexão real com SAP GUI estabelecida com sucesso');
            return true;
          } else {
            throw new Error('Falha na conexão: ' + (response.data?.message || 'Erro desconhecido'));
          }
        } catch (error) {
          console.warn('Erro na conexão real, alternando para modo simulação:', error);
          this.useMock = true;
        }
      }
      
      // Modo simulação (fallback)
      if (this.useMock) {
        // Simulação de validação de credenciais
        if (credentials.username && credentials.password) {
          this.isConnected = true;
          console.log('Conexão simulada com o SAP estabelecida');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao conectar ao SAP:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Executa uma transação SAP
   */
  public async executeTransaction(transaction: string, parameters: any = {}): Promise<SAPTransactionResult> {
    if (!this.currentServer || !this.credentials || !this.isConnected) {
      throw new Error('Não há conexão ativa com o SAP');
    }

    try {
      console.log(`Executando transação ${transaction} com parâmetros:`, parameters);
      
      // Verifica se deve usar mock ou conexão real
      if (!this.useMock) {
        try {
          // Tenta executar transação real via API de ponte
          const response = await axios.post(`${SAP_BRIDGE_API}/execute`, {
            transaction,
            parameters
          });
          
          if (response.data && response.data.status === 'success') {
            console.log('Transação executada com sucesso no SAP real');
            return response.data;
          } else {
            throw new Error('Falha na execução: ' + (response.data?.message || 'Erro desconhecido'));
          }
        } catch (error) {
          console.warn('Erro na execução real, alternando para modo simulação:', error);
          this.useMock = true;
        }
      }
      
      // Modo simulação (fallback)
      if (this.useMock) {
        // Dados mockados para demonstração
        switch (transaction) {
          case 'S_ALR_87013019': {
            return {
              status: 'success',
              data: {
                resultados: this.mockFinancialReport(parameters)
              }
            };
          }
          
          case 'ME23N': {
            return {
              status: 'success',
              data: {
                resultados: this.mockPurchaseOrder(parameters)
              }
            };
          }
          
          case 'FB03': {
            return {
              status: 'success',
              data: {
                resultados: this.mockAccountingDocument(parameters)
              }
            };
          }
          
          case 'XD03': {
            return {
              status: 'success',
              data: {
                resultados: this.mockCustomerData(parameters)
              }
            };
          }
          
          case 'MM03': {
            return {
              status: 'success',
              data: {
                resultados: this.mockMaterialData(parameters)
              }
            };
          }
          
          default:
            throw new Error(`Transação ${transaction} não suportada no modo simulação`);
        }
      }
    } catch (error) {
      console.error(`Erro ao executar transação ${transaction}:`, error);
      throw error;
    }
  }

  /**
   * Dados mockados para relatório financeiro
   */
  private mockFinancialReport(params: any) {
    return [
      {
        id: 'FIN00123',
        description: 'Receita de serviços',
        value: 152340.75,
        date: '15.07.2023',
        status: 'Processado'
      },
      {
        id: 'FIN00124',
        description: 'Custo operacional',
        value: 87650.20,
        date: '18.07.2023',
        status: 'Processado'
      },
      {
        id: 'FIN00125',
        description: 'Despesas administrativas',
        value: 34289.45,
        date: '22.07.2023',
        status: 'Processado'
      },
      {
        id: 'FIN00126',
        description: 'Investimentos',
        value: 250000.00,
        date: '25.07.2023',
        status: 'Pendente'
      }
    ];
  }

  /**
   * Dados mockados para pedido de compra
   */
  private mockPurchaseOrder(params: any) {
    const numeroPedido = params.numeroPedido || '4500012345';
    
    return [
      {
        id: numeroPedido,
        description: 'Compra de equipamentos de TI',
        value: 87500.00,
        date: '10.06.2023',
        status: 'Aprovado'
      },
      {
        id: `${numeroPedido}-1`,
        description: 'Item 1: Notebooks Dell XPS',
        value: 45000.00,
        date: '10.06.2023',
        status: 'Entregue'
      },
      {
        id: `${numeroPedido}-2`,
        description: 'Item 2: Monitores Ultrawide',
        value: 28500.00,
        date: '15.06.2023',
        status: 'Entregue'
      },
      {
        id: `${numeroPedido}-3`,
        description: 'Item 3: Periféricos',
        value: 14000.00,
        date: '18.06.2023',
        status: 'Em trânsito'
      }
    ];
  }

  /**
   * Dados mockados para documento contábil
   */
  private mockAccountingDocument(params: any) {
    const numeroDocumento = params.numeroDocumento || '100004567';
    
    return [
      {
        id: numeroDocumento,
        description: 'Lançamento contábil',
        value: 67890.45,
        date: '30.06.2023',
        status: 'Contabilizado'
      },
      {
        id: `${numeroDocumento}/1`,
        description: 'Débito: Despesas operacionais',
        value: 67890.45,
        date: '30.06.2023',
        status: 'Contabilizado'
      },
      {
        id: `${numeroDocumento}/2`,
        description: 'Crédito: Contas a pagar',
        value: 67890.45,
        date: '30.06.2023',
        status: 'Contabilizado'
      }
    ];
  }

  /**
   * Dados mockados para cliente
   */
  private mockCustomerData(params: any) {
    const codigoCliente = params.codigoCliente || '1000123';
    
    return [
      {
        id: codigoCliente,
        description: 'Empresa XPTO Serviços Ltda.',
        value: 0,
        date: '01.01.2022',
        status: 'Ativo'
      },
      {
        id: `${codigoCliente}/F`,
        description: 'Faturamento total último trimestre',
        value: 345670.89,
        date: '30.06.2023',
        status: 'Registrado'
      },
      {
        id: `${codigoCliente}/P`,
        description: 'Pagamentos em aberto',
        value: 45670.23,
        date: '30.06.2023',
        status: 'Pendente'
      }
    ];
  }

  /**
   * Dados mockados para material
   */
  private mockMaterialData(params: any) {
    const codigoMaterial = params.codigoMaterial || 'MAT00123';
    
    return [
      {
        id: codigoMaterial,
        description: 'Servidor de Rack PowerEdge R740',
        value: 25789.90,
        date: '01.05.2023',
        status: 'Ativo'
      },
      {
        id: `${codigoMaterial}/E`,
        description: 'Estoque total',
        value: 154739.40,
        date: '30.06.2023',
        status: 'Disponível'
      },
      {
        id: `${codigoMaterial}/C`,
        description: 'Compras em andamento',
        value: 51579.80,
        date: '15.07.2023',
        status: 'Em processamento'
      }
    ];
  }

  /**
   * Desconecta do SAP
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (!this.useMock) {
        try {
          // Tenta desconexão real via API de ponte
          await axios.post(`${SAP_BRIDGE_API}/disconnect`);
        } catch (error) {
          console.warn('Erro na desconexão real:', error);
        }
      }
      
      // Limpa o estado independentemente do resultado
      this.isConnected = false;
      this.currentServer = null;
      this.credentials = null;
      console.log('Desconectado do SAP');
    } catch (error) {
      console.error('Erro ao desconectar do SAP:', error);
      throw error;
    }
  }

  /**
   * Retorna a lista de servidores disponíveis
   */
  public getAvailableServers(): SAPServer[] {
    return this.servers;
  }

  /**
   * Verifica se há uma conexão ativa
   */
  public isActiveConnection(): boolean {
    return this.isConnected;
  }

  /**
   * Retorna o servidor atual
   */
  public getCurrentServer(): SAPServer | null {
    return this.currentServer;
  }
}

// Exporta uma instância única do serviço
export const sapGuiService = new SAPGuiService();