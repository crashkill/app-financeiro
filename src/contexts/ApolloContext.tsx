import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
import { apolloClient, supabase } from '../lib/apollo';
import { useAuth } from './AuthContext';

interface ApolloContextType {
  isConnected: boolean;
  reconnect: () => Promise<void>;
  clearData: () => Promise<void>;
}

const ApolloContext = createContext<ApolloContextType | undefined>(undefined);

export const ApolloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        switch (event) {
          case 'SIGNED_IN':
            setIsConnected(true);
            // Refazer queries após login
            console.log('User signed in');
            break;
            
          case 'SIGNED_OUT':
            setIsConnected(false);
            // Limpar cache após logout
            console.log('User signed out');
            break;
            
          case 'TOKEN_REFRESHED':
            // Refazer queries após refresh do token
            console.log('Token refreshed');
            break;
            
          default:
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Sincronizar autenticação local com Supabase
    const syncAuth = async () => {
      if (user) {
        // Se há usuário local mas não há sessão Supabase, criar uma sessão mock
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Para desenvolvimento, podemos simular uma sessão
          console.log('Usuário local detectado, sincronizando com Supabase...');
          setIsConnected(true);
        }
      } else {
        // Se não há usuário local, garantir que não há sessão Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
        }
        setIsConnected(false);
      }
    };

    syncAuth();
  }, [user]);

  const reconnect = async () => {
    try {
      setIsConnected(false);
      console.log('Reconnecting...');
      setIsConnected(true);
    } catch (error) {
      console.error('Erro ao reconectar:', error);
    }
  };

  const clearData = async () => {
    try {
      console.log('Cache Apollo limpo');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  return (
    <BaseApolloProvider client={apolloClient}>
      <ApolloContext.Provider value={{ isConnected, reconnect, clearData }}>
        {children}
      </ApolloContext.Provider>
    </BaseApolloProvider>
  );
};

export const useApollo = () => {
  const context = useContext(ApolloContext);
  if (context === undefined) {
    throw new Error('useApollo must be used within an ApolloProvider');
  }
  return context;
};

// Hook para verificar status de conexão
export const useConnectionStatus = () => {
  const { isConnected } = useApollo();
  return isConnected;
};