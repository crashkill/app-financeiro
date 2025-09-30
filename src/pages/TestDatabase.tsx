import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { db } from '../db/database';
import { populateTestData } from '../utils/populateTestData';

const TestDatabase = () => {
  const [status, setStatus] = useState<string>('Iniciando teste...');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handlePopulateTestData = async () => {
    try {
      setStatus('Populando dados de teste...');
      addLog('Iniciando população de dados de teste');
      
      const count = await populateTestData();
      addLog(`Dados de teste inseridos com sucesso! Total: ${count}`);
      
      // Executar teste após popular
      await testDatabase();
      
    } catch (error: any) {
      const errorMessage = `Erro ao popular dados: ${error?.message || 'Erro desconhecido'}`;
      addLog(errorMessage);
      setError(errorMessage);
    }
  };

  const testDatabase = async () => {
    try {
      setStatus('Testando banco de dados...');
      setError(null);
      if (logs.length === 0) setLogs([]);

      addLog('Iniciando teste do banco de dados');
      addLog(`Banco está aberto: ${db.isOpen()}`);

      // Verificar se o banco está aberto
      if (!db.isOpen()) {
        addLog('Tentando abrir o banco...');
        await db.open();
        addLog('Banco aberto com sucesso');
      }

      // Contar transações
      const count = await db.transacoes.count();
      addLog(`Número total de transações: ${count}`);

      // Listar algumas transações
      const transacoes = await db.transacoes.limit(3).toArray();
      addLog(`Primeiras 3 transações carregadas: ${transacoes.length}`);
      
      if (transacoes.length > 0) {
        addLog(`Primeira transação: ${JSON.stringify(transacoes[0], null, 2)}`);
      } else {
        addLog('Nenhuma transação encontrada no banco');
      }

      // Verificar tabelas disponíveis
      const tables = db.tables.map(table => table.name);
      addLog(`Tabelas disponíveis: ${tables.join(', ')}`);

      setStatus('Teste concluído com sucesso!');

    } catch (error: any) {
      const errorMessage = `Erro: ${error?.message || 'Erro desconhecido'}`;
      addLog(errorMessage);
      addLog(`Tipo do erro: ${typeof error}`);
      addLog(`Nome do erro: ${error?.constructor?.name}`);
      addLog(`Stack: ${error?.stack}`);
      
      setError(errorMessage);
      setStatus('Teste falhou');
    }
  };

  useEffect(() => {
    testDatabase();
  }, []);

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Teste do Banco de Dados</h3>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <strong>Status:</strong> {status}
          </div>
          
          {error && (
            <Alert variant="danger">
              <strong>Erro:</strong> {error}
            </Alert>
          )}
          
          <div className="mb-3">
            <Button onClick={testDatabase} className="me-2">
              Executar Teste Novamente
            </Button>
            <Button onClick={handlePopulateTestData} variant="success">
              Popular Dados de Teste
            </Button>
          </div>
          
          <div>
            <h5>Logs:</h5>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '5px',
              maxHeight: '400px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TestDatabase;