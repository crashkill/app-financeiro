/**
 * AuthContext com Azure AD
 * 
 * Este contexto substitui a autenticação Supabase por Azure AD usando MSAL.
 * Mantém a mesma interface do AuthContext original para facilitar a migração.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AccountInfo, InteractionStatus, InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal, useIsAuthenticated, MsalProvider } from '@azure/msal-react';
import { getMsalInstance, initializeMsal, loginRequest, silentRequest, graphConfig, fetchGraphData, fetchUserPhoto } from '../lib/msalConfig';

/**
 * Interface do usuário Azure AD
 * Compatível com a interface anterior do Supabase para facilitar migração
 */
export interface AzureUser {
    id: string;
    email: string;
    name: string;
    givenName?: string;
    surname?: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
    mobilePhone?: string;
    companyName?: string;
    photo?: string | null;
    manager?: {
        id: string;
        displayName: string;
        email: string;
        jobTitle?: string;
    } | null;
    user_metadata?: {
        role?: string;
        [key: string]: any;
    };
}

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
    user: AzureUser | null;
    account: AccountInfo | null;
    accessToken: string | null;
    isAdmin: boolean;
    isDemo: boolean;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email?: string) => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider interno que usa os hooks do MSAL
 */
const AuthProviderInternal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [user, setUser] = useState<AzureUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Obtém o token de acesso silenciosamente
     */
    const getAccessToken = useCallback(async (): Promise<string | null> => {
        if (accounts.length === 0) {
            console.log('[AUTH-AZURE] Nenhuma conta disponível');
            return null;
        }

        try {
            const response = await instance.acquireTokenSilent({
                ...silentRequest,
                account: accounts[0],
            });

            setAccessToken(response.accessToken);
            return response.accessToken;
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                console.log('[AUTH-AZURE] Token expirado, redirecionando para login');
                await instance.acquireTokenRedirect(loginRequest);
            }
            console.error('[AUTH-AZURE] Erro ao obter token:', error);
            return null;
        }
    }, [instance, accounts]);

    /**
     * Busca dados completos do usuário no Microsoft Graph
     */
    const fetchUserProfile = useCallback(async (token: string): Promise<AzureUser | null> => {
        try {
            // Buscar perfil básico
            const profile = await fetchGraphData(token, graphConfig.graphMeEndpoint + '?$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,companyName');

            // Buscar foto
            const photo = await fetchUserPhoto(token);

            // Buscar gerente
            let manager = null;
            try {
                const managerData = await fetchGraphData(token, graphConfig.graphManagerEndpoint);
                if (managerData) {
                    manager = {
                        id: managerData.id,
                        displayName: managerData.displayName,
                        email: managerData.mail || managerData.userPrincipalName,
                        jobTitle: managerData.jobTitle,
                    };
                }
            } catch {
                console.log('[AUTH-AZURE] Gerente não disponível');
            }

            const azureUser: AzureUser = {
                id: profile.id,
                email: profile.mail || profile.userPrincipalName,
                name: profile.displayName,
                givenName: profile.givenName,
                surname: profile.surname,
                jobTitle: profile.jobTitle,
                department: profile.department,
                officeLocation: profile.officeLocation,
                mobilePhone: profile.mobilePhone,
                companyName: profile.companyName,
                photo,
                manager,
                user_metadata: {
                    // Usuários com email @hitss são considerados admin
                    role: profile.mail?.endsWith('@hitss.com.br') ? 'admin' : 'user',
                },
            };

            console.log('[AUTH-AZURE] Perfil do usuário carregado:', azureUser.email);
            return azureUser;
        } catch (error) {
            console.error('[AUTH-AZURE] Erro ao buscar perfil:', error);
            return null;
        }
    }, []);

    /**
     * Atualiza os dados do usuário
     */
    const refreshUserData = useCallback(async () => {
        const token = await getAccessToken();
        if (token) {
            const profile = await fetchUserProfile(token);
            setUser(profile);
        }
    }, [getAccessToken, fetchUserProfile]);

    /**
     * Efeito para carregar dados do usuário quando autenticado
     */
    useEffect(() => {
        const loadUserData = async () => {
            if (inProgress !== InteractionStatus.None) {
                return;
            }

            if (isAuthenticated && accounts.length > 0) {
                console.log('[AUTH-AZURE] Usuário autenticado, carregando dados');
                setIsLoading(true);

                const token = await getAccessToken();
                if (token) {
                    const profile = await fetchUserProfile(token);
                    setUser(profile);
                }

                setIsLoading(false);
            } else {
                setUser(null);
                setAccessToken(null);
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [isAuthenticated, accounts, inProgress, getAccessToken, fetchUserProfile]);

    /**
     * Inicia o fluxo de login
     */
    const login = useCallback(async (email?: string) => {
        console.log('[AUTH-AZURE] Iniciando login', email ? `com hint: ${email}` : '');
        setIsLoading(true);

        try {
            const request = {
                ...loginRequest,
                loginHint: email, // Pré-preenche o email no Azure AD
            };
            await instance.loginRedirect(request);
        } catch (error) {
            console.error('[AUTH-AZURE] Erro no login:', error);
            setIsLoading(false);
            throw error;
        }
    }, [instance]);

    /**
     * Realiza o logout
     */
    const logout = useCallback(async () => {
        console.log('[AUTH-AZURE] Realizando logout');

        try {
            await instance.logoutRedirect({
                postLogoutRedirectUri: window.location.origin,
            });
        } catch (error) {
            console.error('[AUTH-AZURE] Erro no logout:', error);
            throw error;
        }
    }, [instance]);

    // Verificar se é admin baseado no email
    const isAdmin = user?.email?.endsWith('@hitss.com.br') ||
        user?.user_metadata?.role === 'admin' ||
        false;

    return (
        <AuthContext.Provider
            value={{
                user,
                account: accounts[0] || null,
                accessToken,
                isAdmin,
                isDemo: false,
                isLoading: isLoading || inProgress !== InteractionStatus.None,
                isAuthenticated,
                login,
                logout,
                getAccessToken,
                refreshUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Provider principal que inicializa o MSAL
 */
export const AuthProviderAzure: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [msalInstance, setMsalInstance] = useState<any>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            try {
                const instance = await initializeMsal();

                // Processar redirecionamento de login (se houver)
                await instance.handleRedirectPromise();

                setMsalInstance(instance);
                setIsInitializing(false);
                console.log('[AUTH-AZURE] MSAL Provider inicializado');
            } catch (error) {
                console.error('[AUTH-AZURE] Erro ao inicializar MSAL:', error);
                setIsInitializing(false);
            }
        };

        initialize();
    }, []);

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p>Inicializando autenticação...</p>
                </div>
            </div>
        );
    }

    if (!msalInstance) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-red-500 text-center">
                    <p>Erro ao inicializar autenticação</p>
                    <p className="text-sm text-gray-400 mt-2">Verifique as configurações do Azure AD</p>
                </div>
            </div>
        );
    }

    return (
        <MsalProvider instance={msalInstance}>
            <AuthProviderInternal>{children}</AuthProviderInternal>
        </MsalProvider>
    );
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuthAzure = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthAzure must be used within an AuthProviderAzure');
    }
    return context;
};

// Exportar também com nome compatível com o contexto anterior
export const useAuth = useAuthAzure;
export const AuthProvider = AuthProviderAzure;

export default AuthProviderAzure;
