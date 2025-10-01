import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void; // Mantido para compatibilidade, mas não faz nada
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>('light'); // Sempre modo claro
  const [mounted, setMounted] = useState(false);

  // Efeito para garantir que o tema claro seja aplicado
  useEffect(() => {
    // Remove qualquer tema escuro salvo anteriormente
    localStorage.removeItem('theme');
    setMounted(true);
  }, []);

  // Efeito para aplicar o tema claro ao documento
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    
    // Sempre remove a classe dark para garantir modo claro
    root.classList.remove('dark');
    
    // Define explicitamente o tema claro no localStorage
    localStorage.setItem('theme', 'light');
  }, [mounted]);

  // Função vazia para compatibilidade - não faz nada
  const toggleTheme = () => {
    // Não faz nada - modo claro fixo
  };

  // Função vazia para compatibilidade - não permite mudança
  const setTheme = () => {
    // Não faz nada - modo claro fixo
  };

  if (!mounted) {
    return null; // Evita flash de tema incorreto durante o carregamento
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
