/**
 * AuthContext para Express Server (Login - Microsoft)
 * 
 * Este contexto lê os dados de autenticação do localStorage
 * após o login via servidor Express + Azure AD.
 * 
 * Não usa MSAL diretamente - depende do servidor Express para autenticação.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Interface do usuário autenticado via Express
 */
export interface ExpressUser {
    id: string;
    email: string;
    name: string;
    givenName?: string;
    surname?: string;
    jobTitle?: string;
    department?: string;
    companyName?: string;
    employeeId?: string;
    photo?: string | null;
}

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
    user: ExpressUser | null;
    accessToken: string | null;
    isAdmin: boolean;
    isDemo: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// URL do servidor de autenticação Express
const AUTH_SERVER_URL = 'https://localhost:3000';

export const AuthProviderExpress: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<ExpressUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Carrega dados do localStorage na inicialização
     */
    useEffect(() => {
        const loadStoredAuth = () => {
            try {
                const storedUser = localStorage.getItem('azureUser');
                const storedToken = localStorage.getItem('accessToken');
                const tokenExpiry = localStorage.getItem('tokenExpiresOn');

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser) as ExpressUser;
                    setUser(parsedUser);
                    console.log('[AUTH-EXPRESS] Usuário carregado do localStorage:', parsedUser.email);
                }

                if (storedToken) {
                    // Verificar se o token não expirou
                    if (tokenExpiry) {
                        const expiryDate = new Date(tokenExpiry);
                        if (expiryDate > new Date()) {
                            setAccessToken(storedToken);
                            console.log('[AUTH-EXPRESS] Token válido encontrado');
                        } else {
                            console.log('[AUTH-EXPRESS] Token expirado, limpando...');
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('tokenExpiresOn');
                        }
                    } else {
                        setAccessToken(storedToken);
                    }
                }
            } catch (error) {
                console.error('[AUTH-EXPRESS] Erro ao carregar autenticação:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    /**
     * Login - redireciona para o servidor Express
     */
    const login = async (email: string, _password: string) => {
        console.log('[AUTH-EXPRESS] Redirecionando para servidor de autenticação...');

        // URL de retorno para o app-financeiro após autenticação
        const returnUrl = `${window.location.origin}/dashboard`;

        // Redirecionar para o servidor Express
        window.location.href = `${AUTH_SERVER_URL}/auth/signin?username=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(returnUrl)}`;
    };

    /**
     * Logout - limpa localStorage e redireciona
     */
    const logout = async () => {
        console.log('[AUTH-EXPRESS] Realizando logout...');

        // Limpar localStorage
        localStorage.removeItem('azureUser');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenExpiresOn');

        // Atualizar estado
        setUser(null);
        setAccessToken(null);

        // Opcionalmente, fazer logout no servidor Express também
        // window.location.href = `${AUTH_SERVER_URL}/auth/signout`;
    };

    // Verificar se é admin baseado no email
    const isAdmin = user?.email?.endsWith('@hitss.com.br') || false;

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isAdmin,
                isDemo: false,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuthExpress = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthExpress must be used within an AuthProviderExpress');
    }
    return context;
};

// Exportar também com nomes compatíveis
export const useAuth = useAuthExpress;
export const AuthProvider = AuthProviderExpress;

export default AuthProviderExpress;
