/**
 * Utilitário para gerenciar segredos no Supabase Vault
 * 
 * IMPORTANTE: 
 * - As funções que acessam o Vault requerem service_role
 * - Nunca use service_role no frontend - apenas no backend/Edge Functions
 * - Para frontend, crie Edge Functions que façam proxy para estas operações
 */

import { createClient } from '@supabase/supabase-js';

// Cliente com service_role para operações do Vault (APENAS BACKEND)
const getVaultClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuração do Supabase incompleta para operações do Vault');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Interface para gerenciar segredos no Supabase Vault
 * ATENÇÃO: Estas funções só funcionam no backend com service_role
 */
export class SupabaseVaultManager {
  private client;
  
  constructor() {
    this.client = getVaultClient();
  }
  
  /**
   * Insere um novo segredo no Vault
   * @param name Nome único do segredo
   * @param value Valor do segredo
   * @returns UUID do segredo criado
   */
  async insertSecret(name: string, value: string): Promise<string> {
    try {
      const { data, error } = await this.client.rpc('insert_secret', {
        secret_name: name,
        secret_value: value
      });
      
      if (error) {
        throw new Error(`Erro ao inserir segredo: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Erro no insertSecret:', error);
      throw error;
    }
  }
  
  /**
   * Recupera um segredo do Vault
   * @param name Nome do segredo
   * @returns Valor descriptografado do segredo
   */
  async getSecret(name: string): Promise<string | null> {
    try {
      const { data, error } = await this.client.rpc('get_secret', {
        secret_name: name
      });
      
      if (error) {
        throw new Error(`Erro ao recuperar segredo: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Erro no getSecret:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza um segredo existente
   * @param name Nome do segredo
   * @param newValue Novo valor do segredo
   * @returns true se atualizado com sucesso
   */
  async updateSecret(name: string, newValue: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.rpc('update_secret', {
        secret_name: name,
        new_secret_value: newValue
      });
      
      if (error) {
        throw new Error(`Erro ao atualizar segredo: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Erro no updateSecret:', error);
      throw error;
    }
  }
  
  /**
   * Remove um segredo do Vault
   * @param name Nome do segredo
   * @returns true se removido com sucesso
   */
  async deleteSecret(name: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.rpc('delete_secret', {
        secret_name: name
      });
      
      if (error) {
        throw new Error(`Erro ao deletar segredo: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Erro no deleteSecret:', error);
      throw error;
    }
  }
  
  /**
   * Lista todos os segredos (sem valores)
   * @returns Array com metadados dos segredos
   */
  async listSecrets(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>> {
    try {
      const { data, error } = await this.client.rpc('list_secrets');
      
      if (error) {
        throw new Error(`Erro ao listar segredos: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro no listSecrets:', error);
      throw error;
    }
  }
}

/**
 * Utilitário para migrar segredos do Doppler para o Supabase Vault
 * IMPORTANTE: Execute apenas no backend com as devidas permissões
 */
export class DopplerToVaultMigrator {
  private vaultManager: SupabaseVaultManager;
  
  constructor() {
    this.vaultManager = new SupabaseVaultManager();
  }
  
  /**
   * Migra um segredo específico do Doppler para o Vault
   * @param secretName Nome do segredo
   * @param dopplerValue Valor atual do Doppler
   */
  async migrateSecret(secretName: string, dopplerValue: string): Promise<void> {
    try {
      console.log(`Migrando segredo: ${secretName}`);
      
      // Verificar se já existe
      const existing = await this.vaultManager.getSecret(secretName);
      
      if (existing) {
        console.log(`Segredo ${secretName} já existe no Vault. Atualizando...`);
        await this.vaultManager.updateSecret(secretName, dopplerValue);
      } else {
        console.log(`Criando novo segredo: ${secretName}`);
        await this.vaultManager.insertSecret(secretName, dopplerValue);
      }
      
      console.log(`✅ Segredo ${secretName} migrado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao migrar segredo ${secretName}:`, error);
      throw error;
    }
  }
  
  /**
   * Migra múltiplos segredos do Doppler
   * @param secrets Objeto com pares chave-valor dos segredos
   */
  async migrateMultipleSecrets(secrets: Record<string, string>): Promise<void> {
    console.log(`Iniciando migração de ${Object.keys(secrets).length} segredos...`);
    
    const results = [];
    
    for (const [name, value] of Object.entries(secrets)) {
      try {
        await this.migrateSecret(name, value);
        results.push({ name, status: 'success' });
      } catch (error) {
        results.push({ name, status: 'error', error: error.message });
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`\n📊 Resultado da migração:`);
    console.log(`✅ Sucessos: ${successful}`);
    console.log(`❌ Falhas: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Segredos com falha:');
      results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
  }
}

/**
 * Função helper para verificar se estamos no ambiente correto
 */
export const isServerEnvironment = (): boolean => {
  return typeof window === 'undefined';
};

/**
 * Função helper para validar configuração do Vault
 */
export const validateVaultConfig = (): boolean => {
  const hasUrl = !!(process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceRole = !!(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  if (!hasUrl) {
    console.error('❌ VITE_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL não configurada');
  }
  
  if (!hasServiceRole) {
    console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_ROLE_KEY não configurada');
  }
  
  return hasUrl && hasServiceRole;
};

// Exportar instância singleton para uso direto
export const vaultManager = new SupabaseVaultManager();
export const dopplerMigrator = new DopplerToVaultMigrator();