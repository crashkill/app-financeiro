import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { populateTestData } from '../utils/populateTestData';

const PublicTestDatabase = () => {
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Teste do Banco de Dados (Público)</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Erro:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testDatabase} 
          style={{ 
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Executar Teste Novamente
        </button>
        <button 
          onClick={handlePopulateTestData}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Popular Dados de Teste
        </button>
      </div>
      
      <div>
        <h4>Logs:</h4>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '5px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          border: '1px solid #dee2e6'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicTestDatabase;