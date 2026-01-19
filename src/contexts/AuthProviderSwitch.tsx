/**
 * Auth Provider Switch
 * 
 * Este arquivo permite alternar entre os provedores de autenticação:
 * - Supabase (legado)
 * - Azure AD via MSAL (browser)
 * - Express (servidor Express + Azure AD)
 * 
 * Configure a variável de ambiente VITE_AUTH_PROVIDER para alternar:
 * - 'express' = usar Azure AD via servidor Express (recomendado)
 * - 'azure' = usar Azure AD via MSAL direto
 * - 'supabase' = usar Supabase (padrão/fallback)
 */

// Importar todos os provedores
import { AuthProvider as AuthProviderSupabase, useAuth as useAuthSupabase } from './AuthContext';
import { AuthProviderAzure, useAuthAzure } from './AuthContextAzure';
import { AuthProviderExpress, useAuthExpress } from './AuthContextExpress';

// Determinar qual provedor usar baseado na variável de ambiente
const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';

console.log(`[AUTH-SWITCH] Usando provedor de autenticação: ${authProvider}`);

/**
 * Selecionar o AuthProvider correto
 */
const getAuthProvider = () => {
    switch (authProvider) {
        case 'express':
            return AuthProviderExpress;
        case 'azure':
            return AuthProviderAzure;
        case 'supabase':
        default:
            return AuthProviderSupabase;
    }
};

/**
 * Selecionar o hook useAuth correto
 */
const getUseAuth = () => {
    switch (authProvider) {
        case 'express':
            return useAuthExpress;
        case 'azure':
            return useAuthAzure;
        case 'supabase':
        default:
            return useAuthSupabase;
    }
};

/**
 * AuthProvider que alterna entre os provedores
 */
export const AuthProvider = getAuthProvider();

/**
 * Hook useAuth que alterna entre os hooks
 */
export const useAuth = getUseAuth();

// Re-exportar tipos úteis
export type { AzureUser } from './AuthContextAzure';
export type { ExpressUser } from './AuthContextExpress';

export default AuthProvider;
