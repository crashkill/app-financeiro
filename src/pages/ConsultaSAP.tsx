import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import SAPLogin from '../components/sap/SAPLogin';
import { sapGuiService } from '../services/SAPGuiService';

interface TransactionResult {
  id: string;
  description: string;
  value: number;
  date: string;
  status: string;
}

const ConsultaSAP: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [transactionCode, setTransactionCode] = useState('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [results, setResults] = useState<TransactionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);
  
  // Lista de transações mais comuns
  const commonTransactions = [
    { code: 'S_ALR_87013019', name: 'Relatório de Finanças' },
    { code: 'ME23N', name: 'Exibir Pedido de Compra' },
    { code: 'FB03', name: 'Exibir Documento Contábil' },
    { code: 'XD03', name: 'Exibir Cliente' },
    { code: 'MM03', name: 'Exibir Material' }
  ];

  // Campos específicos para cada transação
  const getTransactionFields = (transaction: string) => {
    switch (transaction) {
      case 'S_ALR_87013019':
        return [
          { id: 'dataInicio', label: 'Data Inicial (dd.mm.aaaa)', type: 'text' },
          { id: 'dataFim', label: 'Data Final (dd.mm.aaaa)', type: 'text' },
          { id: 'empresa', label: 'Código da Empresa', type: 'text' }
        ];
      case 'ME23N':
        return [
          { id: 'numeroPedido', label: 'Número do Pedido', type: 'text' }
        ];
      case 'FB03':
        return [
          { id: 'numeroDocumento', label: 'Número do Documento', type: 'text' },
          { id: 'exercicio', label: 'Exercício', type: 'text' }
        ];
      case 'XD03':
        return [
          { id: 'codigoCliente', label: 'Código do Cliente', type: 'text' }
        ];
      case 'MM03':
        return [
          { id: 'codigoMaterial', label: 'Código do Material', type: 'text' }
        ];
      default:
        return [];
    }
  };

  // Define os campos para a transação selecionada
  const transactionFields = getTransactionFields(transactionCode);

  // Limpa os parâmetros ao trocar de transação
  useEffect(() => {
    setParameters({});
    setResults([]);
    setError('');
    setMessage('');
  }, [transactionCode]);

  // Atualiza um parâmetro específico
  const handleParameterChange = (id: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Executa a transação com os parâmetros fornecidos
  const handleExecuteTransaction = async () => {
    if (!transactionCode) {
      setError('Selecione uma transação');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const response = await sapGuiService.executeTransaction(transactionCode, parameters);
      
      if (response.status === 'success') {
        setResults(response.data.resultados || []);
        setMessage('Consulta realizada com sucesso');
        
        // Verifica se está em modo de simulação
        if ((sapGuiService as any).useMock) {
          setIsMockMode(true);
        } else {
          setIsMockMode(false);
        }
      } else {
        setError('Erro ao executar a transação');
      }
    } catch (error) {
      console.error('Erro ao executar transação:', error);
      setError('Ocorreu um erro ao executar a transação. Verifique os parâmetros e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Método para desconectar do SAP
  const handleDisconnect = async () => {
    try {
      await sapGuiService.disconnect();
      setIsConnected(false);
      setTransactionCode('');
      setParameters({});
      setResults([]);
      setIsMockMode(false);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  // Verifica o status da conexão ao montar o componente
  useEffect(() => {
    const checkConnectionStatus = () => {
      const isActive = sapGuiService.isActiveConnection();
      setIsConnected(isActive);
      
      // Verifica se está em modo de simulação
      if ((sapGuiService as any).useMock) {
        setIsMockMode(true);
      }
    };
    
    checkConnectionStatus();
  }, []);

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">
        Consulta SAP
        {isMockMode && (
          <Badge bg="warning" className="ms-2">Modo Simulação</Badge>
        )}
      </h2>

      {!isConnected ? (
        <Row className="justify-content-center">
          <Col md={6}>
            <SAPLogin onLoginSuccess={() => setIsConnected(true)} />
          </Col>
        </Row>
      ) : (
        <>
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Configuração da Consulta</h5>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Desconectar
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Transação</Form.Label>
                      <Form.Select
                        value={transactionCode}
                        onChange={(e) => setTransactionCode(e.target.value)}
                      >
                        <option value="">Selecione uma transação</option>
                        {commonTransactions.map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.code} - {t.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    {transactionFields.map((field) => (
                      <Form.Group className="mb-3" key={field.id}>
                        <Form.Label>{field.label}</Form.Label>
                        <Form.Control
                          type={field.type}
                          value={parameters[field.id] || ''}
                          onChange={(e) => handleParameterChange(field.id, e.target.value)}
                        />
                      </Form.Group>
                    ))}

                    <Button 
                      variant="primary" 
                      onClick={handleExecuteTransaction}
                      disabled={loading || !transactionCode}
                      className="w-100"
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Executando...
                        </>
                      ) : (
                        'Executar Consulta'
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {message && (
            <Alert variant="success" className="mb-4">
              {message}
              {isMockMode && (
                <div className="mt-2">
                  <small className="text-muted">
                    <strong>Nota:</strong> Esta consulta está sendo executada em modo de simulação. 
                    Os dados exibidos são fictícios e não representam informações reais do SAP.
                  </small>
                </div>
              )}
            </Alert>
          )}

          {results.length > 0 && (
            <Row>
              <Col>
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Resultados da Consulta</h5>
                    {isMockMode && (
                      <Badge bg="warning">Dados Simulados</Badge>
                    )}
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result) => (
                            <tr key={result.id}>
                              <td>{result.id}</td>
                              <td>{result.description}</td>
                              <td>{result.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                              <td>{result.date}</td>
                              <td>{result.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

export default ConsultaSAP;