/**
 * LoginSimple Component
 * 
 * Componente de login simplificado baseado no login-simple.ejs
 * Design: Card centralizado com email/senha
 * 
 * Features:
 * - Card Glassmorphism centralizado
 * - Campos: E-mail Corporativo + Senha
 * - Animações de orbs flutuantes
 * - Integração com Azure AD via servidor Express (Porta 3000)
 * - MFA obrigatório via Microsoft Authenticator
 * 
 * @requires Servidor Express rodando em https://localhost:3000
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth as useAuthContext } from '../../contexts/AuthProviderSwitch';
import './login-simple.css';

// URL do servidor de autenticação Express
// Agora configurado via variável de ambiente, fallback para localhost:3000
const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'https://localhost:3000';

interface LoginSimpleProps {
    /** URL customizada do servidor de autenticação (opcional) */
    authServerUrl?: string;
    /** Rota para redirecionar após login (default: /dashboard) */
    redirectTo?: string;
}

const LoginSimple = ({
    authServerUrl = AUTH_SERVER_URL,
    redirectTo = '/dashboard'
}: LoginSimpleProps) => {
    // Obter contexto de autenticação
    const auth = useAuthContext();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [error, setError] = useState('');

    // Verificar se já existe usuário autenticado
    useEffect(() => {
        // Se já estiver logado via contexto, redirecionar
        if (auth.user) {
            console.log('[LOGIN] Usuário autenticado, redirecionando...');
            navigate(redirectTo);
            return;
        }

        const checkLocalAuth = () => {
            try {
                // Verificar token na URL (retorno do Express)
                const urlParams = new URLSearchParams(window.location.search);
                const authToken = urlParams.get('authToken');

                if (authToken) {
                    console.log('[LOGIN] Token recebido via URL, processando...');
                    try {
                        // Decodificar token base64
                        const tokenData = JSON.parse(atob(authToken));

                        // Salvar no localStorage
                        if (tokenData && tokenData.user) {
                            // Salvar dados no formato esperado pelo AuthContext
                            localStorage.setItem('azureUser', JSON.stringify(tokenData.user));
                            localStorage.setItem('azureAccessToken', tokenData.accessToken || '');

                            // Recarregar para atualizar contexto ou navegar
                            window.location.href = redirectTo;
                            return;
                        }
                    } catch (e) {
                        console.error('[LOGIN] Erro ao decodificar token:', e);
                    }
                }

                // Verificar localStorage
                const storedUser = localStorage.getItem('azureUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    if (user && user.email) {
                        console.log('[LOGIN] Usuário encontrado no localStorage, redirecionando...');
                        navigate(redirectTo);
                        return;
                    }
                }
            } catch (err) {
                console.error('[LOGIN] Erro ao verificar sessão:', err);
            }
            setIsCheckingSession(false);
        };

        checkLocalAuth();
    }, [navigate, redirectTo, auth.user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('E-mail é obrigatório');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('[LOGIN] Redirecionando para servidor de autenticação Express...');

            // URL de retorno para o app-financeiro (Porta 3001) - Alterado para /login para processar o token
            const returnUrl = `${window.location.origin}/login`;

            // Garantir que estamos apontando para o servidor correto
            const serverUrl = authServerUrl.endsWith('/') ? authServerUrl.slice(0, -1) : authServerUrl;

            // Redirecionar para o servidor Express com login hint e URL de retorno
            window.location.href = `${serverUrl}/auth/signin?username=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(returnUrl)}`;

        } catch (err: any) {
            console.error('[LOGIN] Erro no login:', err);
            setError(err.message || 'Erro ao iniciar login. Tente novamente.');
            setIsLoading(false);
        }
    };

    // Loading state enquanto verifica sessão
    if (isCheckingSession) {
        return (
            <div className="login-simple-page">
                <div className="login-loading">
                    <Loader2 className="loading-spinner" />
                    <p>Verificando sessão...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-simple-page">
            {/* Background Orbs */}
            <div className="background-orbs">
                <div className="orb orb-red" />
                <div className="orb orb-blue" />
                <div className="orb orb-small" />
            </div>

            {/* Login Card */}
            <div className="login-card">
                {/* Logo */}
                <div className="logo-section">
                    <h1 className="logo">
                        <span className="logo-global">Global</span>
                        <span className="logo-hitss">hitss</span>
                    </h1>
                    <p className="logo-subtitle">Autenticação Corporativa</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-alert">
                        <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    {/* Email Field */}
                    <div className="form-field">
                        <label htmlFor="username" className="field-label">
                            E-mail Corporativo
                        </label>
                        <input
                            type="email"
                            name="username"
                            id="username"
                            required
                            autoComplete="email"
                            className="field-input"
                            placeholder="nome@globalhitss.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="form-field">
                        <label htmlFor="password" className="field-label">
                            Senha
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            autoComplete="current-password"
                            className="field-input"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="button-spinner" />
                                Redirecionando...
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">
                    <div className="divider-line" />
                    <span className="divider-text">SEGURANÇA</span>
                    <div className="divider-line" />
                </div>

                {/* Security Notice */}
                <div className="security-notice">
                    <p className="notice-text">
                        Ao clicar em <strong>Entrar</strong>, você será redirecionado para validação
                        via <span className="mfa-highlight">Microsoft Authenticator</span> (MFA).
                    </p>
                    <p className="notice-subtext">
                        Protegido por Azure Active Directory
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="page-footer">
                <p>© 2026 Globalhitss. Divisão de Tecnologia Imperial.</p>
            </footer>
        </div>
    );
};

export default LoginSimple;
