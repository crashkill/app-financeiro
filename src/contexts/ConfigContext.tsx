import React, { createContext, useContext, useState, useEffect } from 'react';

interface ConfigContextType {
  config: {
    currency: string;
    dateFormat: string;
    notifications: boolean;
    darkMode: boolean;
  };
  updateConfig: (newConfig: Partial<ConfigContextType['config']>) => void;
}

const defaultConfig = {
  currency: 'BRL',
  dateFormat: 'DD/MM/YYYY',
  notifications: true,
  darkMode: false,
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('userConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('userConfig', JSON.stringify(config));
    
    // Aplicar modo escuro
    if (config.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<ConfigContextType['config']>) => {
    setConfig((prev: ConfigContextType['config']) => ({ ...prev, ...newConfig }));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
