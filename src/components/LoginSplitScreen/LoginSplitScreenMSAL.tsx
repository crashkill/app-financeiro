/**
 * LoginSplitScreenMSAL Component
 * 
 * Versão do LoginSplitScreen que usa o AuthContext integrado.
 * Funciona com tanto Supabase quanto Azure AD dependendo da configuração.
 * 
 * Features:
 * - Split Screen: Formulário (esquerda) + SSO Microsoft (direita)
 * - Glassmorphism + Animações de orbs flutuantes
 * - Integração com AuthProviderSwitch (Supabase/Azure)
 * - MFA obrigatório via Microsoft Authenticator (Azure)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProviderSwitch';
import './login-splitscreen.css';

interface LoginSplitScreenMSALProps {
    /** Rota para redirecionar após login (default: /dashboard) */
    redirectTo?: string;
}

const LoginSplitScreenMSAL = ({
    redirectTo = '/dashboard'
}: LoginSplitScreenMSALProps) => {
    const navigate = useNavigate();
    const auth = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Determinar se está autenticado (compatível com ambos contextos)
    const isAuthenticated = !!(auth.user);

    // Redirecionar se já autenticado
    useEffect(() => {
        if (isAuthenticated) {
            console.log('[LOGIN] Usuário já autenticado, redirecionando...');
            navigate(redirectTo);
        }
    }, [isAuthenticated, navigate, redirectTo]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('E-mail é obrigatório');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            console.log('[LOGIN] Iniciando login...');
            // Login com email e password (funciona com Supabase)
            // Para Azure, o password é ignorado e o MSAL redireciona
            await auth.login(email, password);
        } catch (err: any) {
            console.error('[LOGIN] Erro:', err);
            setError(err?.message || 'Falha na autenticação. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    const handleMicrosoftLogin = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            console.log('[LOGIN] Iniciando SSO Microsoft...');
            // Para Azure AD, login sem parâmetros inicia o fluxo SSO
            // Para Supabase, isso pode falhar - usar botão principal
            await auth.login(email || '', '');
        } catch (err: any) {
            console.error('[LOGIN] Erro SSO:', err);
            setError(err?.message || 'Falha no SSO. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    const isLoading = auth.isLoading || isSubmitting;

    // Loading state
    if (auth.isLoading) {
        return (
            <div className="login-splitscreen-page">
                <div className="splitscreen-loading">
                    <Loader2 className="loading-icon" />
                    <p>Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-splitscreen-page">
            {/* Background Decoration */}
            <div className="background-decoration">
                <div className="animated-orb orb-red-top" />
                <div className="animated-orb orb-blue-bottom" />
            </div>

            {/* Login Card Container */}
            <div className="splitscreen-card">

                {/* Left Side: Custom Credentials Form */}
                <div className="card-left">
                    <div className="form-header">
                        <h2 className="form-title">Acesso Imperial</h2>
                        <p className="form-subtitle">Identifique-se para acessar o sistema.</p>
                    </div>

                    <form onSubmit={handleFormSubmit} className="credentials-form">
                        {/* Email Field */}
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">
                                E-mail Corporativo
                            </label>
                            <input
                                type="email"
                                name="username"
                                id="username"
                                required
                                className="form-input"
                                placeholder="nome@globalhitss.com.br"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Chave de Acesso
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="error-message">
                                <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="btn-loader" />
                                    <span>Autenticando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Prosseguir</span>
                                    <svg className="btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mfa-notice">
                        Atenção: Ao clicar em prosseguir, você será redirecionado para a validação biométrica/MFA da Microsoft.
                    </div>
                </div>

                {/* Right Side: Microsoft SSO */}
                <div className="card-right">
                    {/* Decorator Icon */}
                    <div className="decorator-icon">
                        <svg className="icon-imperial" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                        </svg>
                    </div>

                    <div className="sso-content">
                        <h1 className="brand-logo">
                            <span className="brand-global">Global</span>
                            <span className="brand-hitss">hitss</span>
                        </h1>
                        <p className="sso-subtitle">Single Sign-On (SSO)</p>
                    </div>

                    <button
                        type="button"
                        className="microsoft-btn"
                        onClick={handleMicrosoftLogin}
                        disabled={isLoading}
                    >
                        <svg className="microsoft-icon" viewBox="0 0 21 21" fill="currentColor">
                            <path d="M10.5 0L10.5 10.5L21 10.5L21 0L10.5 0ZM0 0L0 10.5L10.5 10.5L10.5 0L0 0ZM0 21L10.5 21L10.5 10.5L0 10.5L0 21ZM10.5 21L21 21L21 10.5L10.5 10.5L10.5 21Z" />
                        </svg>
                        <span>Entrar com Microsoft</span>
                    </button>

                    <p className="sso-footer">
                        Autenticação federada obrigatória.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="page-footer">
                © 2026 Globalhitss. Todos os direitos reservados.
            </footer>
        </div>
    );
};

export default LoginSplitScreenMSAL;
