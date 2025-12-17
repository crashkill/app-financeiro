import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton para o cliente Supabase
let supabaseInstance: SupabaseClient | null = null;

// Função de debug para configuração do Supabase
const debugSupabaseConfig = () => {
  const timestamp = new Date().toISOString();
  const environment = typeof window !== 'undefined' ? window.location.hostname : 'server';
  const isProduction = environment !== 'localhost' && environment !== '127.0.0.1';
  
  console.log(`[SUPABASE-CONFIG ${timestamp}] [${environment}] Configurando cliente Supabase`, {
    hasUrlEnv: !!import.meta.env.VITE_SUPABASE_URL,
    hasKeyEnv: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    urlFromEnv: import.meta.env.VITE_SUPABASE_URL,
    keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    isProduction,
    allEnvVars: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE')),
    singleton: !!supabaseInstance
  });
  
  if (isProduction) {
    console.warn(`[VERCEL-SUPABASE-CONFIG] Configuração em produção`, {
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
  }
};

//# Credenciais do projeto HITSS via MCP-Supabase-HITSS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('❌ VITE_SUPABASE_URL is required. Configure environment variables.')
}
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bG1ib3VndWZncmVjeXlqeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjQxOTYsImV4cCI6MjA3NDk0MDE5Nn0.S3Oy7gEQ9VRUrDick627LH_h3DIPowAaYBkCjjqrgB8'

// Função para criar ou retornar a instância singleton do Supabase
const createSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) {
    console.log('[SUPABASE-SINGLETON] Retornando instância existente do cliente Supabase');
    return supabaseInstance;
  }

  // Debug da configuração apenas na primeira criação
  debugSupabaseConfig();

  // Verificar se as variáveis estão definidas
  if (!supabaseUrl) {
    console.error('[SUPABASE-ERROR] URL do Supabase não definida');
  }

  if (!supabaseAnonKey) {
    console.error('[SUPABASE-ERROR] Chave anônima do Supabase não definida');
  }

  // Criar nova instância com configurações otimizadas
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Configurações para evitar múltiplas instâncias
      storageKey: 'sb-auth-token',
      flowType: 'pkce'
    },
    // Configurações globais para otimização
    global: {
      headers: {
        'X-Client-Info': 'app-financeiro@1.0.0',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    }
  });

  console.log('[SUPABASE-SINGLETON] Nova instância do cliente Supabase criada');
  return supabaseInstance;
};

// Exportar a instância singleton
export const supabase = createSupabaseClient();

// Função para resetar a instância (útil para testes)
export const resetSupabaseInstance = () => {
  console.log('[SUPABASE-SINGLETON] Resetando instância do cliente Supabase');
  supabaseInstance = null;
};

// Função para verificar se a instância existe
export const hasSupabaseInstance = () => !!supabaseInstance;