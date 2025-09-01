import { useState, useCallback } from 'react';
import { MigrationService, MigrationProgress, MigrationResult } from '../services/migrationService';
import { useAuth } from '../contexts/AuthContext';

export interface UseMigrationReturn {
  // Estado
  isLoading: boolean;
  progress: MigrationProgress | null;
  result: MigrationResult | null;
  migrationStatus: {
    hasIndexedDBData: boolean;
    hasSupabaseData: boolean;
    indexedDBCount: { transacoes: number; profissionais: number };
    supabaseCount: { transacoes: number; colaboradores: number };
  } | null;
  error: string | null;

  // Ações
  startMigration: () => Promise<void>;
  checkStatus: () => Promise<void>;
  clearIndexedDB: () => Promise<void>;
  reset: () => void;
}

export const useMigration = (): UseMigrationReturn => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<{
    hasIndexedDBData: boolean;
    hasSupabaseData: boolean;
    indexedDBCount: { transacoes: number; profissionais: number };
    supabaseCount: { transacoes: number; colaboradores: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startMigration = useCallback(async () => {
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const migrationService = new MigrationService((progress) => {
        setProgress(progress);
      });

      const migrationResult = await migrationService.migrateData();
      setResult(migrationResult);

      if (!migrationResult.success) {
        setError(migrationResult.errors.join(', ') || 'Erro desconhecido durante a migração');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setResult({
        success: false,
        transacoesMigradas: 0,
        profissionaisMigrados: 0,
        errors: [errorMessage],
        warnings: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const migrationService = new MigrationService();
      const status = await migrationService.checkMigrationStatus();
      setMigrationStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearIndexedDB = useCallback(async () => {
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const migrationService = new MigrationService();
      await migrationService.clearIndexedDBAfterMigration();
      
      // Atualizar status após limpeza
      await checkStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar IndexedDB';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, checkStatus]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress(null);
    setResult(null);
    setMigrationStatus(null);
    setError(null);
  }, []);

  return {
    // Estado
    isLoading,
    progress,
    result,
    migrationStatus,
    error,

    // Ações
    startMigration,
    checkStatus,
    clearIndexedDB,
    reset
  };
};

export default useMigration;