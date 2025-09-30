import { createClient } from '@supabase/supabase-js'

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
    allEnvVars: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE'))
  });
  
  if (isProduction) {
    console.warn(`[VERCEL-SUPABASE-CONFIG] Configuração em produção`, {
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Debug da configuração
debugSupabaseConfig();

// Verificar se as variáveis estão definidas
if (!supabaseUrl) {
  console.error('[SUPABASE-ERROR] URL do Supabase não definida');
}

if (!supabaseAnonKey) {
  console.error('[SUPABASE-ERROR] Chave anônima do Supabase não definida');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})