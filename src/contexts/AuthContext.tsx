import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/apollo';

interface User {
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch (e) {
        console.error("Falha ao analisar o usuário do localStorage", e);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null; // Ou defina um estado inicial padrão se necessário
  });

  const login = async (email: string, password: string) => {
    try {
      // Aceita 'admin', 'Administrador' ou 'Admin' com senha 'admin'
      if ((email.toLowerCase() === 'admin' || email === 'Administrador') && password.toLowerCase() === 'admin') {
        const userData: User = { 
          email, 
          name: 'Administrador',
          isAdmin: true
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Para desenvolvimento, criar uma sessão mock no Supabase
        // Em produção, isso seria substituído por autenticação real
        console.log('Login local realizado, sincronizando com Supabase...');
        
      } else {
        // Tentar autenticação real com Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          throw new Error('Credenciais inválidas');
        }
        
        if (data.user) {
          const userData: User = {
            email: data.user.email || email,
            name: data.user.user_metadata?.name || data.user.email || 'Usuário',
            isAdmin: data.user.user_metadata?.isAdmin || false
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Fazer logout do Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout do Supabase:', error);
    } finally {
      // Sempre limpar estado local
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin: user?.isAdmin || false,
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
