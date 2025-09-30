import React, { useState, useEffect } from 'react';
import { Button, Alert, Row, Col } from 'react-bootstrap';
import { db } from '../db/database';
import { SyncService } from '../services/syncService';

const TestClearDB: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [alertType, setAlertType] = useState<'success' | 'danger' | 'info'>('info');
  const [recordCount, setRecordCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    indexedDbCount: number
    supabaseCount: number
    lastSync: string | null
  } | null>(null);

  const handleClearDB = async () => {
    try {
      setIsLoading(true);
      setStatus('Limpando IndexedDB...');
      setAlertType('info');
      
      const result = await SyncService.clearIndexedDB();
      
      if (result.success) {
        setStatus(result.message);
        setAlertType('success');
        await checkRecordCount();
        await checkSyncStatus();
      } else {
        setStatus(result.message);
        setAlertType('danger');
      }
    } catch (error) {
      setStatus(`Erro ao limpar IndexedDB: ${error}`);
      setAlertType('danger');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      setStatus('Sincronizando dados da automação HITSS...');
      setAlertType('info');
      
      const result = await SyncService.syncDreHitssToIndexedDB();
      
      if (result.success) {
        setStatus(result.message);
        setAlertType('success');
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        await checkRecordCount();
        await checkSyncStatus();
      } else {
        setStatus(result.message);
        setAlertType('danger');
      }
    } catch (error) {
      setStatus(`Erro durante a sincronização: ${error}`);
      setAlertType('danger');
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkSyncStatus = async () => {
    try {
      const status = await SyncService.checkSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status da sincronização:', error);
    }
  };

  const checkRecordCount = async () => {
    try {
      const count = await db.transacoes.count();
      setRecordCount(count);
    } catch (error) {
      console.error('Erro ao verificar registros:', error);
    }
  };

  useEffect(() => {
    checkRecordCount();
    checkSyncStatus();
  }, []);

  return (
    <div className="p-3 border rounded">
      <h5>Gerenciamento de Dados - Automação HITSS</h5>
      
      <Row className="mb-3">
        <Col md={6}>
          <p><strong>IndexedDB:</strong> {recordCount} registros</p>
          {syncStatus && (
            <>
              <p><strong>Supabase (dre_hitss):</strong> {syncStatus.supabaseCount} registros</p>
              <p><strong>Última sincronização:</strong> {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString('pt-BR') : 'Nunca'}</p>
            </>
          )}
        </Col>
      </Row>
      
      <div className="mb-3">
        <Button 
          variant="primary" 
          onClick={handleSyncData}
          className="me-2"
          disabled={isLoading}
        >
          {isLoading ? 'Sincronizando...' : 'Sincronizar Dados da Automação'}
        </Button>
        
        <Button 
          variant="danger" 
          onClick={handleClearDB}
          className="me-2"
          disabled={isLoading}
        >
          {isLoading ? 'Limpando...' : 'Limpar IndexedDB'}
        </Button>
        
        <Button 
          variant="info" 
          onClick={() => {
            checkRecordCount();
            checkSyncStatus();
          }}
          disabled={isLoading}
        >
          Verificar Status
        </Button>
      </div>
      
      {status && (
        <Alert variant={alertType} className="mt-3">
          {status}
        </Alert>
      )}
    </div>
  );
};

export default TestClearDB;