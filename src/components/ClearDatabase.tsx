import React, { useState } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { db } from '../db/database';

const ClearDatabase: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'danger' | 'info'>('info');

  const clearIndexedDB = async () => {
    setIsClearing(true);
    setMessage('Iniciando limpeza do IndexedDB...');
    setMessageType('info');

    try {
      // Verificar quantos registros existem antes
      const countBefore = await db.transacoes.count();
      console.log(`Registros antes da limpeza: ${countBefore}`);

      // Limpar a tabela transacoes
      await db.transacoes.clear();
      
      // Verificar se foi limpo
      const countAfter = await db.transacoes.count();
      console.log(`Registros após a limpeza: ${countAfter}`);

      if (countAfter === 0) {
        setMessage(`✅ IndexedDB limpo com sucesso! ${countBefore} registros removidos.`);
        setMessageType('success');
      } else {
        setMessage(`⚠️ Limpeza parcial. ${countBefore - countAfter} registros removidos, ${countAfter} restantes.`);
        setMessageType('danger');
      }

    } catch (error) {
      console.error('Erro ao limpar IndexedDB:', error);
      setMessage(`❌ Erro ao limpar IndexedDB: ${error}`);
      setMessageType('danger');
    } finally {
      setIsClearing(false);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const count = await db.transacoes.count();
      setMessage(`📊 Status do banco: ${count} registros na tabela transacoes`);
      setMessageType('info');
      
      if (count > 0) {
        const sample = await db.transacoes.limit(3).toArray();
        console.log('Amostra dos dados:', sample);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setMessage(`❌ Erro ao verificar status: ${error}`);
      setMessageType('danger');
    }
  };

  return (
    <div className="p-4">
      <h4>Gerenciamento do IndexedDB</h4>
      
      {message && (
        <Alert variant={messageType} className="mt-3">
          {message}
        </Alert>
      )}

      <div className="d-flex gap-2 mt-3">
        <Button 
          variant="danger" 
          onClick={clearIndexedDB}
          disabled={isClearing}
        >
          {isClearing ? 'Limpando...' : 'Limpar IndexedDB'}
        </Button>
        
        <Button 
          variant="info" 
          onClick={checkDatabaseStatus}
        >
          Verificar Status
        </Button>
      </div>

      <div className="mt-3">
        <small className="text-muted">
          <strong>Atenção:</strong> Esta ação irá remover todos os dados financeiros armazenados localmente.
        </small>
      </div>
    </div>
  );
};

export default ClearDatabase;