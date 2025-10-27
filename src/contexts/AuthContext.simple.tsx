import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);

  const login = async (email: string, password: string) => {
    console.log('Login simples:', email);
    setUser({ email, id: '1' });
  };

  const logout = async () => {
    console.log('Logout simples');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin: false,
      isDemo: true,
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