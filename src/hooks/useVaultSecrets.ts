import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { toast } from 'sonner';

interface VaultSecret {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface UseVaultSecretsReturn {
  // Estados
  loading: boolean;
  error: string | null;
  secrets: VaultSecret[];
  
  // Ações
  getSecret: (name: string) => Promise<string | null>;
  listSecrets: () => Promise<VaultSecret[]>;
  setSecret: (name: string, value: string) => Promise<boolean>;
  updateSecret: (name: string, newValue: string) => Promise<boolean>;
  deleteSecret: (name: string) => Promise<boolean>;
  refreshSecrets: () => Promise<void>;
}

/**
 * Hook para gerenciar segredos do Supabase Vault no frontend
 * 
 * IMPORTANTE:
 * - Requer usuário autenticado
 * - Usa Edge Function para acessar o Vault com segurança
 * - Nunca expõe service_role no frontend
 */
export function useVaultSecrets(): UseVaultSecretsReturn {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);

  // Função helper para fazer chamadas à Edge Function
  const callVaultFunction = useCallback(async (payload: any) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Token de acesso não encontrado');
    }

    const response = await supabase.functions.invoke('vault-secrets', {
      body: payload,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Erro na chamada da função');
    }

    return response.data;
  }, [supabase, user]);

  // Recuperar um segredo específico
  const getSecret = useCallback(async (name: string): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await callVaultFunction({
        action: 'get',
        secretName: name,
      });

      return result.secret;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao recuperar segredo';
      setError(errorMessage);
      toast.error(`Erro ao recuperar segredo: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [callVaultFunction]);

  // Listar todos os segredos (sem valores)
  const listSecrets = useCallback(async (): Promise<VaultSecret[]> => {
    try {
      setLoading(true);
      setError(null);

      const result = await callVaultFunction({
        action: 'list',
      });

      const secretsList = result.secrets || [];
      setSecrets(secretsList);
      return secretsList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao listar segredos';
      setError(errorMessage);
      toast.error(`Erro ao listar segredos: ${errorMessage}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [callVaultFunction]);

  // Criar um novo segredo
  const setSecret = useCallback(async (name: string, value: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await callVaultFunction({
        action: 'set',
        secretName: name,
        secretValue: value,
      });

      toast.success(`Segredo '${name}' criado com sucesso`);
      
      // Atualizar lista de segredos
      await listSecrets();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar segredo';
      setError(errorMessage);
      toast.error(`Erro ao criar segredo: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [callVaultFunction, listSecrets]);

  // Atualizar um segredo existente
  const updateSecret = useCallback(async (name: string, newValue: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await callVaultFunction({
        action: 'update',
        secretName: name,
        newSecretValue: newValue,
      });

      toast.success(`Segredo '${name}' atualizado com sucesso`);
      
      // Atualizar lista de segredos
      await listSecrets();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar segredo';
      setError(errorMessage);
      toast.error(`Erro ao atualizar segredo: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [callVaultFunction, listSecrets]);

  // Deletar um segredo
  const deleteSecret = useCallback(async (name: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await callVaultFunction({
        action: 'delete',
        secretName: name,
      });

      toast.success(`Segredo '${name}' deletado com sucesso`);
      
      // Atualizar lista de segredos
      await listSecrets();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar segredo';
      setError(errorMessage);
      toast.error(`Erro ao deletar segredo: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [callVaultFunction, listSecrets]);

  // Atualizar lista de segredos
  const refreshSecrets = useCallback(async (): Promise<void> => {
    await listSecrets();
  }, [listSecrets]);

  return {
    // Estados
    loading,
    error,
    secrets,
    
    // Ações
    getSecret,
    listSecrets,
    setSecret,
    updateSecret,
    deleteSecret,
    refreshSecrets,
  };
}

/**
 * Hook simplificado para recuperar um segredo específico
 * Útil quando você só precisa de um segredo específico
 */
export function useVaultSecret(secretName: string) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getSecret } = useVaultSecrets();

  const fetchSecret = useCallback(async () => {
    if (!secretName) return;
    
    try {
      setLoading(true);
      setError(null);
      const secretValue = await getSecret(secretName);
      setValue(secretValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao recuperar segredo';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [secretName, getSecret]);

  return {
    value,
    loading,
    error,
    refetch: fetchSecret,
  };
}

/**
 * Utilitário para validar se um usuário tem permissão para acessar segredos
 * Pode ser expandido com lógica de roles/permissões mais complexa
 */
export function useVaultPermissions() {
  const { user } = useSupabase();
  
  const canReadSecrets = Boolean(user);
  const canWriteSecrets = Boolean(user); // Por enquanto, qualquer usuário autenticado pode escrever
  const canDeleteSecrets = Boolean(user); // Por enquanto, qualquer usuário autenticado pode deletar
  
  return {
    canReadSecrets,
    canWriteSecrets,
    canDeleteSecrets,
    isAuthenticated: Boolean(user),
  };
}