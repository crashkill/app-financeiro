/**
 * 🔐 Configuração de Ambiente com Supabase Vault
 * 
 * Este arquivo centraliza o acesso a variáveis de ambiente e segredos,
 * priorizando o Supabase Vault para segredos sensíveis.
 */

import { vaultManager } from './supabaseVault';

// Cache para evitar múltiplas consultas ao Vault
const secretsCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Configurações públicas (podem ser expostas no frontend)
 */
export const publicConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'App Financeiro',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

/**
 * Lista de segredos que devem ser buscados no Vault
 */
const VAULT_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'GITHUB_PERSONAL_ACCESS_TOKEN',
  'MAGIC_21ST_API_KEY',
] as const;

type VaultSecretKey = typeof VAULT_SECRETS[number];

/**
 * Verifica se uma chave é um segredo do Vault
 */
function isVaultSecret(key: string): key is VaultSecretKey {
  return VAULT_SECRETS.includes(key as VaultSecretKey);
}

/**
 * Recupera um segredo do cache se ainda válido
 */
function getCachedSecret(key: string): string | null {
  const cached = secretsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  return null;
}

/**
 * Armazena um segredo no cache
 */
function setCachedSecret(key: string, value: string): void {
  secretsCache.set(key, {
    value,
    timestamp: Date.now()
  });
}

/**
 * Recupera uma variável de ambiente ou segredo do Vault
 * 
 * @param key - Nome da variável/segredo
 * @param fallback - Valor padrão se não encontrado
 * @param required - Se true, lança erro se não encontrado
 */
export async function getEnvVar(
  key: string,
  fallback?: string,
  required = false
): Promise<string> {
  // 1. Verificar se é um segredo do Vault
  if (isVaultSecret(key)) {
    try {
      // Verificar cache primeiro
      const cached = getCachedSecret(key);
      if (cached) {
        return cached;
      }

      // Buscar no Vault
      const secret = await vaultManager.getSecret(key);
      if (secret) {
        setCachedSecret(key, secret);
        return secret;
      }
    } catch (error) {
      console.warn(`Erro ao buscar segredo '${key}' no Vault:`, error);
      // Continua para fallback em process.env
    }
  }

  // 2. Fallback para process.env
  const envValue = process.env[key];
  if (envValue) {
    return envValue;
  }

  // 3. Usar valor padrão
  if (fallback !== undefined) {
    return fallback;
  }

  // 4. Lançar erro se obrigatório
  if (required) {
    throw new Error(
      `Variável de ambiente obrigatória '${key}' não encontrada. ` +
      `Verifique se está configurada no Vault ou em process.env.`
    );
  }

  return '';
}

/**
 * Recupera múltiplas variáveis de ambiente de uma vez
 */
export async function getEnvVars(
  keys: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  await Promise.all(
    keys.map(async (key) => {
      try {
        results[key] = await getEnvVar(key);
      } catch (error) {
        console.warn(`Erro ao recuperar '${key}':`, error);
        results[key] = '';
      }
    })
  );
  
  return results;
}

/**
 * Configurações específicas para diferentes serviços
 */
export const serviceConfigs = {
  /**
   * Configuração do Supabase
   */
  supabase: {
    url: publicConfig.supabaseUrl,
    anonKey: publicConfig.supabaseAnonKey,
    async getServiceRoleKey() {
      return getEnvVar('SUPABASE_SERVICE_ROLE_KEY', '', true);
    }
  },

  /**
   * Configuração do NextAuth
   */
  nextAuth: {
    async getSecret() {
      return getEnvVar('NEXTAUTH_SECRET', '', true);
    },
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000'
  },

  /**
   * Configuração do OpenAI
   */
  openai: {
    async getApiKey() {
      return getEnvVar('OPENAI_API_KEY', '', true);
    },
    model: 'gpt-4',
    maxTokens: 2000
  },

  /**
   * Configuração do Stripe
   */
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    async getSecretKey() {
      return getEnvVar('STRIPE_SECRET_KEY', '', true);
    },
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },

  /**
   * Configuração do GitHub
   */
  github: {
    async getPersonalAccessToken() {
      return getEnvVar('GITHUB_PERSONAL_ACCESS_TOKEN', '', true);
    }
  },

  /**
   * Configuração da API Magic 21st
   */
  magic21st: {
    async getApiKey() {
      return getEnvVar('MAGIC_21ST_API_KEY', '', true);
    }
  }
};

/**
 * Valida se todas as configurações obrigatórias estão presentes
 */
export async function validateConfig(): Promise<{
  valid: boolean;
  missing: string[];
  errors: string[];
}> {
  const missing: string[] = [];
  const errors: string[] = [];

  // Verificar configurações públicas obrigatórias
  if (!publicConfig.supabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!publicConfig.supabaseAnonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Verificar segredos do Vault (apenas em ambiente servidor)
  if (typeof window === 'undefined') {
    try {
      const serviceRoleKey = await serviceConfigs.supabase.getServiceRoleKey();
      if (!serviceRoleKey) {
        missing.push('SUPABASE_SERVICE_ROLE_KEY');
      }
    } catch (error) {
      errors.push(`Erro ao verificar SUPABASE_SERVICE_ROLE_KEY: ${error}`);
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

/**
 * Limpa o cache de segredos (útil para testes ou refresh)
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
}

/**
 * Utilitário para debug - mostra configurações (sem expor segredos)
 */
export async function debugConfig(): Promise<void> {
  if (!publicConfig.isDevelopment) {
    console.warn('debugConfig() só deve ser usado em desenvolvimento');
    return;
  }

  console.group('🔧 Configuração do App');
  
  console.log('📊 Configurações Públicas:', {
    ...publicConfig,
    supabaseAnonKey: publicConfig.supabaseAnonKey ? '***' : 'MISSING'
  });

  const validation = await validateConfig();
  console.log('✅ Validação:', validation);

  console.log('🔐 Segredos no Cache:', Array.from(secretsCache.keys()));
  
  console.groupEnd();
}

// Exportar tipos para TypeScript
export type PublicConfig = typeof publicConfig;
export type ServiceConfigs = typeof serviceConfigs;