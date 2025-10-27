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
    
    // Teste 3: Testar conexão básica com uma query simples (com fallback)
    console.log('[SUPABASE-TEST] Testando conexão básica...');
    let testResult;
    
    try {
      // Tentar primeiro com a tabela colaboradores
      const { data, error } = await supabase
        .from('colaboradores')
        .select('count')
        .limit(1);
      
      if (error) {
        console.warn('[SUPABASE-TEST] Aviso na conexão com colaboradores:', error.message);
        // Tentar com uma tabela alternativa se colaboradores falhar
        const { data: altData, error: altError } = await supabase
          .from('dre_hitss')
          .select('count')
          .limit(1);
        
        if (altError) {
          throw new Error(`Falha em ambas as tabelas: colaboradores (${error.message}) e dre_hitss (${altError.message})`);
        }
        testResult = altData;
      } else {
        testResult = data;
      }
    } catch (queryError) {
      console.error('[SUPABASE-TEST] Erro na conexão básica:', queryError);
      return { success: false, error: queryError instanceof Error ? queryError.message : 'Erro desconhecido na query' };
    }
    
    console.log('[SUPABASE-TEST] Conexão básica bem-sucedida:', testResult);
    
    // Teste 4: Verificar estado da sessão
    console.log('[SUPABASE-TEST] Verificando sessão...');
    try {
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
    } catch (sessionError) {
      console.error('[SUPABASE-TEST] Erro inesperado ao verificar sessão:', sessionError);
    }
    
    // Teste 5: Verificar configurações de auth
    console.log('[SUPABASE-TEST] Configurações de auth:', {
      authEnabled: !!supabase.auth,
      autoRefreshToken: 'enabled'
    });
    
    return { success: true, data: testResult };
    
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
    
    // Se email fornecido, verificar se usuário existe (opcional e com tratamento robusto)
    if (email) {
      console.log('[AUTH-DEBUG] Verificando se usuário existe:', email);
      try {
        // Nota: Esta query pode não funcionar dependendo das permissões RLS
        const { data: userData, error: queryError } = await supabase
          .from('colaboradores')
          .select('id, email')
          .eq('email', email)
          .single();
        
        if (queryError) {
          console.log('[AUTH-DEBUG] Aviso: Não foi possível verificar usuário na tabela colaboradores:', queryError.message);
        } else {
          console.log('[AUTH-DEBUG] Resultado da busca do usuário:', {
            found: !!userData,
            email: userData?.email
          });
        }
      } catch (error) {
        console.log('[AUTH-DEBUG] Aviso: Erro ao verificar usuário na tabela colaboradores (isso é normal se a tabela não existir ou não tiver permissões)');
      }
    }
    
  } catch (error) {
    console.error('[AUTH-DEBUG] Erro no debug de auth:', error);
    throw error; // Re-throw para que o chamador possa tratar
  }
};

// Função para verificar variáveis de ambiente em runtime
export const debugEnvironmentVariables = () => {
  const timestamp = new Date().toISOString();
  const environment = typeof window !== 'undefined' ? window.location.hostname : 'server';
  
  console.log(`[ENV-DEBUG ${timestamp}] [${environment}] Verificando variáveis de ambiente`);
  
  try {
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
  } catch (error) {
    console.error('[ENV-DEBUG] Erro ao verificar variáveis de ambiente:', error);
    return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

// Função para executar debug completo (com tratamento de erros robusto)
export const runFullDebug = async () => {
  const timestamp = new Date().toISOString();
  console.log(`[FULL-DEBUG ${timestamp}] Iniciando debug completo do sistema`);
  
  try {
    // 1. Verificar variáveis de ambiente
    console.log('[FULL-DEBUG] 1/3 - Verificando variáveis de ambiente...');
    const envResult = debugEnvironmentVariables();
    
    // 2. Testar conectividade
    console.log('[FULL-DEBUG] 2/3 - Testando conectividade...');
    const connectivityResult = await testSupabaseConnectivity();
    
    // 3. Debug de autenticação
    console.log('[FULL-DEBUG] 3/3 - Verificando autenticação...');
    await debugAuth();
    
    console.log('[FULL-DEBUG] Debug completo finalizado com sucesso');
    return {
      success: true,
      environment: envResult,
      connectivity: connectivityResult
    };
  } catch (error) {
    console.error('[FULL-DEBUG] Erro durante debug completo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};