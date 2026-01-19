import { Configuration, LogLevel, PublicClientApplication, RedirectRequest, SilentRequest } from '@azure/msal-browser';

// Configurações do Azure AD (definidas via variáveis de ambiente)
const cloudInstance = import.meta.env.VITE_AZURE_CLOUD_INSTANCE || 'https://login.microsoftonline.com/';
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;
const postLogoutRedirectUri = import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI || window.location.origin;

// Validação das variáveis de ambiente
if (!clientId) {
  console.error('[MSAL-CONFIG] ❌ VITE_AZURE_CLIENT_ID não definido');
}

if (!tenantId) {
  console.error('[MSAL-CONFIG] ❌ VITE_AZURE_TENANT_ID não definido');
}

console.log('[MSAL-CONFIG] Configuração:', {
  cloudInstance,
  tenantId,
  clientId: clientId ? `${clientId.substring(0, 8)}...` : 'não definido',
  redirectUri,
});

/**
 * Configuração do MSAL para o navegador
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || '',
    authority: `${cloudInstance}${tenantId || 'common'}`,
    redirectUri: redirectUri,
    postLogoutRedirectUri: postLogoutRedirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Mais seguro que localStorage
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message);
            break;
          case LogLevel.Warning:
            console.warn('[MSAL]', message);
            break;
          case LogLevel.Info:
            console.info('[MSAL]', message);
            break;
          case LogLevel.Verbose:
            console.debug('[MSAL]', message);
            break;
        }
      },
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
    allowNativeBroker: false,
  },
};

/**
 * Scopes necessários para autenticação e acesso ao Microsoft Graph
 */
export const loginRequest: RedirectRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

/**
 * Scopes para aquisição silenciosa de token
 */
export const silentRequest: SilentRequest = {
  scopes: ['User.Read'],
  forceRefresh: false,
};

/**
 * Scopes para acesso ao Microsoft Graph API
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphPhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
  graphManagerEndpoint: 'https://graph.microsoft.com/v1.0/me/manager',
};

/**
 * Instância singleton do MSAL
 */
let msalInstance: PublicClientApplication | null = null;

/**
 * Obtém ou cria a instância do MSAL
 */
export const getMsalInstance = (): PublicClientApplication => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    console.log('[MSAL-CONFIG] ✅ Instância MSAL criada');
  }
  return msalInstance;
};

/**
 * Inicializa a instância do MSAL (deve ser chamada antes de usar)
 */
export const initializeMsal = async (): Promise<PublicClientApplication> => {
  const instance = getMsalInstance();
  await instance.initialize();
  console.log('[MSAL-CONFIG] ✅ MSAL inicializado');
  return instance;
};

/**
 * Busca dados do usuário no Microsoft Graph
 */
export const fetchGraphData = async (accessToken: string, endpoint: string): Promise<any> => {
  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[GRAPH-API] Erro ao buscar dados:', error);
    throw error;
  }
};

/**
 * Busca a foto do perfil do usuário
 */
export const fetchUserPhoto = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(graphConfig.graphPhotoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.log('[GRAPH-API] Foto não disponível');
    return null;
  }
};

export default msalConfig;
