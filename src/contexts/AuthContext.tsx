import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isDemo: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sessão inicial e configurar listener
  useEffect(() => {
    // Obter sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      console.log('[AUTH] Sessão inicial:', session ? 'Autenticado' : 'Não autenticado');
    });

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Estado alterado:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    console.log('[AUTH] Tentando login:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AUTH] Erro no login:', error.message);
      setIsLoading(false);
      throw new Error(error.message);
    }

    console.log('[AUTH] Login bem-sucedido:', data.user?.email);
    setUser(data.user);
    setSession(data.session);
    setIsLoading(false);
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    console.log('[AUTH] Tentando cadastro:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('[AUTH] Erro no cadastro:', error.message);
      setIsLoading(false);
      throw new Error(error.message);
    }

    console.log('[AUTH] Cadastro bem-sucedido:', data.user?.email);
    setIsLoading(false);
  };

  const logout = async () => {
    console.log('[AUTH] Fazendo logout');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[AUTH] Erro no logout:', error.message);
      throw new Error(error.message);
    }

    setUser(null);
    setSession(null);
  };

  // Verificar se é admin baseado em metadata ou email
  const isAdmin = user?.email?.endsWith('@hitss.com.br') ||
    user?.user_metadata?.role === 'admin' ||
    false;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAdmin,
      isDemo: false, // Não é mais demo - autenticação real
      isLoading,
      login,
      logout,
      signUp
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