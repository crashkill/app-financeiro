/**
 * Página de Login com Azure AD
 * 
 * Este componente implementa a tela de login usando Azure AD (MSAL).
 * Baseado no modelo login-simple.ejs - com formulário email/senha.
 * Ao submeter, o email é passado como loginHint para o Azure AD.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthProviderSwitch';
import '../styles/login.css';

const LoginAzure = () => {
    const navigate = useNavigate();
    const auth = useAuth() as any; // Type assertion para compatibilidade

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Verificar se é Azure ou Supabase
    const isAzureAuth = 'isAuthenticated' in auth;
    const isAuthenticated = isAzureAuth ? auth.isAuthenticated : !!auth.user;
    const isLoading = auth.isLoading;
    const user = auth.user;

    // Redirecionar para dashboard se já estiver autenticado
    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('[LOGIN-AZURE] Usuário já autenticado, redirecionando para dashboard');
            navigate('/dashboard');
        }
    }, [isAuthenticated, user, navigate]);

    const validateForm = () => {
        const errors: { email?: string; password?: string } = {};
        if (!email) errors.email = 'E-mail é obrigatório';
        if (!password) errors.password = 'Senha é obrigatória';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        console.log('[LOGIN-AZURE] Iniciando fluxo de login com email:', email);
        setIsSubmitting(true);
        setError('');

        try {
            if (isAzureAuth) {
                // Para Azure AD, chamamos login(email) que irá redirecionar para Microsoft
                await auth.login(email);
            } else {
                // Para Supabase, chamamos login(email, password)
                await auth.login(email, password);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('[LOGIN-AZURE] Erro no login:', err);
            setError('Email ou senha inválidos');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            {/* Background Orbs */}
            <div className="background-orbs">
                {/* Red Orb Top Right */}
                <div className="orb orb-red-top"></div>
                {/* Blue Orb Bottom Left */}
                <div className="orb orb-blue-bottom"></div>
                {/* Small Red Orb */}
                <div className="orb orb-red-small"></div>
            </div>

            {/* Login Card */}
            <div className="login-card">
                {/* Logo */}
                <div className="logo-section">
                    <h1 className="logo-text">
                        <span className="logo-global">Global</span>
                        <span className="logo-hitss">hitss</span>
                    </h1>
                    <p className="logo-subtitle">Autenticação Corporativa</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-alert">
                        <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                            className={`field-input ${validationErrors.email ? 'input-error' : ''}`}
                            placeholder="nome@globalhitss.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {validationErrors.email && (
                            <span className="validation-error">{validationErrors.email}</span>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="form-field">
                        <label htmlFor="password" className="field-label">
                            Senha
                        </label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                required
                                autoComplete="current-password"
                                className={`field-input ${validationErrors.password ? 'input-error' : ''}`}
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {validationErrors.password && (
                            <span className="validation-error">{validationErrors.password}</span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading || isSubmitting}
                    >
                        {(isLoading || isSubmitting) ? (
                            <>
                                <span className="loading-spinner"></span>
                                Entrando...
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">
                    <div className="divider-line"></div>
                    <span className="divider-text">SEGURANÇA</span>
                    <div className="divider-line"></div>
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
            <footer className="login-footer">
                <p>&copy; 2026 Globalhitss. Divisão de Tecnologia Imperial.</p>
            </footer>
        </div>
    );
};

export default LoginAzure;
