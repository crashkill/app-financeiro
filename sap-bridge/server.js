const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { DOMParser } = require('xmldom');

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(cors());
app.use(express.json());

// Estado da conexão SAP
let sapConnection = null;
let isConnected = false;

// Função para carregar servidores do arquivo SAPUILandscape.xml
function loadSapServersFromXml() {
  try {
    // Tenta encontrar o arquivo SAPUILandscape.xml em diferentes locais
    const possiblePaths = [
      path.join(__dirname, '..', 'src', 'services', 'SAPUILandscape.xml'),
      path.join(process.env.APPDATA || '', 'SAP', 'Common', 'SAPUILandscape.xml')
    ];

    let xmlContent = null;
    let xmlPath = null;

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        xmlContent = fs.readFileSync(p, 'utf-8');
        xmlPath = p;
        break;
      }
    }

    if (!xmlContent) {
      console.warn('Arquivo SAPUILandscape.xml não encontrado');
      return getDefaultServers();
    }

    console.log(`Carregando servidores SAP do arquivo: ${xmlPath}`);
    
    // Faz o parsing do XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Extrai os serviços SAP do XML
    const serviceNodes = xmlDoc.getElementsByTagName('Service');
    const servers = [];
    
    for (let i = 0; i < serviceNodes.length; i++) {
      const service = serviceNodes.item(i);
      if (service.getAttribute('type') === 'SAPGUI') {
        servers.push({
          name: service.getAttribute('name') || '',
          systemId: service.getAttribute('systemid') || '',
          server: service.getAttribute('server') || '',
          mode: parseInt(service.getAttribute('mode') || '1')
        });
      }
    }
    
    if (servers.length > 0) {
      console.log(`Carregados ${servers.length} servidores SAP do arquivo de configuração`);
      return servers;
    } else {
      console.warn('Nenhum servidor SAP encontrado no arquivo de configuração');
      return getDefaultServers();
    }
  } catch (error) {
    console.error('Erro ao carregar configurações do arquivo XML:', error);
    return getDefaultServers();
  }
}

// Servidores SAP padrão (fallback)
function getDefaultServers() {
  return [
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
}

// Rota para verificar status do servidor
app.get('/api/sap/status', (req, res) => {
  try {
    // Sempre retorna disponível em modo de simulação
    return res.json({ 
      status: 'available', 
      message: 'SAP Bridge está funcionando (modo simulação)',
      mode: 'simulation'
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Rota para obter servidores SAP disponíveis
app.get('/api/sap/servers', (req, res) => {
  try {
    const servers = loadSapServersFromXml();
    return res.json({ status: 'success', servers });
  } catch (error) {
    console.error('Erro ao obter servidores:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Rota para conectar ao SAP
app.post('/api/sap/connect', (req, res) => {
  try {
    const { server, systemId, username, password } = req.body;
    
    if (!server || !username || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Servidor, usuário e senha são obrigatórios' 
      });
    }
    
    // Em modo de simulação, sempre retorna sucesso
    isConnected = true;
    sapConnection = `sim-${Date.now()}`;
    
    console.log(`[SIMULAÇÃO] Conectado ao servidor ${systemId} (${server}) com o usuário ${username}`);
    
    return res.json({ 
      status: 'success', 
      message: 'Conectado ao SAP com sucesso (modo simulação)',
      connectionId: sapConnection,
      mode: 'simulation'
    });
  } catch (error) {
    console.error('Erro ao processar conexão:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Rota para executar transação SAP
app.post('/api/sap/execute', (req, res) => {
  try {
    if (!isConnected || !sapConnection) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Não há conexão ativa com o SAP' 
      });
    }
    
    const { transaction, parameters } = req.body;
    
    if (!transaction) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Código da transação é obrigatório' 
      });
    }
    
    console.log(`[SIMULAÇÃO] Executando transação ${transaction} com parâmetros:`, parameters);
    
    // Dados mockados para demonstração
    let resultados = [];
    
    switch (transaction) {
      case 'S_ALR_87013019': {
        resultados = mockFinancialReport(parameters);
        break;
      }
      
      case 'ME23N': {
        resultados = mockPurchaseOrder(parameters);
        break;
      }
      
      case 'FB03': {
        resultados = mockAccountingDocument(parameters);
        break;
      }
      
      case 'XD03': {
        resultados = mockCustomerData(parameters);
        break;
      }
      
      case 'MM03': {
        resultados = mockMaterialData(parameters);
        break;
      }
      
      default:
        return res.status(400).json({ 
          status: 'error', 
          message: `Transação ${transaction} não suportada no modo simulação` 
        });
    }
    
    return res.json({ 
      status: 'success', 
      data: {
        resultados
      },
      mode: 'simulation'
    });
  } catch (error) {
    console.error('Erro ao processar execução:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Rota para desconectar do SAP
app.post('/api/sap/disconnect', (req, res) => {
  try {
    if (!isConnected || !sapConnection) {
      return res.json({ 
        status: 'success', 
        message: 'Não há conexão ativa para desconectar' 
      });
    }
    
    // Em modo de simulação, apenas limpa o estado
    isConnected = false;
    sapConnection = null;
    
    console.log('[SIMULAÇÃO] Desconectado do SAP');
    
    return res.json({ 
      status: 'success', 
      message: 'Desconectado do SAP com sucesso (modo simulação)',
      mode: 'simulation'
    });
  } catch (error) {
    console.error('Erro ao processar desconexão:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Funções de mock para simulação

function mockFinancialReport(params) {
  const dataInicio = params.dataInicio || '01.01.2023';
  const dataFim = params.dataFim || '31.12.2023';
  const empresa = params.empresa || '1000';
  
  return [
    {
      id: 'FIN00123',
      description: `Receita de serviços - ${empresa}`,
      value: 152340.75,
      date: dataInicio,
      status: 'Processado'
    },
    {
      id: 'FIN00124',
      description: `Custo operacional - ${empresa}`,
      value: 87650.20,
      date: '18.07.2023',
      status: 'Processado'
    },
    {
      id: 'FIN00125',
      description: `Despesas administrativas - ${empresa}`,
      value: 34289.45,
      date: '22.07.2023',
      status: 'Processado'
    },
    {
      id: 'FIN00126',
      description: `Investimentos - ${empresa}`,
      value: 250000.00,
      date: dataFim,
      status: 'Pendente'
    }
  ];
}

function mockPurchaseOrder(params) {
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

function mockAccountingDocument(params) {
  const numeroDocumento = params.numeroDocumento || '100004567';
  const exercicio = params.exercicio || '2023';
  
  return [
    {
      id: numeroDocumento,
      description: `Lançamento contábil - ${exercicio}`,
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

function mockCustomerData(params) {
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

function mockMaterialData(params) {
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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor SAP Bridge rodando na porta ${PORT} (modo simulação)`);
  console.log(`Acesse: http://localhost:${PORT}/api/sap/status para verificar o status`);
}); 