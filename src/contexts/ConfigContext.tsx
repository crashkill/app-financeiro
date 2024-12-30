import React, { createContext, useContext, useState, useEffect } from 'react';

interface ConfigContextType {
  config: {
    currency: string;
    dateFormat: string;
    notifications: boolean;
    darkMode: boolean;
    userName?: string;
    userImage?: string;
  };
  updateConfig: (newConfig: Partial<ConfigContextType['config']>) => void;
  uploadUserImage: (file: File) => Promise<void>;
}

const defaultConfig = {
  currency: 'BRL',
  dateFormat: 'DD/MM/YYYY',
  notifications: true,
  darkMode: false,
  userName: 'Usuário',
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

  const uploadUserImage = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateConfig({ userImage: base64String });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, uploadUserImage }}>
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
