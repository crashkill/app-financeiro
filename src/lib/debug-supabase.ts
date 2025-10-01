import { supabase } from './supabase'

// Função para testar conectividade com Supabase
export const testSupabaseConnectivity = async () => {
  const timestamp = new Date().toISOString();
  const environment = typeof window !== 'undefined' ? window.location.hostname : 'server';
  
  console.log(`[SUPABASE-TEST ${timestamp}] [${environment}] Iniciando teste de conectividade`);
  
  try {
    // Teste 1: Verificar se o cliente foi criado
    console.log('[SUPABASE-TEST] Cliente Supabase criado:', !!supabase);
    
    // Teste 2: Verificar configuração do cliente
    console.log('[SUPABASE-TEST] Configuração do cliente:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
      authConfigured: !!supabase.auth
    });
    
    // Teste 3: Testar conexão básica com uma query simples
    console.log('[SUPABASE-TEST] Testando conexão básica...');
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('[SUPABASE-TEST] Erro na conexão básica:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[SUPABASE-TEST] Conexão básica bem-sucedida:', data);
    
    // Teste 4: Verificar estado da sessão
    console.log('[SUPABASE-TEST] Verificando sessão...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[SUPABASE-TEST] Erro ao obter sessão:', sessionError);
    } else {
      console.log('[SUPABASE-TEST] Estado da sessão:', {
        hasSession: !!session.session,
        userId: session.session?.user?.id,
        email: session.session?.user?.email
      });
    }
    
    // Teste 5: Verificar configurações de auth
    console.log('[SUPABASE-TEST] Configurações de auth:', {
      authEnabled: !!supabase.auth,
      autoRefreshToken: 'enabled'
    });
    
    return { success: true, data };
    
  } catch (error) {
    console.error('[SUPABASE-TEST] Erro inesperado no teste:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

// Função para debug de autenticação específica
export const debugAuth = async (email?: string) => {
  const timestamp = new Date().toISOString();
  const environment = typeof window !== 'undefined' ? window.location.hostname : 'server';
  
  console.log(`[AUTH-DEBUG ${timestamp}] [${environment}] Debug de autenticação`, { email });
  
  try {
    // Verificar estado atual
    const { data: currentSession } = await supabase.auth.getSession();
    console.log('[AUTH-DEBUG] Estado atual da sessão:', {
      hasSession: !!currentSession.session,
      userId: currentSession.session?.user?.id,
      email: currentSession.session?.user?.email,
      expiresAt: currentSession.session?.expires_at
    });
    
    // Verificar usuário atual
    const { data: user, error: userError } = await supabase.auth.getUser();
    console.log('[AUTH-DEBUG] Usuário atual:', {
      hasUser: !!user.user,
      userId: user.user?.id,
      email: user.user?.email,
      error: userError?.message
    });
    
    // Se email fornecido, verificar se usuário existe
    if (email) {
      console.log('[AUTH-DEBUG] Verificando se usuário existe:', email);
      // Nota: Esta query pode não funcionar dependendo das permissões RLS
      const { data: userData, error: queryError } = await supabase
        .from('usuarios')
        .select('id, email')
        .eq('email', email)
        .single();
      
      console.log('[AUTH-DEBUG] Resultado da busca do usuário:', {
        found: !!userData,
        error: queryError?.message
      });
    }
    
  } catch (error) {
    console.error('[AUTH-DEBUG] Erro no debug de auth:', error);
  }
};

// Função para verificar variáveis de ambiente em runtime
export const debugEnvironmentVariables = () => {
  const timestamp = new Date().toISOString();
  const environment = typeof window !== 'undefined' ? window.location.hostname : 'server';
  
  console.log(`[ENV-DEBUG ${timestamp}] [${environment}] Verificando variáveis de ambiente`);
  
  // Verificar todas as variáveis relacionadas ao Supabase
  const supabaseVars = Object.keys(import.meta.env)
    .filter(key => key.includes('SUPABASE'))
    .reduce((acc, key) => {
      acc[key] = {
        exists: !!import.meta.env[key],
        length: import.meta.env[key]?.length || 0,
        value: key.includes('KEY') ? 
          import.meta.env[key]?.substring(0, 20) + '...' : 
          import.meta.env[key]
      };
      return acc;
    }, {} as Record<string, any>);
  
  console.log('[ENV-DEBUG] Variáveis do Supabase:', supabaseVars);
  
  // Verificar outras variáveis importantes
  const otherVars = {
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV
  };
  
  console.log('[ENV-DEBUG] Outras variáveis:', otherVars);
  
  // Verificar se estamos na Vercel
  const isVercel = environment.includes('vercel.app') || environment.includes('vercel.com');
  console.log('[ENV-DEBUG] Ambiente Vercel detectado:', isVercel);
  
  return { supabaseVars, otherVars, isVercel };
};

// Função para executar todos os testes de debug
export const runFullDebug = async (email?: string) => {
  console.log('=== INICIANDO DEBUG COMPLETO DO SUPABASE ===');
  
  // 1. Debug das variáveis de ambiente
  debugEnvironmentVariables();
  
  // 2. Teste de conectividade
  await testSupabaseConnectivity();
  
  // 3. Debug de autenticação
  await debugAuth(email);
  
  console.log('=== DEBUG COMPLETO FINALIZADO ===');
};