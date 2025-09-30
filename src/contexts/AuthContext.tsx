import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função de debug para logs detalhados
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const environment = typeof window !== 'undefined' ? window.location.hostname : 'server';
  
  console.log(`[AUTH-DEBUG ${timestamp}] [${environment}] ${message}`, data || '');
  
  // Log adicional para Vercel
  if (environment !== 'localhost' && environment !== '127.0.0.1') {
    console.warn(`[VERCEL-AUTH-DEBUG] ${message}`, data || '');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Debug: Verificar configuração do Supabase
    debugLog('Inicializando AuthProvider', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      environment: typeof window !== 'undefined' ? window.location.hostname : 'server'
    });

    // Verificar a sessão atual do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog('Auth state change', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      
      setUser(session?.user ?? null);
    });

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        debugLog('Erro ao obter sessão inicial', error);
      } else {
        debugLog('Sessão inicial obtida', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        });
      }
    });

    // Cleanup da subscription
    return () => {
      debugLog('Limpando subscription de auth');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      debugLog('Tentativa de login iniciada', { email });
      
      // Verificar conectividade com Supabase
      const { data: healthCheck, error: healthError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (healthError) {
        debugLog('Erro de conectividade com Supabase', healthError);
      } else {
        debugLog('Conectividade com Supabase OK');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        debugLog('Erro no login', {
          message: error.message,
          status: error.status,
          name: error.name,
          cause: error.cause
        });
        throw new Error('Email ou senha inválidos');
      }

      debugLog('Login bem-sucedido', {
        userId: data.user?.id,
        email: data.user?.email,
        hasSession: !!data.session
      });

    } catch (error) {
      debugLog('Exceção durante login', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      debugLog('Tentativa de logout iniciada');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debugLog('Erro no logout', error);
        throw new Error('Erro ao fazer logout');
      }
      
      debugLog('Logout bem-sucedido');
    } catch (error) {
      debugLog('Exceção durante logout', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin: user?.app_metadata?.isAdmin || false,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
