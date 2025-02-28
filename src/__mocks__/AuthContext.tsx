import React from 'react';

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

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  login: async () => {},
  logout: () => {}
});

export const useAuth = () => {
  const mockAuthContext: AuthContextType = {
    user: { 
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: true
    },
    isAdmin: true,
    login: jest.fn(),
    logout: jest.fn()
  };

  return mockAuthContext;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthContext: AuthContextType = {
    user: { 
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: true
    },
    isAdmin: true,
    login: jest.fn(),
    logout: jest.fn()
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};
